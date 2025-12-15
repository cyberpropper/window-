function shapeName(s) {
  return {
    rect: 'Прямоугольник',
    trapezoid: 'Трапеция',
    arch: 'Арка',
    angledRight: 'Со срезом справа'
  }[s] || s;
}

function calcSoftWindow() {
  const shape = v('shape');
  const widthCm = num('width');
  const heightCm = num('height');

  const topDelta = shape === 'trapezoid' ? num('topDelta') : 0;
  const archHeight = shape === 'arch' ? num('archHeight') : 0;
  const flatTopHeight = shape === 'angledRight' ? num('flatTopHeight') : 0;

  const edgingPricePerM = num('edgingPricePerM');
  const grommetStep = num('grommetStep') || 30;
  const laborPricePerM2 = num('laborPricePerM2') || 0;

  const materialSel = document.getElementById('material');
  const materialPrice = +materialSel.selectedOptions[0].dataset.price;
  const materialName = materialSel.selectedOptions[0].innerText;

  if (!widthCm || !heightCm) {
    setResult('Введите размеры окна');
    drawShape(shape, 0, 0, {});
    return;
  }

  const widthM = widthCm / 100;
  const heightM = heightCm / 100;

  let area = widthM * heightM;

  if (shape === 'trapezoid') {
    const topW = (widthCm - topDelta) / 100;
    area = ((widthM + topW) / 2) * heightM;
  }
  if (shape === 'arch') {
    const rectH = heightM - archHeight / 100;
    const r = widthM / 2;
    area = (rectH > 0 ? rectH * widthM : 0) + (Math.PI * r * r) / 2;
  }
  if (shape === 'angledRight') {
    const tri = Math.max(0, (heightCm - flatTopHeight) / 100);
    area = widthM * heightM - (tri * tri) / 2;
  }

  const skirtHeight = windowState.skirtHeight || 0;
  const manualPatchCount = (windowState.patchPositions && windowState.patchPositions.length) || 0;
  const manualCutoutCount = (windowState.cutoutPositions && windowState.cutoutPositions.length) || 0;

  const patchCount = manualPatchCount || windowState.patchCount || 0;
  const sideCutouts = manualCutoutCount || windowState.sideCutouts || 0;
  const hasZipper = !!windowState.hasZipper;

  const hasPocket = !!windowState.hasPocket;
  const pocketSize = windowState.pocketSize;

  let skirtArea = 0;
  if (skirtHeight > 0) {
    skirtArea = (widthCm / 100) * (skirtHeight / 100);
    area += skirtArea;
  }

  const perimeterM = 2 * (widthM + heightM);
  const edgingCost = perimeterM * edgingPricePerM;

  const filmCost = area * materialPrice;
  const laborCost = area * laborPricePerM2;

  const grommetsCount = Math.max(4, Math.ceil((2 * (widthCm + heightCm)) / grommetStep));

  const hardwarePricePerPiece = windowState.hardwarePricePerPiece || 0;
  const hardwareCost = grommetsCount * hardwarePricePerPiece;

  const patchPrice = 80;
  const cutoutPrice = 120;
  const zipperPrice = 350;
  const skirtPricePerM = 250;
  const pocketCost = 0;

  const skirtCost = skirtHeight > 0 ? widthM * skirtPricePerM : 0;
  const patchCost = patchCount * patchPrice;
  const cutoutCost = sideCutouts * cutoutPrice;
  const zipperCost = hasZipper ? zipperPrice : 0;

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

  const topLabel = document.getElementById('top-width-label');
  const bottomLabel = document.getElementById('bottom-width-label');
  if (topLabel) topLabel.textContent = widthCm + ' см';
  if (bottomLabel) bottomLabel.textContent = widthCm + ' см';

  setResult(`
      <strong>Форма:</strong> ${shapeName(shape)}<br>
      Материал: ${materialName}<br>
      Ширина: ${widthCm} см, высота: ${heightCm} см<br>
      Площадь: ${area.toFixed(2)} м²<br>
      Люверсов (примерно): ${grommetsCount} шт.<br>
      Плёнка: ${filmCost.toFixed(0)} ₽<br>
      Окантовка: ${edgingCost.toFixed(0)} ₽<br>
      Работа: ${laborCost.toFixed(0)} ₽<br>
      ${skirtHeight > 0 ? `Юбка (${skirtHeight} см): ${skirtCost.toFixed(0)} ₽<br>` : ``}
      ${patchCount > 0 ? `Заплатки (${patchCount} шт.): ${patchCost.toFixed(0)} ₽<br>` : ``}
      ${sideCutouts > 0 ? `Вырезы (${sideCutouts} шт.): ${cutoutCost.toFixed(0)} ₽<br>` : ``}
      ${hasZipper ? `Молния: ${zipperCost.toFixed(0)} ₽<br>` : ``}
      ${hasPocket ? `Карман под утяжелитель (${pocketSize || ''}): добавлен<br>` : ``}
      ${hardwarePricePerPiece > 0 ? `Крепление: ${grommetsCount} шт. × ${hardwarePricePerPiece.toFixed(0)} ₽ = ${hardwareCost.toFixed(0)} ₽<br>` : ``}
      <strong>Итого: ${total} ₽</strong>
    `);

  document.getElementById('summary-total').textContent = total + ' ₽';
  document.getElementById('summary-area').textContent = area.toFixed(2) + ' м²';
  document.getElementById('bottom-area-badge').textContent = area.toFixed(2) + ' м²';
  document.getElementById('top-total').textContent = total + ' ₽';

  drawShape(shape, widthCm, heightCm, {
    topDelta,
    archHeight,
    flatTopHeight,
    grommetStep,
    skirtHeight,
    patchCount,
    sideCutouts,
    hasZipper,
    hasPocket,
    zipperColor: windowState.zippersColor || 'black',
    pocketSize,
    patchPositions: windowState.patchPositions || [],
    cutoutPositions: windowState.cutoutPositions || []
  });

  lastCalc = {
    shape,
    shapeName: shapeName(shape),
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
    pocketSize,
    total,
    materialName
  };
}
