function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.soft-tab'));
  const panels = Array.from(document.querySelectorAll('.soft-tab-panel'));

  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => t.classList.toggle('soft-tab--active', t === tab));
      panels.forEach((p) => p.classList.toggle('soft-tab-panel--active', p.dataset.panel === name));
    });
  });
}

function initShapeCards() {
  const cards = Array.from(document.querySelectorAll('.shape-card'));
  const shapeSelect = document.getElementById('shape');

  if (!cards.length || !shapeSelect) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const shape = card.dataset.shape;

      cards.forEach((c) => c.classList.toggle('shape-card--active', c === card));
      shapeSelect.value = shape;

      showBlock('trapezoidControls', shape === 'trapezoid');
      showBlock('angledRightControls', shape === 'angledRight' || shape === 'angledLeft');

      if (typeof calcSoftWindow === 'function') {
        calcSoftWindow();
      }
    });
  });
}

function initMaterialPills() {
  const pills = Array.from(document.querySelectorAll('#material-pills .pill'));
  const select = document.getElementById('material');
  const priceLabel = document.getElementById('material-price-label');

  if (!pills.length || !select) return;

  function setMaterial(val) {
    select.value = val;
    const opt = select.selectedOptions[0];
    if (opt && priceLabel) {
      priceLabel.textContent = (opt.dataset.price || '0') + ' per m2';
    }
    if (typeof calcSoftWindow === 'function') {
      calcSoftWindow();
    }
  }

  pills.forEach((p) => {
    p.addEventListener('click', () => {
      const val = p.dataset.material;
      pills.forEach((x) => x.classList.toggle('pill--active', x === p));
      setMaterial(val);
    });
  });

  const active = pills.find((p) => p.classList.contains('pill--active'));
  if (active) setMaterial(active.dataset.material);
}

function initEdgingPills() {
  const pricePills = Array.from(document.querySelectorAll('#edging-price-pills .pill'));
  const edgingInput = document.getElementById('edgingPricePerM');

  if (pricePills.length && edgingInput) {
    pricePills.forEach((p) => {
      p.addEventListener('click', () => {
        pricePills.forEach((x) => x.classList.toggle('pill--active', x === p));
        const price = +p.dataset.price || 0;
        edgingInput.value = price;
        if (typeof calcSoftWindow === 'function') {
          calcSoftWindow();
        }
      });
    });
  }

  const colorPills = Array.from(document.querySelectorAll('#edging-color-row .pill'));
  if (colorPills.length) {
    const setColor = (pill, withCalc = true) => {
      colorPills.forEach((x) => x.classList.toggle('pill--active', x === pill));
      const colorKey = pill.dataset.color || DEFAULT_EDGING_COLOR;
      windowState.edgingColor = colorKey;
      windowState.zippersColor = colorKey; // синхроним цвет молнии с окантовкой
      if (typeof window.__syncZippersUI === 'function') {
        window.__syncZippersUI();
      }
      if (withCalc && typeof calcSoftWindow === 'function') {
        calcSoftWindow();
      }
    };

    colorPills.forEach((p) => {
      p.addEventListener('click', () => {
        setColor(p);
      });
    });

    const activeColor = colorPills.find((p) => p.classList.contains('pill--active')) || colorPills[0];
    if (activeColor) {
      setColor(activeColor, false);
    }
  }
}

function initHardware() {
  const toggleZipper = document.getElementById('toggle-zipper');
  if (toggleZipper) {
    toggleZipper.addEventListener('click', () => {
      toggleZipper.classList.toggle('toggle--on');
      windowState.hasZipper = toggleZipper.classList.contains('toggle--on');
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
    });
  }

  const patchPills = Array.from(document.querySelectorAll('#patch-count-pills .pill'));
  if (patchPills.length) {
    patchPills.forEach((p) => {
      p.addEventListener('click', () => {
        patchPills.forEach((x) => x.classList.toggle('pill--active', x === p));
        windowState.patchCount = +p.dataset.patches || 0;
        if (typeof calcSoftWindow === 'function') calcSoftWindow();
      });
    });
  }

  const cutoutPills = Array.from(document.querySelectorAll('#cutout-count-pills .pill'));
  if (cutoutPills.length) {
    cutoutPills.forEach((p) => {
      p.addEventListener('click', () => {
        cutoutPills.forEach((x) => x.classList.toggle('pill--active', x === p));
        windowState.sideCutouts = +p.dataset.cutouts || 0;
        if (typeof calcSoftWindow === 'function') calcSoftWindow();
      });
    });
  }

  const patchInput = document.getElementById('patchPositionsInput');
  if (patchInput) {
    patchInput.addEventListener('input', () => {
      const raw = patchInput.value.trim();
      windowState.patchPositions = parsePositionsCm(raw);
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
    });
  }

  const cutoutInput = document.getElementById('cutoutPositionsInput');
  if (cutoutInput) {
    cutoutInput.addEventListener('input', () => {
      const raw = cutoutInput.value.trim();
      windowState.cutoutPositions = parsePositionsCm(raw);
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
    });
  }

  const pocketPills = Array.from(document.querySelectorAll('#pocket-size-pills .pill'));
  if (pocketPills.length) {
    pocketPills.forEach((p) => {
      p.addEventListener('click', () => {
        pocketPills.forEach((x) => x.classList.toggle('pill--active', x === p));

        const val = +p.dataset.pocket || 0;
        if (val === 0) {
          windowState.hasPocket = false;
          windowState.pocketSize = null;
        } else {
          windowState.hasPocket = true;
          windowState.pocketSize = val;
        }

        if (typeof calcSoftWindow === 'function') calcSoftWindow();
      });
    });
  }
}

function initMount() {
  const stepPills = Array.from(document.querySelectorAll('#mount-step-pills .pill'));
  const grommetInput = document.getElementById('grommetStep');

  if (stepPills.length && grommetInput) {
    stepPills.forEach((p) => {
      p.addEventListener('click', () => {
        stepPills.forEach((x) => x.classList.toggle('pill--active', x === p));
        const step = +p.dataset.step || 30;
        grommetInput.value = step;
        if (typeof calcSoftWindow === 'function') {
          calcSoftWindow();
        }
      });
    });
  }

  const tTop = document.getElementById('toggle-mount-top');
  const tSides = document.getElementById('toggle-mount-sides');

  [tTop, tSides].forEach((t) => {
    if (!t || t.dataset.bound === '1') return;
    t.dataset.bound = '1';
    t.addEventListener('click', () => {
      t.classList.toggle('toggle--on');
    });
  });
}

function initSkirtPills() {
  const pills = Array.from(document.querySelectorAll('#skirt-pills .pill'));
  const input = document.getElementById('skirtHeightInput');
  if (!pills.length || !input) return;

  const setVal = (cm) => {
    windowState.skirtHeight = cm;
    input.value = cm;
    pills.forEach((p) => p.classList.toggle('pill--active', +p.dataset.skirt === cm));
    if (typeof calcSoftWindow === 'function') calcSoftWindow();
  };

  pills.forEach((p) => {
    p.addEventListener('click', () => setVal(+p.dataset.skirt || 0));
  });

  // Init with current input value or first pill
  const current = +input.value || 0;
  const pill = pills.find((p) => +p.dataset.skirt === current) || pills[0];
  if (pill) setVal(+pill.dataset.skirt || 0);
}

function initSidebar() {
  const items = Array.from(document.querySelectorAll('.soft-sidebar__item'));
  if (!items.length) return;

  items.forEach((item) => {
    item.addEventListener('click', () => {
      items.forEach((x) => x.classList.toggle('soft-sidebar__item--active', x === item));
      const type = item.dataset.sidebar;

      if (type === 'zipper') {
        openZippersModal();
      }

      if (type === 'skirt') {
        openSkirtModal();
      }

      if (type === 'cutouts') {
        openCutoutsModal();
      }

      if (type === 'pocket') {
        openPocketModal();
      }

      if (type === 'door') {
        // зарезервировано под будущий функционал
      }
    });
  });
}

function initResultTabs() {
  const tabs = Array.from(document.querySelectorAll('.result-tab'));
  const windowView = document.getElementById('result-window');
  const orderView = document.getElementById('result-order');

  if (!tabs.length || !windowView || !orderView) return;

  function setView(name) {
    tabs.forEach((t) =>
      t.classList.toggle('result-tab--active', t.dataset.view === name)
    );
    windowView.classList.toggle('result-view--active', name === 'window');
    orderView.classList.toggle('result-view--active', name === 'order');
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });

  setView('window');
}

function initHardwareFasteners() {
  const items = Array.from(document.querySelectorAll('.hardware-item'));
  const label = document.getElementById('hardware-selected-label');

  if (!items.length) return;

  function selectItem(item) {
    items.forEach((i) => i.classList.remove('hardware-item--active'));
    item.classList.add('hardware-item--active');

    const type = item.dataset.type || 'grommet10';
    const price = +item.dataset.price || 0;
    const titleEl = item.querySelector('.hardware-item__title');
    const title = titleEl ? titleEl.textContent.trim() : 'Hardware';

    windowState.hardwareType = type;
    windowState.hardwarePricePerPiece = price;

    if (label) {
      label.textContent = title + ' | ' + price + ' per pc';
    }

    if (typeof calcSoftWindow === 'function') {
      calcSoftWindow();
    }
  }

  items.forEach((item) => {
    item.addEventListener('click', () => selectItem(item));
  });

  const current = document.querySelector('.hardware-item--active') || items[0];
  if (current) selectItem(current);
}

function initHardwareAdvancedToggle() {
  const toggle = document.getElementById('hardware-advanced-toggle');
  const block = document.getElementById('hardware-advanced');
  if (!toggle || !block) return;

  toggle.addEventListener('click', () => {
    block.classList.toggle('hardware-advanced--open');
  });
}

function initSizePills() {
  const svg = document.getElementById('preview');
  if (!svg) return;

  const placementHint = document.getElementById('placement-hint');

  window.__placementPoints = [];

  function setPlacementMode(mode) {
    window.__placementMode = mode;
    window.__placementPoints = [];
    if (placementHint) {
      placementHint.textContent = mode
        ? `Режим: ${mode === 'cutout' ? 'вырез' : 'заплатка'}. Кликните по макету.`
        : '';
    }
    if (typeof window.renderTempPolygonOverlay === 'function') {
      window.renderTempPolygonOverlay();
    }
  }

  function syncPositionsInputs() {
    const patchInput = document.getElementById('patchPositionsInput');
    const cutoutInput = document.getElementById('cutoutPositionsInput');
    if (patchInput) {
      patchInput.value = (windowState.patchPositions || [])
        .map((p) => `${(p.xCm || 0).toFixed(1)},${(p.yCm || 0).toFixed(1)}`)
        .join('; ');
    }
    if (cutoutInput) {
      cutoutInput.value = (windowState.cutoutPositions || [])
        .map((p) => `${(p.xCm || 0).toFixed(1)},${(p.yCm || 0).toFixed(1)}`)
        .join('; ');
    }
  }

  function handlePlacementClick(e) {
    const mode = window.__placementMode;
    const meta = window.__lastDrawMeta;
    if (!mode || !meta) return;

    const vb = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const xView = ((e.clientX - rect.left) / rect.width) * vb.width;
    const yView = ((e.clientY - rect.top) / rect.height) * vb.height;

    const padding = meta.padding || 0;
    const scale = meta.scale || 1;
    const xPx = xView - padding;
    const yPx = yView - padding;
    if (xPx < 0 || yPx < 0) {
      setPlacementMode(null);
      return;
    }
    const xCm = +(xPx / scale).toFixed(1);
    const yCm = +(yPx / scale).toFixed(1);
    if (xCm < 0 || yCm < 0) {
      setPlacementMode(null);
      return;
    }

    window.__placementPoints = [...(window.__placementPoints || []), { xCm, yCm }];
    if (typeof window.renderTempPolygonOverlay === 'function') {
      window.renderTempPolygonOverlay();
    }
  }

  svg.addEventListener('click', (e) => {
    if (window.__placementMode) {
      handlePlacementClick(e);
      return;
    }

    let el = e.target;

    if (el.nodeType !== 1) {
      el = el.parentNode;
    }

    let holder = el.closest ? el.closest('[data-size-type]') : el;
    if (!holder) return;

    const type = holder.getAttribute('data-size-type');
    if (!type) return;

    const inputId = type === 'width' ? 'width' : 'height';
    const label = type === 'width' ? 'ширину, см' : 'высоту, см';

    const current = num(inputId) || 0;
    const userVal = prompt(`Введите ${label}`, current || '');

    if (userVal === null) return;

    const parsed = parseFloat(String(userVal).replace(',', '.'));
    if (!parsed || parsed <= 0) {
      alert('Введите положительное число в сантиметрах');
      return;
    }

    document.getElementById(inputId).value = parsed;
    if (typeof calcSoftWindow === 'function') {
      calcSoftWindow();
    }
  });

  const btnCutout = document.getElementById('place-cutout-btn');
  const btnPatch = document.getElementById('place-patch-btn');
  const btnCancel = document.getElementById('place-cancel-btn');
  const btnUndo = document.getElementById('place-undo-btn');
  const btnFinish = document.getElementById('place-finish-btn');

  if (btnCutout) {
    btnCutout.addEventListener('click', () => setPlacementMode('cutout'));
  }
  if (btnPatch) {
    btnPatch.addEventListener('click', () => setPlacementMode('patch'));
  }
  if (btnCancel) {
    btnCancel.addEventListener('click', () => setPlacementMode(null));
  }
  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      window.__placementPoints = (window.__placementPoints || []).slice(0, -1);
      if (typeof window.renderTempPolygonOverlay === 'function') window.renderTempPolygonOverlay();
    });
  }
  if (btnFinish) {
    btnFinish.addEventListener('click', () => {
      const pts = window.__placementPoints || [];
      const mode = window.__placementMode;
      if (!mode || pts.length < 3) {
        setPlacementMode(null);
        return;
      }
      const poly = { points: pts };
      if (mode === 'cutout') {
        windowState.cutoutPolygons = [...(windowState.cutoutPolygons || []), poly];
      } else {
        windowState.patchPolygons = [...(windowState.patchPolygons || []), poly];
      }
      setPlacementMode(null);
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
    });
  }
}

// временный полигон поверх SVG
window.renderTempPolygonOverlay = function () {
  const svg = document.getElementById('preview');
  if (!svg) return;
  const old = svg.querySelector('#temp-polygon-layer');
  if (old) old.remove();

  if (!window.__placementMode || !window.__placementPoints.length) return;
  const meta = window.__lastDrawMeta;
  if (!meta || !meta.scale) return;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('id', 'temp-polygon-layer');

  const pts = window.__placementPoints
    .map((p) => `${(p.xCm || 0) * meta.scale + (meta.padding || 0)},${(p.yCm || 0) * meta.scale + (meta.padding || 0)}`)
    .join(' ');
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', pts);
  poly.setAttribute('fill', window.__placementMode === 'cutout' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.4)');
  poly.setAttribute('stroke', window.__placementMode === 'cutout' ? '#0f172a' : '#94a3b8');
  poly.setAttribute('stroke-dasharray', window.__placementMode === 'cutout' ? '' : '4 2');
  poly.setAttribute('stroke-width', '1.3');
  g.appendChild(poly);

  svg.appendChild(g);
};

function openCutoutsModal() {
  const m = document.getElementById('tab-cutouts');
  if (m) m.classList.add('active');
}

function closeCutoutsModal() {
  const m = document.getElementById('tab-cutouts');
  if (m) m.classList.remove('active');
  window.__placementMode = null;
  window.__placementPoints = [];
  if (typeof window.renderTempPolygonOverlay === 'function') {
    window.renderTempPolygonOverlay();
  }
}

function initCutoutsTab() {
  const modal = document.getElementById('tab-cutouts');
  if (!modal) return;

  const closeBtn = document.getElementById('cutoutsClose');
  if (closeBtn) closeBtn.addEventListener('click', closeCutoutsModal);
}

function openSkirtModal() {
  const m = document.getElementById('tab-skirt');
  if (m) m.classList.add('active');
}

function closeSkirtModal() {
  const m = document.getElementById('tab-skirt');
  if (m) m.classList.remove('active');
}

function initSkirtModal() {
  const closeBtn = document.getElementById('skirtClose');
  if (closeBtn) closeBtn.addEventListener('click', closeSkirtModal);
}

function initForms() {
  initTabs();
  initShapeCards();
  initMaterialPills();
  initEdgingPills();
  initHardware();
  initMount();
  initSkirtPills();
  initSidebar();
  initResultTabs();
  initZippersTab();
  initPocketTab();
  initCutoutsTab();
  initSkirtModal();
  initSkirtPills();
  initHardwareFasteners();
  initHardwareAdvancedToggle();
  initSizePills();
}

