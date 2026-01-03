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

function placeGrommetsPath(g, points, stepPx, scale, hardwareColorKey) {
  const r = 4;
  const labelCache = new Set();
  const colorMeta = resolveHardwareColorMeta(hardwareColorKey || 'dark');
  const fill = colorMeta.fill || '#ffffff';
  const stroke = colorMeta.stroke || '#334155';

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);

    const steps = Math.max(1, Math.floor(len / stepPx));
    const isHorizontal = Math.abs(dy) <= Math.abs(dx) * 0.6;
    const isVertical = Math.abs(dx) <= Math.abs(dy) * 0.6;

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = p1.x + dx * t;
      const y = p1.y + dy * t;

      g.appendChild(
        makeSVG('circle', {
          cx: x,
          cy: y,
          r,
          fill,
          stroke,
          'stroke-width': 1.3
        })
      );

      if (!scale) continue;

      const key = `${x.toFixed(2)}_${y.toFixed(2)}`;
      if (labelCache.has(key)) continue;
      labelCache.add(key);

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

  const sideHardware = {
    top: hardwareSides.top || 'grommet',
    bottom: hardwareSides.bottom || 'strap',
    left: hardwareSides.left || 'strap',
    right: hardwareSides.right || 'strap'
  };

  function labelTop(xPx) {
    addGrommetLabel(g, xPx, topLabelY, formatCmLabel(xPx / scale));
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

  function drawGlover(xPx, yPx) {
    const r = framePx * 0.3;
    g.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r,
        fill,
        stroke,
        'stroke-width': 1.5
      })
    );
  }

  function drawRotary(xPx, yPx, angle = 0) {
    const w = framePx * 0.9;
    const h = framePx * 0.55;
    const rect = makeSVG('rect', {
      x: xPx - w / 2,
      y: yPx - h / 2,
      width: w,
      height: h,
      rx: h * 0.4,
      ry: h * 0.4,
      fill,
      stroke,
      'stroke-width': 1
    });
    if (angle) rect.setAttribute('transform', `rotate(${angle} ${xPx} ${yPx})`);
    g.appendChild(rect);

    g.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: h * 0.25,
        fill: accent,
        stroke,
        'stroke-width': 0.8
      })
    );
  }

  function drawLag(xPx, yPx, angle = 0) {
    const len = framePx * 0.9;
    const grp = makeSVG('g', angle ? { transform: `rotate(${angle} ${xPx} ${yPx})` } : {});
    grp.appendChild(
      makeSVG('line', {
        x1: xPx - len / 2,
        y1: yPx,
        x2: xPx + len / 2,
        y2: yPx,
        stroke: accent,
        'stroke-width': 2,
        'stroke-linecap': 'round'
      })
    );
    grp.appendChild(
      makeSVG('line', {
        x1: xPx,
        y1: yPx - len / 2,
        x2: xPx,
        y2: yPx + len / 2,
        stroke: accent,
        'stroke-width': 2,
        'stroke-linecap': 'round'
      })
    );
    g.appendChild(grp);
  }

  function drawStrap(xPx, yPx, angle = 0) {
    const w = framePx * 1.2;
    const h = framePx * 0.45;
    const rect = makeSVG('rect', {
      x: xPx - w / 2,
      y: yPx - h / 2,
      width: w,
      height: h,
      rx: h * 0.4,
      ry: h * 0.4,
      fill,
      stroke,
      'stroke-width': 1
    });
    if (angle) rect.setAttribute('transform', `rotate(${angle} ${xPx} ${yPx})`);
    g.appendChild(rect);
    g.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: h * 0.3,
        fill: '#ffffff',
        stroke: accent,
        'stroke-width': 1
      })
    );
  }

  function drawHardware(side, xPx, yPx) {
    const type = sideHardware[side] || 'grommet';
    const angle = side === 'left' || side === 'right' ? 90 : 0;
    if (type === 'rotary') return drawRotary(xPx, yPx, angle);
    if (type === 'lag') return drawLag(xPx, yPx, angle);
    if (type === 'strap') return drawStrap(xPx, yPx, angle);
    return drawGlover(xPx, yPx);
  }

  const topXsCm = calcPositions(widthCm, TOP_OFFSET_CM, TOP_OFFSET_CM, targetStepCm);
  const bottomXsCm = calcPositions(widthCm, BOTTOM_OFFSET_CM, BOTTOM_OFFSET_CM, targetStepCm);
  const sideMaxForGrommets = heightCm - BOTTOM_OFFSET_CM;
  const sideYsCm = calcPositions(sideMaxForGrommets, SIDE_TOP_OFFSET_CM, SIDE_TOP_OFFSET_CM, targetStepCm);

  drawHardware('top', leftX, topY);
  labelTop(leftX);
  drawHardware('top', rightX, topY);
  labelTop(rightX);

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

  const cornerBracketYcm = heightCm - BOTTOM_OFFSET_CM;
  const cornerBracketYpx = cornerBracketYcm * scale;

  drawHardware('bottom', leftX, cornerBracketYpx);
  labelBottom(leftX);
  drawHardware('bottom', rightX, cornerBracketYpx);
  labelBottom(rightX);
}

