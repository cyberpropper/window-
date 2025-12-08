function placeGrommetsPath(g, points, stepPx) {
  const r = 4;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);

    const steps = Math.max(1, Math.floor(len / stepPx));
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
    }
  }
}

function placeGrommetsArch(g, w, h, rectH, stepPx) {
  const r = 4;

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
  drawGlover(rightX, topY);

  const topXsCm = calcPositions(widthCm, TOP_OFFSET_CM, TOP_OFFSET_CM, targetStepCm);
  topXsCm.forEach((xCm) => {
    const xPx = xCm * scale;
    drawGlover(xPx, topY);
  });

  // скобы по низу
  const bottomXsCm = calcPositions(widthCm, BOTTOM_OFFSET_CM, BOTTOM_OFFSET_CM, targetStepCm);
  bottomXsCm.forEach((xCm) => {
    const xPx = xCm * scale;
    drawBracket(xPx, bottomY);
  });

  // боковые стороны
  const sideMaxForGrommets = heightCm - BOTTOM_OFFSET_CM;
  const sideYsCm = calcPositions(sideMaxForGrommets, SIDE_TOP_OFFSET_CM, SIDE_TOP_OFFSET_CM, targetStepCm);

  sideYsCm.forEach((yCm) => {
    const yPx = yCm * scale;
    drawBracket(leftX, yPx);
    drawBracket(rightX, yPx);
  });

  const cornerBracketYcm = heightCm - BOTTOM_OFFSET_CM;
  const cornerBracketYpx = cornerBracketYcm * scale;

  drawBracket(leftX, cornerBracketYpx);
  drawBracket(rightX, cornerBracketYpx);
}
