function formatCmLabel(valueCm) {
  if (!isFinite(valueCm)) return '';
  const rounded = Math.round(valueCm * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} cm`;
}

const FALLBACK_HARDWARE_COLORS = {
  dark: { fill: '#f8fafc', stroke: '#111827', accent: '#0f172a' },
  white: { fill: '#ffffff', stroke: '#cbd5e1', accent: '#94a3b8' },
  brown: { fill: '#f5ebe3', stroke: '#4b3626', accent: '#6b4b32' }
};

function resolveHardwareColorMeta(key) {
  if (typeof getHardwareColorMeta === 'function') {
    return getHardwareColorMeta(key);
  }
  return FALLBACK_HARDWARE_COLORS[key] || FALLBACK_HARDWARE_COLORS.dark;
}

function normalizeSideHardwareType(type) {
  const val = String(type || '')
    .trim()
    .toLowerCase();

  if (val === 'grommet10' || val === 'l10' || val === 'l-10') return 'grommet10';
  if (val === 'bracket' || val === 'strap') return 'bracket';
  if (val === 'plastic-rotary' || val === 'rotary' || val === 'rotary-plastic') return 'plastic-rotary';
  if (val === 'metal-rotary' || val === 'rotary-metal') return 'metal-rotary';
  if (val === 'french-lock' || val === 'french' || val === 'fr-lock') return 'french-lock';

  if (val === 'lag' || val === 'screw' || val === 'gluhar' || val === 'grommet' || val === 'eyelet') {
    return 'grommet10';
  }

  return 'grommet10';
}

function isVerticalCornerType(type) {
  return normalizeSideHardwareType(type) !== 'grommet10';
}

function useShortBottomOffset(type) {
  return normalizeSideHardwareType(type) === 'grommet10';
}

function drawHardwareGlyph(g, type, xPx, yPx, angle = 0, base = 4, colors = {}) {
  const fill = colors.fill || '#ffffff';
  const stroke = colors.stroke || '#334155';
  const accent = colors.accent || stroke;
  const kind = normalizeSideHardwareType(type);
  const group = makeSVG('g', angle ? { transform: `rotate(${angle} ${xPx} ${yPx})` } : {});

  if (kind === 'grommet10') {
    group.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: base * 0.95,
        fill,
        stroke,
        'stroke-width': 1.2
      })
    );
    group.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: base * 0.45,
        fill: '#ffffff',
        stroke: accent,
        'stroke-width': 0.8
      })
    );
    g.appendChild(group);
    return;
  }

  if (kind === 'bracket') {
    const w = base * 3.2;
    const h = base * 1.35;
    group.appendChild(
      makeSVG('rect', {
        x: xPx - w / 2,
        y: yPx - h / 2,
        width: w,
        height: h,
        rx: h * 0.45,
        ry: h * 0.45,
        fill,
        stroke,
        'stroke-width': 1
      })
    );
    group.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: h * 0.34,
        fill: '#ffffff',
        stroke: accent,
        'stroke-width': 0.9
      })
    );
    g.appendChild(group);
    return;
  }

  if (kind === 'plastic-rotary' || kind === 'metal-rotary') {
    const w = base * 2.85;
    const h = base * 1.45;
    group.appendChild(
      makeSVG('rect', {
        x: xPx - w / 2,
        y: yPx - h / 2,
        width: w,
        height: h,
        rx: h * 0.45,
        ry: h * 0.45,
        fill,
        stroke,
        'stroke-width': 1
      })
    );
    group.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: h * 0.34,
        fill: kind === 'metal-rotary' ? accent : '#ffffff',
        stroke: accent,
        'stroke-width': 0.9
      })
    );
    if (kind === 'metal-rotary') {
      group.appendChild(
        makeSVG('line', {
          x1: xPx - h * 0.55,
          y1: yPx,
          x2: xPx + h * 0.55,
          y2: yPx,
          stroke: '#ffffff',
          'stroke-width': 0.9,
          'stroke-linecap': 'round'
        })
      );
    }
    g.appendChild(group);
    return;
  }

  if (kind === 'french-lock') {
    const w = base * 2.9;
    const h = base * 1.5;
    group.appendChild(
      makeSVG('rect', {
        x: xPx - w / 2,
        y: yPx - h / 2,
        width: w,
        height: h,
        rx: h * 0.3,
        ry: h * 0.3,
        fill,
        stroke,
        'stroke-width': 1
      })
    );
    group.appendChild(
      makeSVG('line', {
        x1: xPx - w * 0.28,
        y1: yPx - h * 0.28,
        x2: xPx + w * 0.28,
        y2: yPx + h * 0.28,
        stroke: accent,
        'stroke-width': 0.95,
        'stroke-linecap': 'round'
      })
    );
    group.appendChild(
      makeSVG('line', {
        x1: xPx - w * 0.28,
        y1: yPx + h * 0.28,
        x2: xPx + w * 0.28,
        y2: yPx - h * 0.28,
        stroke: accent,
        'stroke-width': 0.95,
        'stroke-linecap': 'round'
      })
    );
    g.appendChild(group);
    return;
  }

  drawHardwareGlyph(g, 'grommet10', xPx, yPx, angle, base, colors);
}

function classifyEdgeSide(midX, midY, bounds) {
  const w = Math.max(1, bounds.maxX - bounds.minX);
  const h = Math.max(1, bounds.maxY - bounds.minY);
  const distTop = Math.abs(midY - bounds.minY) / h;
  const distBottom = Math.abs(bounds.maxY - midY) / h;
  const distLeft = Math.abs(midX - bounds.minX) / w;
  const distRight = Math.abs(bounds.maxX - midX) / w;

  const dists = [
    { side: 'top', dist: distTop },
    { side: 'bottom', dist: distBottom },
    { side: 'left', dist: distLeft },
    { side: 'right', dist: distRight }
  ];
  dists.sort((a, b) => a.dist - b.dist);
  return dists[0].side;
}


function addGrommetLabel(g, x, y, text, opts = {}) {
  const anchor = opts.anchor || 'middle';
  const dx = opts.dx || 0;
  const dy = opts.dy || 0;
  const rotate = opts.rotate || 0;

  const tx = x + dx;
  const ty = y + dy;

  const attrs = {
    x: tx,
    y: ty,
    'text-anchor': anchor,
    'font-size': 9,
    fill: '#0f172a',
    'paint-order': 'stroke',
    stroke: '#ffffff',
    'stroke-width': 2,
    'stroke-linejoin': 'round',
    style: 'user-select:none;pointer-events:none'
  };

  if (rotate) {
    attrs.transform = `rotate(${rotate} ${tx} ${ty})`;
  }

  const label = makeSVG('text', attrs);
  label.textContent = text;
  g.appendChild(label);
}

function placeGrommetsPath(g, points, stepPx, scale, hardwareColorKey, hardwareSides = {}) {
  const r = 4;
  const labelCache = new Set();
  const hwCache = new Set();
  const TOP_OFFSET_CM = 2.5;
  const BOTTOM_OFFSET_CM = 5;
  const colorMeta = resolveHardwareColorMeta(hardwareColorKey || 'dark');
  const fill = colorMeta.fill || '#ffffff';
  const stroke = colorMeta.stroke || '#334155';
  const accent = colorMeta.accent || stroke;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const cornerTopOffsetPx = 5 * scale;
  const cornerBottomGrommetOffsetPx = TOP_OFFSET_CM * scale;
  const cornerBottomDefaultOffsetPx = BOTTOM_OFFSET_CM * scale;

  function drawHardware(side, xPx, yPx, angleOverride = null) {
    const type = normalizeSideHardwareType(hardwareSides[side]);
    const angle = angleOverride !== null ? angleOverride : side === 'left' || side === 'right' ? 90 : 0;
    drawHardwareGlyph(g, type, xPx, yPx, angle, r, { fill, stroke, accent });
  }

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    const baseAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const steps = Math.max(1, Math.floor(len / stepPx));
    const isHorizontal = Math.abs(dy) <= Math.abs(dx) * 0.6;
    const isVertical = Math.abs(dx) <= Math.abs(dy) * 0.6;
    const edgeMidX = (p1.x + p2.x) / 2;
    const edgeMidY = (p1.y + p2.y) / 2;
    const edgeSide = classifyEdgeSide(edgeMidX, edgeMidY, { minX, maxX, minY, maxY });

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = p1.x + dx * t;
      let y = p1.y + dy * t;

      const key = `${x.toFixed(2)}_${y.toFixed(2)}`;
      if (!hwCache.has(key)) {
        hwCache.add(key);

        let angleOverride = baseAngle;
        const isCorner = s === 0 || s === steps;
        if (isCorner && edgeSide === 'top') {
          const topType = normalizeSideHardwareType(hardwareSides.top);
          if (isVerticalCornerType(topType)) {
            angleOverride = 90;
            y = cornerTopOffsetPx;
          }
        }
        if (isCorner && edgeSide === 'bottom') {
          const bottomType = normalizeSideHardwareType(hardwareSides.bottom);
          angleOverride = 90;
          const bottomOffset = useShortBottomOffset(bottomType)
            ? cornerBottomGrommetOffsetPx
            : cornerBottomDefaultOffsetPx;
          y = maxY - bottomOffset;
        }

        drawHardware(edgeSide, x, y, angleOverride);
      }

      if (!scale) continue;

      const labelKey = `${x.toFixed(2)}_${y.toFixed(2)}`;
      if (labelCache.has(labelKey)) continue;
      labelCache.add(labelKey);

      const labelOffset = 10;
      if (isHorizontal) {
        const labelY = y < labelOffset * 2 ? y + labelOffset : y - labelOffset;
        addGrommetLabel(g, x, labelY, formatCmLabel(x / scale));
      } else if (isVertical) {
        const shift = x < labelOffset * 1.5 ? labelOffset : -labelOffset;
        addGrommetLabel(g, x, y + 3, formatCmLabel(y / scale), {
          anchor: shift > 0 ? 'start' : 'end',
          dx: shift
        });
      } else {
        const lenSafe = len || 1;
        const nx = -dy / lenSafe;
        const ny = dx / lenSafe;
        const lx = x + nx * labelOffset;
        const ly = y + ny * labelOffset;
        const distCm = (lenSafe * t) / scale;
        addGrommetLabel(g, lx, ly, formatCmLabel(distCm));
      }
    }
  }
}

function placeGrommetsRect(g, widthCm, heightCm, scale, frameCm, targetStepCm, hardwareSides = {}, hardwareColorKey = 'dark') {
  const TOP_OFFSET_CM = 2.5;
  const BOTTOM_OFFSET_CM = 5;
  const SIDE_TOP_OFFSET_CM = 2.5;

  const MIN_STEP = 20;
  const MAX_STEP = 40;

  const centerInFrameCm = frameCm / 2;
  const framePx = frameCm * scale;

  const topY = centerInFrameCm * scale;
  const bottomY = heightCm * scale - centerInFrameCm * scale;
  const leftX = centerInFrameCm * scale;
  const rightX = widthCm * scale - centerInFrameCm * scale;
  const topLabelY = topY + framePx * 0.8;
  const bottomLabelY = bottomY - framePx * 0.8;
  const leftLabelX = leftX + framePx * 1;
  const rightLabelX = rightX - framePx * 1;

  const colorMeta = resolveHardwareColorMeta(hardwareColorKey || 'dark');
  const stroke = colorMeta.stroke || '#1f2937';
  const fill = colorMeta.fill || '#ffffff';
  const accent = colorMeta.accent || stroke;
  const cornerTopOffsetPx = 5 * scale;

  const sideHardware = {
    top: normalizeSideHardwareType(hardwareSides.top || 'grommet10'),
    bottom: normalizeSideHardwareType(hardwareSides.bottom || 'bracket'),
    left: normalizeSideHardwareType(hardwareSides.left || 'bracket'),
    right: normalizeSideHardwareType(hardwareSides.right || 'bracket')
  };

  function labelTop(xPx, yOverride) {
    const y = typeof yOverride === 'number' ? yOverride : topLabelY;
    addGrommetLabel(g, xPx, y, formatCmLabel(xPx / scale));
  }

  function labelBottom(xPx) {
    addGrommetLabel(g, xPx, bottomLabelY, formatCmLabel(xPx / scale));
  }

  function labelLeft(yPx) {
    addGrommetLabel(g, leftLabelX, yPx + 3, formatCmLabel(yPx / scale), { anchor: 'start' });
  }

  function labelRight(yPx) {
    addGrommetLabel(g, rightLabelX, yPx + 3, formatCmLabel(yPx / scale), { anchor: 'end' });
  }

  function calcPositions(lengthCm, offsetStart, offsetEnd, targetStep) {
    const usable = lengthCm - offsetStart - offsetEnd;
    if (usable <= 0) return [];

    let intervals = Math.max(1, Math.round(usable / targetStep));
    let stepCm = usable / intervals;

    if (stepCm < MIN_STEP) {
      intervals = Math.floor(usable / MIN_STEP) || 1;
      stepCm = usable / intervals;
    }
    if (stepCm > MAX_STEP) {
      intervals = Math.ceil(usable / MAX_STEP) || 1;
      stepCm = usable / intervals;
    }

    const pos = [];
    for (let i = 1; i < intervals; i++) {
      pos.push(offsetStart + stepCm * i);
    }
    return pos;
  }

  function drawHardware(side, xPx, yPx, angleOverride = null) {
    const type = normalizeSideHardwareType(sideHardware[side]);
    const angle = angleOverride !== null ? angleOverride : side === 'left' || side === 'right' ? 90 : 0;
    const base = Math.max(3.2, framePx * 0.32);
    drawHardwareGlyph(g, type, xPx, yPx, angle, base, { fill, stroke, accent });
  }

  const topXsCm = calcPositions(widthCm, TOP_OFFSET_CM, TOP_OFFSET_CM, targetStepCm);
  const bottomXsCm = calcPositions(widthCm, BOTTOM_OFFSET_CM, BOTTOM_OFFSET_CM, targetStepCm);
  const sideMaxForGrommets = heightCm - BOTTOM_OFFSET_CM;
  const sideYsCm = calcPositions(sideMaxForGrommets, SIDE_TOP_OFFSET_CM, SIDE_TOP_OFFSET_CM, targetStepCm);

  const topCornerIsVertical = isVerticalCornerType(sideHardware.top);
  const topCornerY = topCornerIsVertical ? cornerTopOffsetPx : topY;
  const topCornerAngle = topCornerIsVertical ? 90 : null;

  drawHardware('top', leftX, topCornerY, topCornerAngle);
  labelTop(leftX, topCornerY);
  drawHardware('top', rightX, topCornerY, topCornerAngle);
  labelTop(rightX, topCornerY);

  topXsCm.forEach((xCm) => {
    const xPx = xCm * scale;
    drawHardware('top', xPx, topY);
    labelTop(xPx);
  });

  bottomXsCm.forEach((xCm) => {
    const xPx = xCm * scale;
    drawHardware('bottom', xPx, bottomY);
    labelBottom(xPx);
  });

  sideYsCm.forEach((yCm) => {
    const yPx = yCm * scale;
    drawHardware('left', leftX, yPx);
    labelLeft(yPx);
    drawHardware('right', rightX, yPx);
    labelRight(yPx);
  });

  const cornerOffsetBottomCm = useShortBottomOffset(sideHardware.bottom) ? TOP_OFFSET_CM : BOTTOM_OFFSET_CM;
  const cornerBracketYcm = heightCm - cornerOffsetBottomCm;
  const cornerBracketYpx = cornerBracketYcm * scale;

  drawHardware('bottom', leftX, cornerBracketYpx, 90);
  labelBottom(leftX);
  drawHardware('bottom', rightX, cornerBracketYpx, 90);
  labelBottom(rightX);
}

