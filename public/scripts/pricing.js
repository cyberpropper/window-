function shapeName(s) {
  return {
    rect: 'Прямоугольник',
    trapezoid: 'Трапеция',
    angledRight: 'Скошенное вправо',
    angledLeft: 'Скошенное влево',
    triangle: 'Треугольник'
  }[s] || s;
}

async function calcSoftWindow() {
  const shape = v('shape');
  const widthCm = num('width');
  const heightCm = num('height');

  const topDelta = shape === 'trapezoid' ? num('topDelta') : 0;
  
  const isAngled = shape === 'angledRight' || shape === 'angledLeft';
  const flatTopHeight = isAngled ? num('flatTopHeight') : 0;

  const materialSel = document.getElementById('material');
  const materialId = materialSel?.selectedOptions?.[0]?.value;
  const edgingPricePerM = num('edgingPricePerM') || (pricingData?.edging?.pricePerM || 0);
  const grommetStep =
    num('grommetStep') || pricingData?.defaults?.grommetStep || pricingData?.grommetStepOptions?.[0] || 30;
  const laborPricePerM2 = num('laborPricePerM2') || pricingData?.laborPricePerM2 || 0;

  const skirtHeight = windowState.skirtHeight || 0;
  const manualPatchCount = (windowState.patchPositions && windowState.patchPositions.length) || 0;
  const manualCutoutCount = (windowState.cutoutPositions && windowState.cutoutPositions.length) || 0;
  const patchPolygonsCount = (windowState.patchPolygons && windowState.patchPolygons.length) || 0;
  const cutoutPolygonsCount = (windowState.cutoutPolygons && windowState.cutoutPolygons.length) || 0;
  const patchCount = manualPatchCount + patchPolygonsCount + (windowState.patchCount || 0);
  const sideCutouts = manualCutoutCount + cutoutPolygonsCount + (windowState.sideCutouts || 0);
  const hasZipper = !!windowState.hasZipper;
  const hasPocket = !!windowState.hasPocket;
  const pocketSize = windowState.pocketSize;

  if (!widthCm || !heightCm) {
    setResult('Укажите размеры.');
    drawShape(shape, 0, 0, {});
    return;
  }

  const payload = {
    shape,
    widthCm,
    heightCm,
    topDelta,
    flatTopHeight,
    grommetStep,
    laborPricePerM2,
    materialId,
    edgingPricePerM,
    edgingColor: windowState.edgingColor || DEFAULT_EDGING_COLOR,
    skirtHeight,
    patchCount,
    sideCutouts,
    hasZipper,
    hasPocket,
    pocketSize,
    hardwareType: windowState.hardwareType,
    hardwarePricePerPiece: windowState.hardwarePricePerPiece
  };

  try {
    const resp = await apiJson('/api/calc', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const numVal = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

    const areaVal = numVal(resp.area);
    const filmCost = numVal(resp.filmCost);
    const edgingCost = numVal(resp.edgingCost);
    const laborCost = numVal(resp.laborCost);
    const grommetsCount = numVal(resp.grommetsCount);
    const skirtCost = numVal(resp.skirtCost);
    const patchCost = numVal(resp.patchCost);
    const cutoutCost = numVal(resp.cutoutCost);
    const zipperCost = numVal(resp.zipperCost);
    const hardwareCost = numVal(resp.hardwareCost);
    const hardwarePricePerPiece = numVal(resp.hardwarePricePerPiece);
    const total = numVal(resp.total);
    const edgingColorLabel = resp.edgingColorLabel || '';
    const materialName = resp.materialName || materialId || '';

    const topLabel = document.getElementById('top-width-label');
    const bottomLabel = document.getElementById('bottom-width-label');
    if (topLabel) topLabel.textContent = widthCm + ' см';
    if (bottomLabel) bottomLabel.textContent = widthCm + ' см';

    setResult(`
      <strong>Форма:</strong> ${resp.shapeName || shapeName(shape)}<br>
      Материал: ${materialName || ''}<br>
      Ширина: ${widthCm} см, высота: ${heightCm} см<br>
      Площадь: ${areaVal.toFixed(2)} м²<br>
      Фурнитура (шаг ${grommetStep}): ${grommetsCount} шт.<br>
      Плёнка: ${filmCost} ₽<br>
      Окантовка (${edgingColorLabel || ''}): ${edgingCost} ₽<br>
      Работа: ${laborCost} ₽<br>
      ${skirtHeight > 0 ? `Юбка (${skirtHeight} см): ${skirtCost} ₽<br>` : ``}
      ${patchCount > 0 ? `Латы (${patchCount} шт.): ${patchCost} ₽<br>` : ``}
      ${sideCutouts > 0 ? `Вырезы (${sideCutouts} шт.): ${cutoutCost} ₽<br>` : ``}
      ${hasZipper ? `Молния: ${zipperCost} ₽<br>` : ``}
      ${hasPocket ? `Мягкий вход (${pocketSize || ''}): 0 ₽<br>` : ``}
      ${hardwarePricePerPiece > 0 ? `Крепёж: ${hardwareCost} ₽<br>` : ``}
      <strong>Итого: ${total} ₽</strong>
    `);

    document.getElementById('summary-total').textContent = total + ' ₽';
    document.getElementById('summary-area').textContent = areaVal.toFixed(2) + ' м²';
    document.getElementById('bottom-area-badge').textContent = areaVal.toFixed(2) + ' м²';
    document.getElementById('top-total').textContent = total + ' ₽';

    drawShape(shape, widthCm, heightCm, {
      topDelta,
      flatTopHeight,
      grommetStep,
      skirtHeight,
      patchCount,
      sideCutouts,
      hasZipper,
      hasPocket,
      zipperColor: windowState.zippersColor || 'black',
      edgingColor: payload.edgingColor,
      pocketSize,
    patchPositions: windowState.patchPositions || [],
      cutoutPositions: windowState.cutoutPositions || [],
      patchPolygons: windowState.patchPolygons || [],
      cutoutPolygons: windowState.cutoutPolygons || []
    });

    if (typeof window.renderTempPolygonOverlay === 'function') {
      window.renderTempPolygonOverlay();
    }

    lastCalc = {
      shape,
      shapeName: resp.shapeName || shapeName(shape),
      widthCm,
      heightCm,
      area: +areaVal.toFixed(2),
      filmCost: resp.filmCost,
      edgingCost: resp.edgingCost,
      skirtHeight,
      patchCount,
      sideCutouts,
      hasZipper,
      hasPocket,
      edgingColor: payload.edgingColor,
      edgingColorLabel,
      pocketSize,
      total: resp.total,
      materialName: materialName || payload.materialId
    };
  } catch (e) {
    console.error(e);
    setResult('Ошибка расчёта: ' + e.message);
  }
}
