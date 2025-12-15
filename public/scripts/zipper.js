function openZippersModal() {
  const m = document.getElementById('tab-zippers');
  if (m) m.classList.add('active');
  if (typeof window.__syncZippersUI === 'function') {
    window.__syncZippersUI();
  }
  const firstActive = document.querySelector('.zip-option.active');
  if (!firstActive) {
    const defaultOpt = document.querySelector('.zip-option[data-count="1"]');
    if (defaultOpt) defaultOpt.classList.add('active');
  }
}

function closeZippersModal() {
  const m = document.getElementById('tab-zippers');
  if (m) m.classList.remove('active');
}

function initZippersTab() {
  const modal = document.getElementById('tab-zippers');
  if (!modal) return;

  const closeBtn = document.getElementById('zippersClose');
  const countOptions = document.querySelectorAll('.zip-option');
  const colorOptions = document.querySelectorAll('.zip-color-option');
  const applyBtn = document.getElementById('applyZippers');
  const clearBtn = document.getElementById('clearZippers');
  const toggleZipper = document.getElementById('toggle-zipper');

  let selectedCount = windowState.zippersCount || 0;
  let selectedColor = windowState.zippersColor || 'black';

  function syncToggle(on) {
    if (!toggleZipper) return;
    toggleZipper.classList.toggle('toggle--on', on);
  }

  function syncSelectedUI() {
    countOptions.forEach((x) => {
      x.classList.toggle('active', +x.dataset.count === selectedCount);
    });
    colorOptions.forEach((x) => {
      x.classList.toggle('active', x.dataset.color === selectedColor);
    });
  }

  function syncFromState() {
    selectedCount = windowState.zippersCount || 0;
    selectedColor = windowState.zippersColor || 'black';

    // если молния включена, но количество не выбрано — ставим 1 по умолчанию
    if (windowState.hasZipper && (!selectedCount || selectedCount < 0)) {
      selectedCount = 1;
    }

    const isOn = !!windowState.hasZipper && selectedCount > 0;
    syncToggle(isOn);
    syncSelectedUI();
  }

  syncFromState();
  window.__syncZippersUI = syncFromState;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeZippersModal);
  }

  countOptions.forEach((el) => {
    el.addEventListener('click', () => {
      countOptions.forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
      selectedCount = +el.dataset.count;
      windowState.hasZipper = selectedCount > 0;
      syncToggle(windowState.hasZipper);
    });
  });

  colorOptions.forEach((el) => {
    el.addEventListener('click', () => {
      colorOptions.forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
      selectedColor = el.dataset.color;
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      windowState.zippersCount = selectedCount;
      windowState.zippersColor = selectedColor;
      
      syncToggle(windowState.hasZipper);
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
      syncSelectedUI();
      closeZippersModal();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      windowState.zippersCount = 0;
      windowState.zippersColor = 'black';
      windowState.hasZipper = false;
      selectedCount = 0;
      selectedColor = 'black';

      syncToggle(false);
      syncSelectedUI();

      if (typeof calcSoftWindow === 'function') calcSoftWindow();
      closeZippersModal();
    });
  }
}

function openPocketModal() {
  const m = document.getElementById('tab-pocket');
  if (m) m.style.display = 'block';
}

function closePocketModal() {
  const m = document.getElementById('tab-pocket');
  if (m) m.style.display = 'none';
}

function initPocketTab() {
  const modal = document.getElementById('tab-pocket');
  if (!modal) return;

  const closeBtn = document.getElementById('pocketClose');
  const options = document.querySelectorAll('.pocket-option');
  const applyBtn = document.getElementById('applyPocket');
  const clearBtn = document.getElementById('clearPocket');

  let selectedSize = windowState.pocketSize || 0;

  options.forEach((el) => {
    el.addEventListener('click', () => {
      options.forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
      selectedSize = +el.dataset.size || 0;
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (selectedSize > 0) {
        windowState.hasPocket = true;
        windowState.pocketSize = selectedSize;
      } else {
        windowState.hasPocket = false;
        windowState.pocketSize = null;
      }
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
      closePocketModal();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      windowState.hasPocket = false;
      windowState.pocketSize = null;
      options.forEach((x) => x.classList.remove('active'));
      if (typeof calcSoftWindow === 'function') calcSoftWindow();
      closePocketModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closePocketModal);
  }
}
