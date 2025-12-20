function formatCmLabel(valueCm) {
  if (!isFinite(valueCm)) return '';
  const rounded = Math.round(valueCm * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} см`;
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

function placeGrommetsPath(g, points, stepPx, scale) {
  const r = 4;
  const labelCache = new Set();

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
          fill: '#ffffff',
          stroke: '#334155',
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

function placeGrommetsArch(g, w, h, rectH, stepPx, scale) {
  const r = 4;
  const framePx = typeof FRAME_CM !== 'undefined' ? FRAME_CM * (scale || 1) : 0;
  const labelCache = new Set();

  // низ
  for (let x = 0; x <= w; x += stepPx) {
    g.appendChild(
      makeSVG('circle', {
        cx: x,
        cy: h,
        r,
        fill: '#ffffff',
        stroke: '#334155',
        'stroke-width': 1.3
      })
    );

    if (scale) {
      const key = `${x.toFixed(2)}_${h.toFixed(2)}`;
      if (!labelCache.has(key)) {
        labelCache.add(key);
        const labelY = h - Math.max(framePx * 0.7, 8);
        addGrommetLabel(g, x, labelY, formatCmLabel(x / scale));
      }
    }
  }

  // левый вертикальный
  for (let y = h; y >= rectH; y -= stepPx) {
    g.appendChild(
      makeSVG('circle', {
        cx: 0,
        cy: y,
        r,
        fill: '#ffffff',
        stroke: '#334155',
        'stroke-width': 1.3
      })
    );

    if (scale) {
      const key = `0_${y.toFixed(2)}`;
      if (!labelCache.has(key)) {
        labelCache.add(key);
        const labelX = Math.max(framePx * 0.8, 10);
        addGrommetLabel(g, labelX, y + 3, formatCmLabel(y / scale), { anchor: 'start' });
      }
    }
  }

  // дуга
  const radius = w / 2;
  const cx = w / 2;
  const cy = rectH;
  const arcLen = Math.PI * radius;
  const steps = Math.max(1, Math.floor(arcLen / stepPx));

  for (let i = 0; i <= steps; i++) {
    const angle = Math.PI - (Math.PI * i) / steps;
    const x = cx + radius * Math.cos(angle);
    const y = cy - radius * Math.sin(angle);

    g.appendChild(
      makeSVG('circle', {
        cx: x,
        cy: y,
        r,
        fill: '#ffffff',
        stroke: '#334155',
        'stroke-width': 1.3
      })
    );

    if (scale) {
      const key = `${x.toFixed(2)}_${y.toFixed(2)}`;
      if (!labelCache.has(key)) {
        labelCache.add(key);
        const distCm = ((Math.PI - angle) * radius) / scale;
        const dxCenter = cx - x;
        const dyCenter = cy - y;
        const lenToCenter = Math.hypot(dxCenter, dyCenter) || 1;
        const offset = Math.max(framePx * 0.6, 8);
        const lx = x + (dxCenter / lenToCenter) * offset;
        const ly = y + (dyCenter / lenToCenter) * offset;
        addGrommetLabel(g, lx, ly, formatCmLabel(distCm));
      }
    }
  }

  // правый вертикальный
  for (let y = rectH; y <= h; y += stepPx) {
    g.appendChild(
      makeSVG('circle', {
        cx: w,
        cy: y,
        r,
        fill: '#ffffff',
        stroke: '#334155',
        'stroke-width': 1.3
      })
    );

    if (scale) {
      const key = `${w.toFixed(2)}_${y.toFixed(2)}`;
      if (!labelCache.has(key)) {
        labelCache.add(key);
        const labelX = w - Math.max(framePx * 0.8, 10);
        addGrommetLabel(g, labelX, y + 3, formatCmLabel(y / scale), { anchor: 'end' });
      }
    }
  }
}

function placeGrommetsRect(g, widthCm, heightCm, scale, frameCm, targetStepCm) {
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
        fill: '#ffffff',
        stroke: '#1f2937',
        'stroke-width': 1.5
      })
    );
  }

  function drawBracket(xPx, yPx) {
    const w = framePx * 0.9;
    const h = framePx * 1.1;

    const rect = makeSVG('rect', {
      x: xPx - w / 2,
      y: yPx - h / 2,
      width: w,
      height: h,
      rx: h * 0.3,
      ry: h * 0.3,
      fill: '#e5e7eb',
      stroke: '#4b5563',
      'stroke-width': 1
    });
    g.appendChild(rect);

    g.appendChild(
      makeSVG('circle', {
        cx: xPx,
        cy: yPx,
        r: w * 0.25,
        fill: '#ffffff',
        stroke: '#111827',
        'stroke-width': 1
      })
    );
  }

  // верхние люверсы
  drawGlover(leftX, topY);
  labelTop(leftX);
  drawGlover(rightX, topY);
  labelTop(rightX);

  const topXsCm = calcPositions(widthCm, TOP_OFFSET_CM, TOP_OFFSET_CM, targetStepCm);
  topXsCm.forEach((xCm) => {
    const xPx = xCm * scale;
    drawGlover(xPx, topY);
    labelTop(xPx);
  });

  // скобы по низу
  const bottomXsCm = calcPositions(widthCm, BOTTOM_OFFSET_CM, BOTTOM_OFFSET_CM, targetStepCm);
  bottomXsCm.forEach((xCm) => {
    const xPx = xCm * scale;
    drawBracket(xPx, bottomY);
    labelBottom(xPx);
  });

  // боковые стороны
  const sideMaxForGrommets = heightCm - BOTTOM_OFFSET_CM;
  const sideYsCm = calcPositions(sideMaxForGrommets, SIDE_TOP_OFFSET_CM, SIDE_TOP_OFFSET_CM, targetStepCm);

  sideYsCm.forEach((yCm) => {
    const yPx = yCm * scale;
    drawBracket(leftX, yPx);
    labelLeft(yPx);
    drawBracket(rightX, yPx);
    labelRight(yPx);
  });

  const cornerBracketYcm = heightCm - BOTTOM_OFFSET_CM;
  const cornerBracketYpx = cornerBracketYcm * scale;

  drawBracket(leftX, cornerBracketYpx);
  labelBottom(leftX);
  drawBracket(rightX, cornerBracketYpx);
  labelBottom(rightX);
}
