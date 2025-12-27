const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const PRICES_PATH = path.join(DATA_DIR, 'prices.json');
const SECRETS_PATH = path.join(DATA_DIR, 'secrets.json');
const AUTH_COOKIE = 'calc_auth';
const AUTH_SECRET = process.env.APP_AUTH_SECRET || 'calc-auth';

const defaultPrices = {
  materials: [
    { id: 'pvc08', label: 'PVC 0.8 mm', pricePerM2: 1400 },
    { id: 'pvc10', label: 'PVC 1.0 mm', pricePerM2: 1600 },
    { id: 'softglass', label: 'Softglass', pricePerM2: 1900 }
  ],
  edging: {
    pricePerM: 80,
    options: [80, 100, 120],
    colors: [
      { id: 'black', label: 'Black', fill: '#2a2f38', stroke: '#1f2937' },
      { id: 'white', label: 'White', fill: '#e5e7eb', stroke: '#cbd5e1' },
      { id: 'brown', label: 'Brown', fill: '#6b4b32', stroke: '#4b3626' }
    ]
  },
  laborPricePerM2: 300,
  grommetStepOptions: [20, 30, 40],
  hardware: [
    { id: 'grommet10', label: 'Grommet 10 mm', pricePerPiece: 44 },
    { id: 'bracket', label: 'Bracket with hook', pricePerPiece: 112 },
    { id: 'metal-rotary', label: 'Metal rotary latch', pricePerPiece: 143 },
    { id: 'plastic-rotary', label: 'Plastic rotary latch', pricePerPiece: 95 }
  ],
  extras: {
    patchPrice: 80,
    cutoutPrice: 120,
    zipperPrice: 350,
    skirtPricePerM: 250
  },
  defaults: {
    widthCm: 200,
    heightCm: 200,
    edgingPricePerM: 80,
    grommetStep: 30
  }
};

const defaultSecrets = {
  priceEditorPassword: process.env.PRICE_EDITOR_PASSWORD || 'changeme',
  appPassword: process.env.APP_PASSWORD || 'calcpass'
};

const shapeNames = {
  rect: 'Rectangle',
  trapezoid: 'Trapezoid',
  angledRight: 'Angled right',
  angledLeft: 'Angled left',
  triangle: 'Triangle'
};

function ensureDataFolder() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function ensureDataFile(filePath, defaultData) {
  ensureDataFolder();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

function readJson(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Cannot read ${filePath}, using fallback`, e.message);
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDataFolder();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

ensureDataFile(PRICES_PATH, defaultPrices);
ensureDataFile(SECRETS_PATH, defaultSecrets);

function getSecrets() {
  const secrets = readJson(SECRETS_PATH, defaultSecrets) || {};
  let changed = false;
  if (!secrets.appPassword) {
    secrets.appPassword = defaultSecrets.appPassword;
    changed = true;
  }
  if (!secrets.priceEditorPassword) {
    secrets.priceEditorPassword = defaultSecrets.priceEditorPassword;
    changed = true;
  }
  if (changed) {
    writeJson(SECRETS_PATH, secrets);
  }
  return secrets;
}

function hashToken(password) {
  return crypto.createHash('sha256').update(String(password || '') + AUTH_SECRET).digest('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, pair) => {
    const [k, v] = pair.split('=').map((s) => s && s.trim());
    if (k) acc[k] = decodeURIComponent(v || '');
    return acc;
  }, {});
}

function isAuthorized(req) {
  const cookies = parseCookies(req);
  const token = cookies[AUTH_COOKIE];
  if (!token) return false;
  const secrets = getSecrets();
  return token === hashToken(secrets.appPassword);
}

function loginPage() {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Вход | Калькулятор</title>
  <style>
    body{font-family:Arial, sans-serif;background:#e5e7eb;margin:0;display:flex;align-items:center;justify-content:center;height:100vh;}
    .card{background:#fff;border-radius:12px;padding:24px 28px;width:320px;box-shadow:0 10px 40px rgba(15,23,42,0.18);}
    h1{margin:0 0 12px;font-size:20px;color:#0f172a;}
    p{margin:0 0 16px;color:#475569;font-size:13px;}
    label{display:block;font-size:12px;margin-bottom:6px;color:#334155;}
    input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #cbd5e1;font-size:14px;box-sizing:border-box;}
    button{margin-top:14px;width:100%;padding:10px 12px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:14px;cursor:pointer;}
    .error{margin-top:10px;color:#b91c1c;font-size:12px;min-height:16px;}
  </style>
</head>
<body>
  <div class="card">
    <h1>Вход</h1>
    <p>Введите пароль, чтобы открыть калькулятор.</p>
    <label for="appPassword">Пароль</label>
    <input id="appPassword" type="password" autocomplete="current-password" />
    <button id="loginBtn">Войти</button>
    <div class="error" id="loginErr"></div>
  </div>
  <script>
    const btn = document.getElementById('loginBtn');
    const pwd = document.getElementById('appPassword');
    const err = document.getElementById('loginErr');
    async function doLogin(){
      err.textContent = '';
      const password = pwd.value || '';
      if (!password) { err.textContent = 'Введите пароль'; return; }
      try {
        const resp = await fetch('/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password })});
        if (!resp.ok) {
          const body = await resp.json().catch(()=>({}));
          throw new Error(body.error || 'Ошибка авторизации');
        }
        window.location.href = '/';
      } catch(e){ err.textContent = e.message; }
    }
    btn.addEventListener('click', doLogin);
    pwd.addEventListener('keydown', (e)=>{ if(e.key==='Enter') doLogin(); });
    pwd.focus();
  </script>
</body>
</html>`;
}

app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body || {};
  const secrets = getSecrets();
  const appPassword = secrets.appPassword || defaultSecrets.appPassword;
  if (!password || password !== appPassword) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = hashToken(appPassword);
  res.setHeader('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}`);
  return res.json({ ok: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ ok: true, authorized: isAuthorized(req) });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next();
  if (isAuthorized(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  return next();
});

app.get('/api/prices', (req, res) => {
  const prices = readJson(PRICES_PATH, defaultPrices);
  res.json(prices);
});

app.post('/api/prices', (req, res) => {
  const { password, data } = req.body || {};
  const secrets = getSecrets();

  if (secrets.priceEditorPassword && password !== secrets.priceEditorPassword) {
    return res.status(401).json({ error: 'Wrong password for price editor' });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Missing data to save' });
  }

  try {
    writeJson(PRICES_PATH, data);
    return res.json({ ok: true });
  } catch (e) {
    console.error('Save prices failed:', e);
    return res.status(500).json({ error: 'Unable to save prices file' });
  }
});

app.post('/api/prices/password', (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const secrets = getSecrets();

  if (secrets.priceEditorPassword && currentPassword !== secrets.priceEditorPassword) {
    return res.status(401).json({ error: 'Wrong current password' });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters' });
  }

  const updated = { ...secrets, priceEditorPassword: newPassword.trim() };

  try {
    writeJson(SECRETS_PATH, updated);
    return res.json({ ok: true });
  } catch (e) {
    console.error('Save password failed:', e);
    return res.status(500).json({ error: 'Unable to save password' });
  }
});

app.post('/api/calc', (req, res) => {
  const body = req.body || {};
  const pricing = readJson(PRICES_PATH, defaultPrices);

  try {
    const shape = body.shape || 'rect';
    const widthCm = Number(body.widthCm || body.width) || 0;
    const heightCm = Number(body.heightCm || body.height) || 0;
    const topDelta = Number(body.topDelta) || 0;
    const flatTopHeight = Number(body.flatTopHeight) || 0;
    const grommetStep =
      Number(body.grommetStep) ||
      pricing?.defaults?.grommetStep ||
      pricing?.grommetStepOptions?.[0] ||
      30;

    if (!widthCm || !heightCm) {
      return res.status(400).json({ error: 'Width and height are required' });
    }

    const materials = Array.isArray(pricing?.materials) ? pricing.materials : [];
    const materialId = body.materialId || body.material || (materials[0] && materials[0].id);
    const material = materials.find((m) => m.id === materialId) || materials[0];
    const materialPrice = Number(material?.pricePerM2) || 0;
    const materialName = material?.label || materialId || 'Material';

    const edgingPricePerM = Number(
      body.edgingPricePerM ||
      pricing?.edging?.pricePerM ||
      pricing?.defaults?.edgingPricePerM ||
      0
    );

    const edgingColors = Array.isArray(pricing?.edging?.colors) ? pricing.edging.colors : [];
    const edgingColorKey = body.edgingColor || (edgingColors[0] && edgingColors[0].id) || 'black';
    const edgingColorMeta = edgingColors.find((c) => c.id === edgingColorKey) || { label: edgingColorKey };
    const edgingColorLabel = edgingColorMeta.label || edgingColorKey;

    const skirtHeight = Number(body.skirtHeight) || 0;
    const patchCount = Number(body.patchCount) || 0;
    const sideCutouts = Number(body.sideCutouts) || 0;
    const hasZipper = !!body.hasZipper;
    const hasPocket = !!body.hasPocket;
    const pocketSize = body.pocketSize || null;

    const widthM = widthCm / 100;
    const heightM = heightCm / 100;
    const isAngled = shape === 'angledRight' || shape === 'angledLeft';

    let area = widthM * heightM;
    if (shape === 'trapezoid') {
      const topW = (widthCm - topDelta) / 100;
      area = ((widthM + topW) / 2) * heightM;
    }
    
    if (isAngled) {
      const tri = Math.max(0, (heightCm - flatTopHeight) / 100);
      area = widthM * heightM - (tri * tri) / 2;
    }
    if (shape === 'triangle') {
      area = (widthM * heightM) / 2;
    }

    if (skirtHeight > 0) {
      const skirtArea = (widthCm / 100) * (skirtHeight / 100);
      area += skirtArea;
    }

    const perimeterM = 2 * (widthM + heightM);
    const edgingCost = perimeterM * edgingPricePerM;
    const filmCost = area * materialPrice;
    const laborPricePerM2 = Number(body.laborPricePerM2) || pricing?.laborPricePerM2 || 0;
    const laborCost = area * laborPricePerM2;

    const grommetsCount = Math.max(4, Math.ceil((2 * (widthCm + heightCm)) / grommetStep));

    const hardwareList = Array.isArray(pricing?.hardware) ? pricing.hardware : [];
    const hardwareType = body.hardwareType || (hardwareList[0] && hardwareList[0].id) || 'grommet10';
    const hardwareFromList = hardwareList.find((h) => h.id === hardwareType);
    const hardwarePricePerPiece = Number(
      hardwareFromList?.pricePerPiece ||
      body.hardwarePricePerPiece ||
      0
    );
    const hardwareCost = grommetsCount * hardwarePricePerPiece;

    const extras = pricing?.extras || {};
    const patchPrice = Number(extras.patchPrice) || 80;
    const cutoutPrice = Number(extras.cutoutPrice) || 120;
    const zipperPrice = Number(extras.zipperPrice) || 350;
    const skirtPricePerM = Number(extras.skirtPricePerM) || 250;
    const patchCost = patchCount * patchPrice;
    const cutoutCost = sideCutouts * cutoutPrice;
    const zipperCost = hasZipper ? zipperPrice : 0;
    const skirtCost = skirtHeight > 0 ? widthM * skirtPricePerM : 0;
    const pocketCost = 0;

    const total = Math.round(
      filmCost +
        edgingCost +
        skirtCost +
        patchCost +
        cutoutCost +
        zipperCost +
        laborCost +
        pocketCost +
        hardwareCost
    );

    return res.json({
      ok: true,
      shape,
      shapeName: shapeNames[shape] || shape,
      widthCm,
      heightCm,
      area: +area.toFixed(2),
      filmCost: Math.round(filmCost),
      edgingCost: Math.round(edgingCost),
      skirtHeight,
      patchCount,
      sideCutouts,
      hasZipper,
      hasPocket,
      edgingColor: edgingColorKey,
      edgingColorLabel,
      pocketSize,
      total,
      materialName,
      materialId,
      grommetsCount,
      grommetStep,
      laborCost: Math.round(laborCost),
      skirtCost: Math.round(skirtCost),
      patchCost: Math.round(patchCost),
      cutoutCost: Math.round(cutoutCost),
      zipperCost: Math.round(zipperCost),
      hardwareCost: Math.round(hardwareCost),
      hardwarePricePerPiece,
      hardwareType,
      topDelta,
      flatTopHeight
    });
  } catch (err) {
    console.error('Calc failed', err);
    return res.status(500).json({ error: 'Calculation failed' });
  }
});

app.get(['/', '/index.html'], (req, res, next) => {
  if (!isAuthorized(req)) {
    return res.send(loginPage());
  }
  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  if (!isAuthorized(req)) {
    return res.send(loginPage());
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
