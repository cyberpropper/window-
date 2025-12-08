function drawShape(shape, widthCm, heightCm, opts = {}) {
  const svg = document.getElementById('preview');
  if (!svg) return;
  svg.innerHTML = '';

  if (!widthCm || !heightCm) return;

  const padding = 40;
  const maxW = 520 - padding * 2;
  const maxH = 440 - padding * 2;

  const fullHeightCm = heightCm + (opts.skirtHeight || 0);
  const scale = Math.min(maxW / widthCm, maxH / (fullHeightCm || 1));

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
      fill: '#2a2f38'
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
        fill: '#2a2f38'
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
  } else if (shape === 'angledRight') {
    const flatTopPx = (opts.flatTopHeight || 0) * scale;
    const slopeStartX = outerW * 0.65;

    points = [
      { x: 0, y: outerH },
      { x: 0, y: 0 },
      { x: outerW, y: 0 },
      { x: outerW, y: flatTopPx },
      { x: slopeStartX, y: outerH }
    ];
  }

  if (shape === 'arch') {
    const archPx = Math.min((opts.archHeight || 0) * scale, outerH - 20);
    const rectH = outerH - archPx;
    const radius = outerW / 2;

    const path = makeSVG('path', {
      d: `
        M 0 ${outerH}
        L 0 ${rectH}
        A ${radius} ${radius} 0 0 1 ${outerW} ${rectH}
        L ${outerW} ${outerH}
        Z
      `,
      fill: 'url(#glassGrad)',
      stroke: '#2a2f38',
      'stroke-width': framePx,
      'stroke-linejoin': 'miter'
    });
    g.appendChild(path);

    placeGrommetsArch(g, outerW, outerH, rectH, grommetStepPx);

    if (skirtPx > 0) {
      const skirt = makeSVG('rect', {
        x: 0,
        y: outerH,
        width: outerW,
        height: framePx,
        fill: '#2a2f38'
      });
      g.appendChild(skirt);
    }

    drawSizes(svg, widthCm, heightCm + (opts.skirtHeight || 0), scale, padding);
    drawExtras(g, outerW, outerH, opts, scale, framePx);
    return;
  }

  if (points.length) {
    const d =
      points
        .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
        .join(' ') + ' Z';

    const path = makeSVG('path', {
      d,
      fill: 'url(#glassGrad)',
      stroke: '#2a2f38',
      'stroke-width': framePx,
      'stroke-linejoin': 'miter'
    });
    g.appendChild(path);

    placeGrommetsPath(g, points, grommetStepPx);
  }

  if (skirtPx > 0) {
    const skirt = makeSVG('rect', {
      x: 0,
      y: outerH,
      width: outerW,
      height: framePx,
      fill: '#2a2f38'
    });
    g.appendChild(skirt);
  }

  drawSizes(svg, widthCm, heightCm + (opts.skirtHeight || 0), scale, padding);
  drawExtras(g, outerW, outerH, opts, scale, framePx);
}

function drawExtras(g, w, h, opts, scale, frameThickness) {
  const skirtHeight = opts.skirtHeight || 0;
  const patchCount = opts.patchCount || 0;
  const sideCutouts = opts.sideCutouts || 0;
  const hasZipper = !!opts.hasZipper;
  const hasPocket = !!opts.hasPocket;
  const pocketSize = opts.pocketSize;
  const patchPositions = opts.patchPositions || [];
  const cutoutPositions = opts.cutoutPositions || [];

  const innerTop = frameThickness;
  const innerBottom = h - frameThickness;
  const innerLeft = frameThickness;
  const innerRight = w - frameThickness;

  if (skirtHeight > 0) {
    const skirt = makeSVG('rect', {
      x: 0,
      y: h,
      width: w,
      height: frameThickness,
      fill: '#2a2f38'
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

  if (hasZipper) {
    const TAPE_WIDTH_CM = 3;
    const GAP_CM = 1;
    const HEAD_SIZE_CM = 4;

    const tapeWidth = TAPE_WIDTH_CM * scale;
    const gap = GAP_CM * scale;
    const headSize = HEAD_SIZE_CM * scale;

    const centerX = (innerLeft + innerRight) / 2;

    const leftTapeX = centerX - gap / 2 - tapeWidth;
    const rightTapeX = centerX + gap / 2;

    const yTop = innerTop + frameThickness;
    const yBottom = innerBottom - frameThickness;

    g.appendChild(
      makeSVG('rect', {
        x: leftTapeX,
        y: yTop,
        width: tapeWidth,
        height: yBottom - yTop,
        fill: '#2d2d2d'
      })
    );

    g.appendChild(
      makeSVG('rect', {
        x: rightTapeX,
        y: yTop,
        width: tapeWidth,
        height: yBottom - yTop,
        fill: '#2d2d2d'
      })
    );

    g.appendChild(
      makeSVG('rect', {
        x: centerX - tapeWidth - gap,
        y: yTop - headSize,
        width: tapeWidth * 2 + gap,
        height: headSize,
        fill: '#1b1b1b'
      })
    );

    g.appendChild(
      makeSVG('rect', {
        x: centerX - tapeWidth - gap,
        y: yBottom,
        width: tapeWidth * 2 + gap,
        height: headSize,
        fill: '#1b1b1b'
      })
    );
  }
}

function drawSizes(svg, widthCm, heightCm, scale, pad, frameThickness = 0) {
  const g = makeSVG('g');
  const w = widthCm * scale;
  const h = heightCm * scale;

  g.appendChild(
    makeSVG('line', {
      x1: pad,
      y1: 18,
      x2: pad + w,
      y2: 18,
      stroke: '#9ca3af',
      'stroke-width': 1.2
    })
  );
  g.appendChild(makeArrow(pad, 18, 'left'));
  g.appendChild(makeArrow(pad + w, 18, 'right'));

  const pillW = 46;
  const pillH = 20;
  const pillX = pad + w / 2 - pillW / 2;
  const pillY = 22;

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

  const pillLeftX = 8;
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
      x1: 18,
      y1: pad,
      x2: 18,
      y2: pad + h,
      stroke: '#9ca3af',
      'stroke-width': 1.2
    })
  );
  g.appendChild(makeArrow(18, pad, 'up'));
  g.appendChild(makeArrow(18, pad + h, 'down'));

  svg.appendChild(g);
}
