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
      showBlock('archControls', shape === 'arch');
      showBlock('angledRightControls', shape === 'angledRight');

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
      priceLabel.textContent = (opt.dataset.price || '0') + ' ₽/м²';
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
    colorPills.forEach((p) => {
      p.addEventListener('click', () => {
        colorPills.forEach((x) => x.classList.toggle('pill--active', x === p));
      });
    });
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
    if (!t) return;
    t.addEventListener('click', () => {
      t.classList.toggle('toggle--on');
    });
  });
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
        const input = document.getElementById('skirtHeightInput');
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      if (type === 'cutouts') {
        const input = document.getElementById('cutoutPositionsInput');
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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

function initCostsPanel() {
  const panel = document.getElementById('costs-panel');
  const backdrop = document.getElementById('costs-backdrop');
  const btn = document.getElementById('costs-toggle');
  const btnClose = document.getElementById('costs-close');
  const materialSelect = document.getElementById('material');

  if (!panel || !btn || !materialSelect || !backdrop) return;

  function openCosts() {
    panel.style.display = 'block';
    backdrop.style.display = 'block';
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

  const priceInputs = {
    pvc08: document.getElementById('price-pvc08'),
    pvc10: document.getElementById('price-pvc10'),
    softglass: document.getElementById('price-softglass')
  };

  const materialPriceLabel = document.getElementById('material-price-label');

  function syncMaterialPrices() {
    Array.from(materialSelect.options).forEach((opt) => {
      const key = opt.value;
      const input = priceInputs[key];
      if (!input) return;
      const val = +input.value || 0;
      opt.dataset.price = val;
      if (opt.selected && materialPriceLabel) {
        materialPriceLabel.textContent = val + ' ₽/м²';
      }
    });

    if (typeof calcSoftWindow === 'function') {
      calcSoftWindow();
    }
  }

  Object.values(priceInputs).forEach((input) => {
    if (!input) return;
    input.addEventListener('input', syncMaterialPrices);
  });

  const edgingHidden = document.getElementById('edgingPricePerM');
  const edgingControl = document.getElementById('edgingPriceControl');

  if (edgingHidden && edgingControl) {
    edgingControl.value = edgingHidden.value || edgingControl.value;

    edgingControl.addEventListener('input', () => {
      edgingHidden.value = edgingControl.value;
      if (typeof calcSoftWindow === 'function') {
        calcSoftWindow();
      }
    });
  }

  syncMaterialPrices();
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
    const title = titleEl ? titleEl.textContent.trim() : 'Крепление';

    windowState.hardwareType = type;
    windowState.hardwarePricePerPiece = price;

    if (label) {
      label.textContent = `${title} · ${price} ₽/шт`;
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

  svg.addEventListener('click', (e) => {
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
}

function initForms() {
  initTabs();
  initShapeCards();
  initMaterialPills();
  initEdgingPills();
  initHardware();
  initMount();
  initSidebar();
  initResultTabs();
  initCostsPanel();
  initZippersTab();
  initPocketTab();
  initHardwareFasteners();
  initHardwareAdvancedToggle();
  initSizePills();
}

document.addEventListener('DOMContentLoaded', initForms);
