/* ascii.js — botanical ASCII animation for landing page canvas */

(function () {
  'use strict';

  var canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GREEN = '#50e050';
  var FONT_SIZE = 15;
  var CELL_W = 13; /* horizontal step per character column */
  var CELL_H = 22; /* vertical step per character row */

  /* Patch templates.
     Each template is an array of rows, index 0 = bottom row, last index = top row.
     Each row is a string. Non-space characters are drawn; spaces are skipped.
     The top row (last index) sways with the sinusoidal wave.
     All other rows are static.

     Characters used:
       tips/flowers : ✿ ❀ ✾ ❁ ✽ ⚘ ⁕ ※ ✤ ✣
       bodies       : ⊹ ∗ ⋆
       stems        : ˖
       ground       : ° ·
  */
  var TEMPLATES = [
    /* A — wide, lush, 4 rows */
    [
      '· · ° · · ° · · · ° · ·',
      ' ˖   ˖   ˖   ˖   ˖   ˖ ',
      '⊹  ⋆ ⊹  ∗  ⋆  ⊹  ∗  ⋆ ',
      '✿ ❀ ✾ ❁ ✽ ⚘ ✿ ❀ ❁ ✾ ✽ ⚘',
    ],
    /* B — medium, 4 rows */
    [
      '·  ° · · °',
      ' ˖   ˖   ˖',
      '⊹  ⋆ ⊹  ∗ ',
      '✽ ⚘ ✿ ❁ ✾',
    ],
    /* C — wide sparse, 4 rows */
    [
      '·   ° · ·   ° ·   · °   · ·',
      ' ˖     ˖     ˖     ˖     ˖  ',
      '⋆   ⊹   ∗   ⊹   ⋆    ∗   ⊹ ',
      '✾  ❀  ✽  ⚘  ✤  ✣  ❁  ⁕  ※ ',
    ],
    /* D — small, 3 rows */
    [
      '· ° · ·',
      '˖   ˖  ',
      '⚘ ❁ ✽ ✾',
    ],
    /* E — medium-wide, 4 rows */
    [
      '° · · ° · · ° · ·',
      '˖   ˖   ˖   ˖   ˖ ',
      '∗ ⊹ ⋆  ∗ ⊹  ⋆  ∗ ',
      '❀ ✿ ✾ ⚘ ❁ ✽ ✤ ✣ ⁕',
    ],
    /* F — tall-ish sparse, 5 rows */
    [
      '° ·   °',
      '˖   ˖  ',
      '∗  ⊹  ⋆',
      ' ⊹   ∗ ',
      '✿  ❁  ✾',
    ],
  ];

  /* Patch placements.
     t: template index
     x, y: position of the patch's top-left corner as a fraction of canvas dimensions
     phase: wave phase offset (radians) so patches don't all sway in sync
  */
  var PLACEMENTS = [
    /* upper zone */
    { t: 3, x: 0.05,  y: 0.06, phase: 1.2  },
    { t: 1, x: 0.40,  y: 0.10, phase: 3.8  },
    { t: 5, x: 0.74,  y: 0.14, phase: 0.5  },
    /* upper-mid zone */
    { t: 4, x: 0.16,  y: 0.30, phase: 2.3  },
    { t: 0, x: 0.50,  y: 0.34, phase: 4.6  },
    { t: 2, x: 0.80,  y: 0.28, phase: 1.7  },
    /* mid zone */
    { t: 1, x: 0.02,  y: 0.50, phase: 3.1  },
    { t: 3, x: 0.33,  y: 0.54, phase: 0.9  },
    { t: 5, x: 0.64,  y: 0.48, phase: 2.5  },
    /* lower zone */
    { t: 0, x: 0.06,  y: 0.70, phase: 0.0  },
    { t: 4, x: 0.34,  y: 0.75, phase: 4.2  },
    { t: 2, x: 0.60,  y: 0.72, phase: 1.4  },
    { t: 3, x: 0.87,  y: 0.78, phase: 3.0  },
  ];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawPatch(rows, px, py, time, phase) {
    ctx.font = FONT_SIZE + 'px Arial, Helvetica, sans-serif';
    ctx.fillStyle = GREEN;
    ctx.textBaseline = 'top';

    var numRows = rows.length;

    rows.forEach(function (row, rowIdx) {
      var isTop = rowIdx === numRows - 1;
      var chars = Array.from(row); /* correctly splits multi-byte Unicode */
      var baseY = py + (numRows - 1 - rowIdx) * CELL_H;

      chars.forEach(function (ch, colIdx) {
        if (ch === ' ') return;
        var x = px + colIdx * CELL_W;
        var y = baseY;
        if (isTop && !prefersReduced) {
          /* strong sinusoidal sway — tips blowing in the wind */
          y += Math.sin(time * 1.4 + colIdx * 0.8 + phase) * 12;
        }
        ctx.fillText(ch, x, y);
      });
    });
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    PLACEMENTS.forEach(function (p) {
      drawPatch(
        TEMPLATES[p.t],
        p.x * canvas.width,
        p.y * canvas.height,
        time,
        p.phase
      );
    });
  }

  var rafId;

  function animate(ts) {
    draw(ts / 1000);
    rafId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', function () {
    resize();
    if (prefersReduced) draw(0);
  });

  if (prefersReduced) {
    draw(0);
  } else {
    rafId = requestAnimationFrame(animate);
  }

}());
