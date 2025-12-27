function drawShape(shape, widthCm, heightCm, opts = {}) {
  const svg = document.getElementById('preview');
  if (!svg) return;
  svg.innerHTML = '';

  if (!widthCm || !heightCm) return;

  const colorKey =
    opts.edgingColor || (typeof DEFAULT_EDGING_COLOR !== 'undefined' ? DEFAULT_EDGING_COLOR : 'black');
  const colorMeta =
    (typeof getEdgingColorMeta === 'function' && getEdgingColorMeta(colorKey)) || {
      fill: '#2a2f38',
      stroke: '#1f2937'
    };
  const frameFill = colorMeta.fill || '#2a2f38';
  const frameStroke = colorMeta.stroke || frameFill;

  const padding = 40;
  const maxW = 520 - padding * 2;
  const maxH = 440 - padding * 2;

  const fullHeightCm = heightCm; // scale по основному полотну, юбка рисуется отдельно
  const scale = Math.min(maxW / widthCm, maxH / (fullHeightCm || 1));

  if (typeof window !== 'undefined') {
    window.__lastDrawMeta = { scale, padding, widthCm, heightCm };
  }

  const outerW = widthCm * scale;
  const outerH = heightCm * scale;
  const framePx = FRAME_CM * scale;
  const innerX = framePx;
  const innerY = framePx;
  const innerW = outerW - 2 * framePx;
  const innerH = outerH - 2 * framePx;
  const skirtPx = (opts.skirtHeight || 0) * scale;
  const grommetStepCm = opts.grommetStep || 30;
  const grommetStepPx = grommetStepCm * scale;

  const defs = makeSVG('defs');
  const grad = makeSVG('linearGradient', {
    id: 'glassGrad',
    x1: '0%',
    y1: '0%',
    x2: '100%',
    y2: '100%'
  });
  grad.appendChild(makeSVG('stop', { offset: '0%', 'stop-color': '#e5f3ff' }));
  grad.appendChild(makeSVG('stop', { offset: '100%', 'stop-color': '#c0dcf5' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  const g = makeSVG('g', {
    transform: `translate(${padding}, ${padding})`
  });
  svg.appendChild(g);

  if (shape === 'rect') {
    const frameRect = makeSVG('rect', {
      x: 0,
      y: 0,
      width: outerW,
      height: outerH,
      fill: frameFill
    });
    g.appendChild(frameRect);

    const glassRect = makeSVG('rect', {
      x: innerX,
      y: innerY,
      width: innerW,
      height: innerH,
      fill: 'url(#glassGrad)'
    });
    g.appendChild(glassRect);

    placeGrommetsRect(g, widthCm, heightCm, scale, FRAME_CM, grommetStepCm);

    if (skirtPx > 0) {
      const skirt = makeSVG('rect', {
        x: 0,
        y: outerH,
        width: outerW,
        height: framePx,
        fill: frameFill
      });
      g.appendChild(skirt);
    }

    drawSizes(svg, widthCm, heightCm + (opts.skirtHeight || 0), scale, padding);
    drawExtras(g, outerW, outerH, opts, scale, framePx);
    return;
  }

  let points = [];

  if (shape === 'trapezoid') {
    const topDelta = opts.topDelta || 0;
    const topW = (widthCm - topDelta) * scale;
    const offset = (outerW - topW) / 2;

    points = [
      { x: 0, y: outerH },
      { x: outerW, y: outerH },
      { x: outerW - offset, y: 0 },
      { x: offset, y: 0 }
    ];
  } else if (shape === 'angledRight' || shape === 'angledLeft') {
    const flatTopPx = Math.min(Math.max((opts.flatTopHeight || 0) * scale, 0), outerH);
    const slopeStartX = shape === 'angledRight' ? outerW * 0.65 : outerW * 0.35;

    if (shape === 'angledRight') {
      points = [
        { x: 0, y: outerH },
        { x: 0, y: 0 },
        { x: outerW, y: 0 },
        { x: outerW, y: flatTopPx },
        { x: slopeStartX, y: outerH }
      ];
    } else {
      points = [
        { x: slopeStartX, y: outerH },
        { x: 0, y: flatTopPx },
        { x: 0, y: 0 },
        { x: outerW, y: 0 },
        { x: outerW, y: outerH }
      ];
    }
  } else if (shape === 'triangle') {
    points = [
      { x: 0, y: outerH },
      { x: outerW, y: outerH },
      { x: outerW / 2, y: 0 }
    ];
  }

  if (points.length) {
    const d =
      points
        .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
        .join(' ') + ' Z';

    const path = makeSVG('path', {
      d,
      fill: 'url(#glassGrad)',
      stroke: frameStroke,
      'stroke-width': framePx,
      'stroke-linejoin': 'miter'
    });
    g.appendChild(path);

    placeGrommetsPath(g, points, grommetStepPx, scale);
  }

  if (skirtPx > 0) {
    const skirt = makeSVG('rect', {
      x: 0,
      y: outerH,
      width: outerW,
      height: framePx,
      fill: frameFill
    });
    g.appendChild(skirt);
  }

  drawSizes(svg, widthCm, heightCm, scale, padding);
  drawExtras(g, outerW, outerH, opts, scale, framePx);
}

function drawExtras(g, w, h, opts, scale, frameThickness) {
  const skirtHeight = opts.skirtHeight || 0;
  const patchCount = opts.patchCount || 0;
  const sideCutouts = opts.sideCutouts || 0;
  const hasZipper = !!opts.hasZipper;
  const hasPocket = !!opts.hasPocket;
  const pocketSize = opts.pocketSize;
  const zipperColor = opts.zipperColor || 'black';
  const patchPositions = opts.patchPositions || [];
  const cutoutPositions = opts.cutoutPositions || [];
  const patchPolygons = Array.isArray(opts.patchPolygons) ? opts.patchPolygons : [];
  const cutoutPolygons = Array.isArray(opts.cutoutPolygons) ? opts.cutoutPolygons : [];
  const extrasColorKey =
    opts.edgingColor || (typeof DEFAULT_EDGING_COLOR !== 'undefined' ? DEFAULT_EDGING_COLOR : 'black');
  const extrasColorMeta =
    (typeof getEdgingColorMeta === 'function' && getEdgingColorMeta(extrasColorKey)) || {
      fill: '#2a2f38'
    };
  const extrasFrameFill = extrasColorMeta.fill || '#2a2f38';

  const innerTop = frameThickness;
  const innerBottom = h - frameThickness;
  const innerLeft = frameThickness;
  const innerRight = w - frameThickness;

  if (skirtHeight > 0) {
    const skirt = makeSVG('rect', {
      x: 0,
      y: h,
      width: w,
      height: skirtHeight * scale,
      fill: extrasFrameFill
    });
    g.appendChild(skirt);
  }

  if (patchPositions.length > 0) {
    patchPositions.forEach((pos) => {
      const xPx = (pos.xCm || 0) * scale;
      const yPx = (pos.yCm || 0) * scale;
      const patch = makeSVG('rect', {
        x: xPx,
        y: yPx,
        width: 32,
        height: 20,
        fill: 'rgba(255,255,255,0.6)',
        stroke: '#94a3b8',
        'stroke-dasharray': '4 2'
      });
      g.appendChild(patch);
    });
  } else {
    for (let i = 0; i < patchCount; i++) {
      const x = innerLeft + 20 + i * 30;
      const y = innerTop + 25 + i * 15;
      const patch = makeSVG('rect', {
        x,
        y,
        width: 32,
        height: 20,
        fill: 'rgba(255,255,255,0.6)',
        stroke: '#94a3b8',
        'stroke-dasharray': '4 2'
      });
      g.appendChild(patch);
    }
  }

  if (cutoutPositions.length > 0) {
    cutoutPositions.forEach((pos) => {
      const xPx = (pos.xCm || 0) * scale;
      const yPx = (pos.yCm || 0) * scale;
      const cut = makeSVG('rect', {
        x: xPx,
        y: yPx,
        width: 12,
        height: 20,
        fill: '#ffffff',
        stroke: '#0f172a'
      });
      g.appendChild(cut);
    });
  } else {
    for (let i = 0; i < sideCutouts; i++) {
      const cut = makeSVG('rect', {
        x: innerLeft - 6,
        y: innerTop + 40 + i * 35,
        width: 12,
        height: 20,
        fill: '#ffffff',
        stroke: '#0f172a'
      });
      g.appendChild(cut);
    }
  }

  if (patchPolygons.length) {
    patchPolygons.forEach((poly) => {
      if (!poly?.points || poly.points.length < 3) return;
      const ptsStr = poly.points
        .map((p) => `${((p.xCm || 0) * scale).toFixed(2)},${((p.yCm || 0) * scale).toFixed(2)}`)
        .join(' ');
      const pg = makeSVG('polygon', {
        points: ptsStr,
        fill: 'rgba(255,255,255,0.45)',
        stroke: '#94a3b8',
        'stroke-dasharray': '4 2',
        'stroke-width': 1.2
      });
      g.appendChild(pg);
    });
  }

  if (cutoutPolygons.length) {
    cutoutPolygons.forEach((poly) => {
      if (!poly?.points || poly.points.length < 3) return;
      const ptsStr = poly.points
        .map((p) => `${((p.xCm || 0) * scale).toFixed(2)},${((p.yCm || 0) * scale).toFixed(2)}`)
        .join(' ');
      const pg = makeSVG('polygon', {
        points: ptsStr,
        fill: '#ffffff',
        stroke: '#0f172a',
        'stroke-width': 1.4
      });
      g.appendChild(pg);
    });
  }

  if (hasZipper) {
    const TAPE_WIDTH_CM = 4;      // С‚РѕР»С‰РёРЅР° РєР°Р¶РґРѕР№ Р»РµРЅС‚С‹ РјРѕР»РЅРёРё
    const STRIPE_WIDTH_CM = 1;    // Р±РµР»Р°СЏ РїРѕР»РѕСЃР° РјРµР¶РґСѓ Р»РµРЅС‚Р°РјРё

    const tapeWidth = TAPE_WIDTH_CM * scale;
    const stripeWidth = STRIPE_WIDTH_CM * scale;
    const tapeFill = extrasFrameFill; // С†РІРµС‚ РєР°РЅС‚Р° РјРѕР»РЅРёРё СЃРѕРІРїР°РґР°РµС‚ СЃ С†РІРµС‚РѕРј РѕРєР°РЅС‚РѕРІРєРё РѕРєРЅР°
    const stripeFill = extrasColorKey === 'white' ? '#f1f5f9' : '#ffffff';

    const centerX = (innerLeft + innerRight) / 2;

    const leftTapeX = centerX - stripeWidth / 2 - tapeWidth;
    const rightTapeX = centerX + stripeWidth / 2;

    const yTop = 0; // С‚СЏРЅРµРј РјРѕР»РЅРёСЋ РІРѕ РІСЃСЋ РІС‹СЃРѕС‚Сѓ РѕРєРЅР°
    const yBottom = h;

    g.appendChild(
      makeSVG('rect', {
        x: leftTapeX,
        y: yTop,
        width: tapeWidth,
        height: yBottom - yTop,
        fill: tapeFill
      })
    );

    g.appendChild(
      makeSVG('rect', {
        x: rightTapeX,
        y: yTop,
        width: tapeWidth,
        height: yBottom - yTop,
        fill: tapeFill
      })
    );

    g.appendChild(
      makeSVG('rect', {
        x: centerX - stripeWidth / 2,
        y: yTop,
        width: stripeWidth,
        height: yBottom - yTop,
        fill: stripeFill
      })
    );
  }
}

// Arrow helper: thicker, filled arrowheads for dimension lines
function makeArrow(x, y, dir) {
  const s = 7;
  let points = [];
  if (dir === 'left') points = [
    [x, y],
    [x + s, y - s * 0.7],
    [x + s, y + s * 0.7]
  ];
  if (dir === 'right') points = [
    [x, y],
    [x - s, y - s * 0.7],
    [x - s, y + s * 0.7]
  ];
  if (dir === 'up') points = [
    [x, y],
    [x - s * 0.7, y + s],
    [x + s * 0.7, y + s]
  ];
  if (dir === 'down') points = [
    [x, y],
    [x - s * 0.7, y - s],
    [x + s * 0.7, y - s]
  ];
  const pts = points.map(([px, py]) => `${px},${py}`).join(' ');
  const g = makeSVG('g');
  const shadow = makeSVG('polygon', {
    points: pts,
    fill: 'rgba(15,23,42,0.15)'
  });
  const arrow = makeSVG('polygon', {
    points: pts,
    fill: '#2563eb',
    stroke: '#0f172a',
    'stroke-width': 1
  });
  g.appendChild(shadow);
  g.appendChild(arrow);
  return g;
}

function drawSizes(svg, widthCm, heightCm, scale, pad, frameThickness = 0) {
  const g = makeSVG('g');
  const w = widthCm * scale;
  const h = heightCm * scale;

  // Put dimension guides slightly outside the shape bounds, Photoshop-style
  const dimOffset = 14;
  const yDim = Math.max(12, pad - dimOffset);
  const xDim = Math.max(12, pad - dimOffset);

  g.appendChild(
    makeSVG('line', {
      x1: pad,
      y1: yDim,
      x2: pad + w,
      y2: yDim,
      stroke: '#0f172a',
      'stroke-width': 1.4
    })
  );
  g.appendChild(makeArrow(pad, yDim, 'left'));
  g.appendChild(makeArrow(pad + w, yDim, 'right'));

  const pillW = 46;
  const pillH = 20;
  const pillX = pad + w / 2 - pillW / 2;
  const pillY = yDim + 4;

  const pillTop = makeSVG('rect', {
    x: pillX,
    y: pillY,
    width: pillW,
    height: pillH,
    rx: 10,
    ry: 10,
    fill: '#e0f2ff',
    stroke: '#38bdf8',
    'stroke-width': 1,
    'data-size-type': 'width',
    style: 'cursor:pointer'
  });
  g.appendChild(pillTop);

  const tTop = makeSVG('text', {
    x: pillX + pillW / 2,
    y: pillY + 14,
    'text-anchor': 'middle',
    'font-size': 11,
    fill: '#0f172a',
    'data-size-type': 'width',
    style: 'cursor:pointer;user-select:none'
  });
  tTop.textContent = widthCm;
  g.appendChild(tTop);

  const pillLeftX = xDim - pillW / 2;
  const pillLeftY = pad + h / 2 - pillH / 2;

  const pillLeft = makeSVG('rect', {
    x: pillLeftX,
    y: pillLeftY,
    width: pillW,
    height: pillH,
    rx: 10,
    ry: 10,
    fill: '#e0f2ff',
    stroke: '#38bdf8',
    'stroke-width': 1,
    'data-size-type': 'height',
    style: 'cursor:pointer'
  });
  g.appendChild(pillLeft);

  const tLeft = makeSVG('text', {
    x: pillLeftX + pillW / 2,
    y: pillLeftY + 14,
    'text-anchor': 'middle',
    'font-size': 11,
    fill: '#0f172a',
    'data-size-type': 'height',
    style: 'cursor:pointer;user-select:none'
  });
  tLeft.textContent = heightCm;
  g.appendChild(tLeft);

  g.appendChild(
    makeSVG('line', {
      x1: xDim,
      y1: pad,
      x2: xDim,
      y2: pad + h,
      stroke: '#0f172a',
      'stroke-width': 1.4
    })
  );
  g.appendChild(makeArrow(xDim, pad, 'up'));
  g.appendChild(makeArrow(xDim, pad + h, 'down'));

  svg.appendChild(g);
}

