// Core state and shared helpers
const ORDER_STORAGE_KEY = 'softglass_order_v1';
const FRAME_CM = 5;
const FRAME_THICKNESS = 14; // толщина рамы в px в SVG

const DEFAULT_EDGING_COLOR = 'black';
const EDGING_COLORS = {
  black: { label: 'Чёрная', fill: '#2a2f38', stroke: '#1f2937' },
  white: { label: 'Белая', fill: '#e5e7eb', stroke: '#cbd5e1' },
  brown: { label: 'Коричневая', fill: '#6b4b32', stroke: '#4b3626' }
};

function getEdgingColorMeta(key) {
  return EDGING_COLORS[key] || EDGING_COLORS[DEFAULT_EDGING_COLOR];
}

let orderItems = [];
let lastCalc = null; // последний расчёт из calcSoftWindow

// Глобальное состояние текущего окна
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
  zippersColor: 'black',
  edgingColor: DEFAULT_EDGING_COLOR
};

/* ============================================
  УТИЛИТЫ
============================================ */
function v(id) {
  return document.getElementById(id).value;
}

function num(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return +el.value || 0;
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

// Стрелочки размеров
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

/* ============================================
  ЗАКАЗЫ
============================================ */
function addCurrentWindowToOrder() {
  if (!lastCalc) return;

  const id = Date.now() + Math.random();

  const extras = [];
  if (lastCalc.skirtHeight > 0) extras.push(`юбка ${lastCalc.skirtHeight} см`);
  if (lastCalc.patchCount > 0) extras.push(`заплатки ${lastCalc.patchCount} шт.`);
  if (lastCalc.sideCutouts > 0) extras.push(`вырезы ${lastCalc.sideCutouts} шт.`);
  if (lastCalc.hasZipper) extras.push('молния');
  if (lastCalc.hasPocket) extras.push('карман под утяжелитель');

  orderItems.push({
    id,
    title: `Окно ${orderItems.length + 1}`,
    ...lastCalc,
    extrasText: extras.length ? extras.join(', ') : 'без допов'
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
    listEl.innerHTML = `<div class="order-empty">Пока нет ни одного окна.</div>`;
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
            ${item.materialName} · Окантовка: ${edgingLabel} · ${item.extrasText}
          </div>
        </div>
        <div class="order-item__side">
          <div class="order-item__price">${item.total} ₽</div>
          <button class="order-item__remove" onclick="removeOrderItem(${item.id})">×</button>
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
    console.warn('Не удалось прочитать заказ из localStorage', e);
  }
}

function formatOrderForCopy() {
  if (!orderItems.length) {
    return 'Заказ пуст. Нет ни одного окна.';
  }

  let lines = [];
  lines.push('Заказ мягких окон:');
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
    lines.push(`  Цвет окантовки: ${edgingLabel}`);
    if (item.skirtHeight > 0) {
      lines.push(`  Юбка: ${item.skirtHeight} см`);
    }
    if (item.patchCount > 0) {
      lines.push(`  Заплатки: ${item.patchCount} шт.`);
    }
    if (item.sideCutouts > 0) {
      lines.push(`  Вырезы: ${item.sideCutouts} шт.`);
    }
    if (item.hasZipper) {
      lines.push(`  Молния: есть`);
    }
    lines.push(`  Стоимость окна: ${item.total} ₽`);
    lines.push('');
  });

  lines.push(`ИТОГО по заказу: ${sum} ₽`);

  return lines.join('\n');
}

async function copyOrderToClipboard() {
  const text = formatOrderForCopy();

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      alert('Заказ скопирован в буфер. Можно вставить в чат/письмо.');
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      alert('Заказ скопирован в буфер. Можно вставить в чат/письмо.');
    }
  } catch (e) {
    console.error(e);
    alert('Не удалось скопировать заказ. Попробуйте выделить текст и скопировать вручную.');
  }
}

/* ============================================
  СБРОС
============================================ */
function resetSoftWindow() {
  document.getElementById('shape').value = 'rect';
  document.getElementById('width').value = 200;
  document.getElementById('height').value = 200;
  document.getElementById('edgingPricePerM').value = 80;
  document.getElementById('grommetStep').value = 30;

  showBlock('trapezoidControls', false);
  showBlock('archControls', false);
  showBlock('angledRightControls', false);

  if (typeof calcSoftWindow === 'function') {
    calcSoftWindow();
  }
}

/* ============================================
  ЛОГИН
============================================ */
async function checkLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const err = document.getElementById('login-error');

  if (!u || !p) {
    err.textContent = 'Введите логин и пароль';
    return;
  }

  err.textContent = 'Проверяю...';

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: u, pass: p })
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      err.textContent = data.error || 'Неверный логин или пароль';
      return;
    }

    err.textContent = '';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';

    if (typeof calcSoftWindow === 'function') {
      calcSoftWindow();
    }
  } catch (e) {
    console.error(e);
    err.textContent = 'Ошибка соединения с сервером';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('login-screen')?.style.display !== 'none') {
    checkLogin();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadOrderFromStorage();
  if (typeof calcSoftWindow === 'function') {
    calcSoftWindow();
  }
});
