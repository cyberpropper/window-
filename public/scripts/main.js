// Core state and shared helpers
const ORDER_STORAGE_KEY = 'softglass_order_v1';
const FRAME_CM = 5;
const FRAME_THICKNESS = 14;

const DEFAULT_EDGING_COLOR = 'black';
const EDGING_COLORS = {
  black: { label: 'Черный', fill: '#2a2f38', stroke: '#1f2937' },
  white: { label: 'Белый', fill: '#e5e7eb', stroke: '#cbd5e1' },
  brown: { label: 'Коричневый', fill: '#6b4b32', stroke: '#4b3626' }
};

function getEdgingColorMeta(key) {
  return EDGING_COLORS[key] || EDGING_COLORS[DEFAULT_EDGING_COLOR];
}

let pricingData = null;
let formsInitialized = false;
let orderItems = [];
let lastCalc = null; // последний расчет из calcSoftWindow

// Базовое состояние UI
const windowState = {
  hasZipper: false,
  patchCount: 0,
  sideCutouts: 0,
  skirtHeight: 0,
  patchPositions: [],
  cutoutPositions: [],
  hasPocket: false,
  pocketSize: null,
  hardwareType: 'grommet10',
  hardwarePricePerPiece: 44,
  zippersCount: 0,
  zippersColor: DEFAULT_EDGING_COLOR,
  edgingColor: DEFAULT_EDGING_COLOR,
  patchPolygons: [],
  cutoutPolygons: []
};

/* ============================================
  Утилиты
============================================ */
function v(id) {
  return document.getElementById(id)?.value;
}

function num(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return +el.value || 0;
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el || value === undefined || value === null || Number.isNaN(value)) return;
  el.value = value;
}

function showBlock(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
}

function updateSkirtFromInput() {
  const h = +document.getElementById('skirtHeightInput').value || 0;
  windowState.skirtHeight = h;
  if (typeof calcSoftWindow === 'function') {
    calcSoftWindow();
  }
}

function setResult(html) {
  const block = document.getElementById('result-window');
  if (block) block.innerHTML = html;
}

// SVG helper
function makeSVG(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

// стрелка для размерных линеек
function makeArrow(x, y, dir) {
  const s = 5;
  let d = '';
  if (dir === 'left') d = `M ${x + s} ${y - s} L ${x} ${y} L ${x + s} ${y + s}`;
  if (dir === 'right') d = `M ${x - s} ${y - s} L ${x} ${y} L ${x - s} ${y + s}`;
  if (dir === 'up') d = `M ${x - s} ${y + s} L ${x} ${y} L ${x + s} ${y + s}`;
  if (dir === 'down') d = `M ${x - s} ${y - s} L ${x} ${y} L ${x + s} ${y - s}`;
  return makeSVG('path', {
    d,
    fill: 'none',
    stroke: '#9ca3af',
    'stroke-width': 1.4,
    'stroke-linecap': 'round'
  });
}

// "10,20; 30,40" -> [{xCm:10,yCm:20},{xCm:30,yCm:40}]
function parsePositionsCm(str) {
  if (!str) return [];
  return str
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const [xs, ys] = pair.split(',').map((p) => p.trim());
      const xCm = Number(xs.replace(',', '.'));
      const yCm = Number(ys.replace(',', '.'));
      if (isNaN(xCm) || isNaN(yCm)) return null;
      return { xCm, yCm };
    })
    .filter(Boolean);
}

async function apiJson(url, options = {}) {
  const opts = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  const resp = await fetch(url, opts);
  let body;
  try {
    body = await resp.json();
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}`);
  }
  if (!resp.ok || (body && body.ok === false)) {
    const msg = body && body.error ? body.error : `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return body;
}

/* ============================================
  Работа с ценами из JSON
============================================ */
function extendEdgingColorsFromData() {
  if (!pricingData?.edging?.colors) return;
  pricingData.edging.colors.forEach((c) => {
    EDGING_COLORS[c.id] = {
      label: c.label || c.id,
      fill: c.fill || '#2a2f38',
      stroke: c.stroke || c.fill || '#2a2f38'
    };
  });
}

function ensureEdgingColor() {
  if (!pricingData?.edging?.colors?.length) return;
  const exists = pricingData.edging.colors.some((c) => c.id === windowState.edgingColor);
  if (!exists) {
    windowState.edgingColor = pricingData.edging.colors[0].id;
    windowState.zippersColor = windowState.edgingColor;
  }
}

function buildMaterialControls(materials) {
  const select = document.getElementById('material');
  const pillsHolder = document.getElementById('material-pills');
  if (!select || !pillsHolder) return;

  select.innerHTML = '';
  pillsHolder.innerHTML = '';

  materials.forEach((m, idx) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.dataset.price = m.pricePerM2 || 0;
    opt.innerText = m.label || m.id;
    if (idx === 0) opt.selected = true;
    select.appendChild(opt);

    const pill = document.createElement('div');
    pill.className = 'pill' + (idx === 0 ? ' pill--active' : '');
    pill.dataset.material = m.id;
    pill.textContent = m.label || m.id;
    pillsHolder.appendChild(pill);
  });
}

function buildEdgingPriceControls(options) {
  const pillsHolder = document.getElementById('edging-price-pills');
  const edgingInput = document.getElementById('edgingPricePerM');
  if (!pillsHolder || !edgingInput) return;

  const opts = options && options.length ? options : [80, 100, 120];
  pillsHolder.innerHTML = '';
  opts.forEach((price, idx) => {
    const pill = document.createElement('div');
    pill.className = 'pill' + (idx === 0 ? ' pill--active' : '');
    pill.dataset.price = price;
    pill.textContent = `${price} ₽/м`;
    pillsHolder.appendChild(pill);
  });

  edgingInput.value = pricingData?.edging?.pricePerM || opts[0] || 0;
}

function buildEdgingColorControls(colors) {
  const holder = document.getElementById('edging-color-row');
  if (!holder) return;

  const items = (colors && colors.length ? colors : Object.keys(EDGING_COLORS).map((id) => ({ id }))).map(
    (c) => ({
      ...EDGING_COLORS[c.id],
      id: c.id
    })
  );

  holder.innerHTML = '';
  items.forEach((c, idx) => {
    const pill = document.createElement('div');
    pill.className = 'pill' + (idx === 0 ? ' pill--active' : '');
    pill.dataset.color = c.id;
    pill.textContent = c.label || c.id;
    holder.appendChild(pill);
    if (idx === 0) {
      windowState.edgingColor = c.id;
      windowState.zippersColor = c.id;
    }
  });
}

function buildMountStepControls(steps) {
  const holder = document.getElementById('mount-step-pills');
  const grommetInput = document.getElementById('grommetStep');
  if (!holder || !grommetInput) return;

  const opts = steps && steps.length ? steps : [20, 30, 40];
  holder.innerHTML = '';
  opts.forEach((step, idx) => {
    const pill = document.createElement('div');
    pill.className = 'pill' + (idx === 0 ? ' pill--active' : '');
    pill.dataset.step = step;
    pill.textContent = `${step} см`;
    holder.appendChild(pill);
  });

  grommetInput.value = pricingData?.defaults?.grommetStep || opts[0] || 30;
}

function buildHardwareList(items) {
  const list = document.querySelector('.hardware-list');
  const label = document.getElementById('hardware-selected-label');
  windowState.hardwareType = '';
  windowState.hardwarePricePerPiece = 0;
  if (!list) return;

  const hardware = items && items.length ? items : [];
  list.innerHTML = '';

  if (!hardware.length) {
    if (label) label.textContent = 'No hardware';
    return;
  }

  hardware.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'hardware-item' + (idx === 0 ? ' hardware-item--active' : '');
    el.dataset.type = item.id;
    el.dataset.price = item.pricePerPiece || 0;
    el.innerHTML = `
      <div class="hardware-item__radio"></div>
      <div class="hardware-item__body">
        <div class="hardware-item__top">
          <div class="hardware-item__title">${item.label || item.id}</div>
          <div class="hardware-item__price">${item.pricePerPiece || 0} ₽</div>
        </div>
        <div class="hardware-item__desc">Цена из базы прайсов.</div>
      </div>
    `;
    list.appendChild(el);
  });

  const first = hardware[0];
  if (first) {
    windowState.hardwareType = first.id;
    windowState.hardwarePricePerPiece = first.pricePerPiece || 0;
    if (label) {
      label.textContent = `${first.label || first.id} · ${first.pricePerPiece || 0} ₽/шт`;
    }
  }
}

function buildPricingControls(data) {
  extendEdgingColorsFromData();
  ensureEdgingColor();

  buildMaterialControls(data?.materials || []);
  buildEdgingPriceControls(data?.edging?.options || []);
  buildEdgingColorControls(data?.edging?.colors || []);
  buildMountStepControls(data?.grommetStepOptions || []);
  buildHardwareList(data?.hardware || []);

  setInputValue('edgingPricePerM', data?.edging?.pricePerM || 0);
  setInputValue('laborPricePerM2', data?.laborPricePerM2 || 0);
  setInputValue('width', data?.defaults?.widthCm || 200);
  setInputValue('height', data?.defaults?.heightCm || 200);
  setInputValue('grommetStep', data?.defaults?.grommetStep || 30);
}

function applyPricingDefaults() {
  const defaults = pricingData?.defaults || {};
  setInputValue('width', defaults.widthCm || num('width') || 200);
  setInputValue('height', defaults.heightCm || num('height') || 200);
  setInputValue('edgingPricePerM', defaults.edgingPricePerM || pricingData?.edging?.pricePerM || 80);
  setInputValue('grommetStep', defaults.grommetStep || pricingData?.grommetStepOptions?.[0] || 30);
  setInputValue('laborPricePerM2', pricingData?.laborPricePerM2 || num('laborPricePerM2'));
}

async function loadPricingData(showAlert = false) {
  try {
    pricingData = await apiJson('/api/prices');
    buildPricingControls(pricingData);
    applyPricingDefaults();
    return true;
  } catch (e) {
    console.error('Failed to load pricing data', e);
    if (showAlert) alert('Не удалось загрузить цены из data/prices.json');
    return false;
  }
}

async function savePricingData(data, password) {
  try {
    await apiJson('/api/prices', {
      method: 'POST',
      body: JSON.stringify({ data, password })
    });
    pricingData = data;
    buildPricingControls(pricingData);
    applyPricingDefaults();
    return { ok: true };
  } catch (e) {
    console.error('Save pricing failed', e);
    return { ok: false, error: e.message };
  }
}

async function changePriceEditorPassword(currentPassword, newPassword) {
  try {
    await apiJson('/api/prices/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return { ok: true };
  } catch (e) {
    console.error('Change password failed', e);
    return { ok: false, error: e.message };
  }
}

function refreshPriceDrivenUI() {
  buildPricingControls(pricingData || {});
  applyPricingDefaults();
  if (formsInitialized) {
    initMaterialPills();
    initEdgingPills();
    initMount();
    initHardwareFasteners();
  }
  if (typeof calcSoftWindow === 'function') {
    calcSoftWindow();
  }
}

function initPriceEditor() {
  const panel = document.getElementById('costs-panel');
  const backdrop = document.getElementById('costs-backdrop');
  const btn = document.getElementById('costs-toggle');
  const btnClose = document.getElementById('costs-close');
  const editor = document.getElementById('price-json-editor');
  const saveBtn = document.getElementById('price-json-save');
  const reloadBtn = document.getElementById('price-json-reload');
  const passwordInput = document.getElementById('price-json-password');
  const newPassInput = document.getElementById('price-json-new-password');
  const savePassBtn = document.getElementById('price-json-save-password');
  const statusEl = document.getElementById('price-json-status');

  if (!panel || !btn || !backdrop || !editor) return;

  function setStatus(msg, isError = false) {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('costs-panel__status--error', isError);
  }

  function fillEditor() {
    if (editor && pricingData) {
      editor.value = JSON.stringify(pricingData, null, 2);
    }
  }

  function openCosts() {
    fillEditor();
    panel.style.display = 'block';
    backdrop.style.display = 'block';
    setStatus('');
  }

  function closeCosts() {
    panel.style.display = 'none';
    backdrop.style.display = 'none';
  }

  btn.addEventListener('click', () => {
    const isOpen = panel.style.display === 'block';
    if (isOpen) {
      closeCosts();
    } else {
      openCosts();
    }
  });

  if (btnClose) btnClose.addEventListener('click', closeCosts);
  backdrop.addEventListener('click', closeCosts);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCosts();
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      try {
        const parsed = JSON.parse(editor.value);
        setStatus('Сохранение...');
        const res = await savePricingData(parsed, passwordInput?.value || '');
        if (!res.ok) {
          setStatus(res.error || 'Не удалось сохранить', true);
          return;
        }
        setStatus('Сохранено');
        refreshPriceDrivenUI();
      } catch (e) {
        console.error(e);
        setStatus('Некорректный JSON', true);
      }
    });
  }

  if (reloadBtn) {
    reloadBtn.addEventListener('click', async () => {
      setStatus('Обновление...');
      await loadPricingData(true);
      fillEditor();
      refreshPriceDrivenUI();
      setStatus('Обновлено');
    });
  }

  if (savePassBtn) {
    savePassBtn.addEventListener('click', async () => {
      const curr = passwordInput?.value || '';
      const next = newPassInput?.value || '';
      if (!next) {
        setStatus('Введите новый пароль', true);
        return;
      }
      setStatus('Сохранение пароля...');
      const res = await changePriceEditorPassword(curr, next);
      if (!res.ok) {
        setStatus(res.error || 'Не удалось сменить пароль', true);
        return;
      }
      if (newPassInput) newPassInput.value = '';
      setStatus('Пароль обновлен');
    });
  }
}

/* ============================================
  Работа с заказом
============================================ */
function addCurrentWindowToOrder() {
  if (!lastCalc) return;

  const id = Date.now() + Math.random();

  const extras = [];
  if (lastCalc.skirtHeight > 0) extras.push(`Юбка ${lastCalc.skirtHeight} см`);
  if (lastCalc.patchCount > 0) extras.push(`Латы ${lastCalc.patchCount} шт.`);
  if (lastCalc.sideCutouts > 0) extras.push(`Вырезы ${lastCalc.sideCutouts} шт.`);
  if (lastCalc.hasZipper) extras.push('Молния');
  if (lastCalc.hasPocket) extras.push('Мягкий откидной вход');

  orderItems.push({
    id,
    title: `Окно ${orderItems.length + 1}`,
    ...lastCalc,
    extrasText: extras.length ? extras.join(', ') : 'Без допов'
  });

  renderOrderList();
}

function removeOrderItem(id) {
  orderItems = orderItems.filter((item) => item.id !== id);
  renderOrderList();
}

function renderOrderList() {
  const listEl = document.getElementById('order-list');
  const totalEl = document.getElementById('order-total');
  if (!listEl || !totalEl) return;

  if (!orderItems.length) {
    listEl.innerHTML = `<div class="order-empty">Список пуст.</div>`;
    totalEl.textContent = '0 ₽';
    return;
  }

  let html = '';
  let sum = 0;

  orderItems.forEach((item) => {
    const edgingMeta = getEdgingColorMeta(item.edgingColor || DEFAULT_EDGING_COLOR);
    const edgingLabel = item.edgingColorLabel || edgingMeta.label;

    sum += item.total;
    html += `
      <div class="order-item">
        <div class="order-item__main">
          <div class="order-item__title">${item.title}</div>
          <div class="order-item__meta">
            ${item.shapeName}, ${item.widthCm}×${item.heightCm} см
            · ${item.area.toFixed(2)} м²
          </div>
          <div class="order-item__extras">
            ${item.materialName} · окантовка: ${edgingLabel} · ${item.extrasText}
          </div>
        </div>
        <div class="order-item__side">
          <div class="order-item__price">${item.total} ₽</div>
          <button class="order-item__remove" onclick="removeOrderItem(${item.id})">✕</button>
        </div>
      </div>
    `;
  });

  listEl.innerHTML = html;
  totalEl.textContent = sum + ' ₽';

  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderItems));
  } catch (e) {
    console.warn('Не удалось сохранить заказ в localStorage', e);
  }

  const topTotalEl = document.getElementById('top-total');
  if (topTotalEl) {
    topTotalEl.textContent = sum + ' ₽';
  }
}

function loadOrderFromStorage() {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      orderItems = parsed;
      renderOrderList();
    }
  } catch (e) {
    console.warn('Не удалось загрузить заказ из localStorage', e);
  }
}

function formatOrderForCopy() {
  if (!orderItems.length) {
    return 'Корзина пуста.';
  }

  let lines = [];
  lines.push('Текущий заказ:');
  lines.push('');

  let sum = 0;

  orderItems.forEach((item, index) => {
    const edgingMeta = getEdgingColorMeta(item.edgingColor || DEFAULT_EDGING_COLOR);
    const edgingLabel = item.edgingColorLabel || edgingMeta.label;

    sum += item.total;
    lines.push(`Окно ${index + 1}:`);
    lines.push(`  Форма: ${item.shapeName}`);
    lines.push(`  Размеры: ${item.widthCm} × ${item.heightCm} см`);
    lines.push(`  Площадь: ${item.area.toFixed(2)} м²`);
    lines.push(`  Материал: ${item.materialName}`);
    lines.push(`  Окантовка: ${edgingLabel}`);
    if (item.skirtHeight > 0) {
      lines.push(`  Юбка: ${item.skirtHeight} см`);
    }
    if (item.patchCount > 0) {
      lines.push(`  Латы: ${item.patchCount} шт.`);
    }
    if (item.sideCutouts > 0) {
      lines.push(`  Вырезы: ${item.sideCutouts} шт.`);
    }
    if (item.hasZipper) {
      lines.push(`  Молния: да`);
    }
    lines.push(`  Стоимость: ${item.total} ₽`);
    lines.push('');
  });

  lines.push(`Итого заказ: ${sum} ₽`);

  return lines.join('\n');
}

async function copyOrderToClipboard() {
  const text = formatOrderForCopy();

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      alert('Заказ скопирован. Можно вставлять в чат.');
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      alert('Заказ скопирован. Можно вставлять в чат.');
    }
  } catch (e) {
    console.error(e);
    alert('Не удалось скопировать заказ.');
  }
}

/* ============================================
  Сброс
============================================ */
function resetSoftWindow() {
  document.getElementById('shape').value = 'rect';
  applyPricingDefaults();

  showBlock('trapezoidControls', false);
  
  showBlock('angledRightControls', false);

  if (typeof calcSoftWindow === 'function') {
    calcSoftWindow();
  }
}

/* ============================================
  Инициализация приложения
============================================ */
async function bootstrapApp() {
  await loadPricingData();

  if (typeof initForms === 'function') {
    initForms();
    formsInitialized = true;
  }

  initPriceEditor();
  loadOrderFromStorage();

  if (typeof calcSoftWindow === 'function') {
    calcSoftWindow();
  }
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
