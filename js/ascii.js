/* ascii.js — botanical ASCII animation for landing page canvas */

(function () {
  'use strict';

  var canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GREEN = '#50e050';
  var FONT_SIZE = 15;
  var CELL_W = 10;
  var CELL_H = 18;

  /* Each species has:
       stages    — array of 4 growth stages (index 0 = bottom row, last = top row / sways)
       stalkCol  — per-stage column index of the trunk, so plant.x always maps to the stalk */

  var SPECIES = [

    /* ── Species A ─────────────────────────────────────────── */
    {
      stages: [
        /* A1 — seed */
        ['@'],

        /* A2 — sprout */
        ['/', '|', '.'],

        /* A3 — young */
        [
          '   /\\',
          '   /|\\  ★゛ ',
          ' /||||\\★ ',
          '/|||\\★゛',
          '   ||||',
          ' ゛★/||'
        ],

        /* A4 — full */
        [
          '   /|||||',
          '  \\||||/ ',
          '|||||||●',
          '゛★/||||\\●',
          ' /||||| ★゛',
          ' \\||||/★゛  ',
          ' ★゛|●|||||  ',
          '  ★/||||\\●  ',
          '   \\/ | ',
          '  \\    /'
        ]
      ],
      stalkCol: [0, 0, 3, 3]
    },

    /* ── Species B ─────────────────────────────────────────── */
    {
      stages: [
        /* B1 — seed */
        ['𖧧'],

        /* B2 — sprout */
        ['||', '  |⎠', ' ||', ' ⎝'],

        /* B3 — young */
        [
          ' | ||',
          '  |||⎠',
          ' ||||||',
          '||||||||',
          '||⊹|||||⊹',
          '⎝||||||⊹',
          '    ⎠'
        ],

        /* B4 — full */
        [
          '  |||',
          '|||||||  .',
          '|||⎝|||||.',
          '.⎝|||||||. ',
          '.|||⎝||||. ',
          '.||||| ⎝||⎠',
          '|||.||',
          '   .||||| ||⎠ ',
          ' ⊹|||||',
          '       ⎠'
        ]
      ],
      stalkCol: [0, 0, 1, 2]
    },

    /* ── Species C ─────────────────────────────────────────── */
    {
      stages: [
        /* C1 — seed (two-row stalk nub) */
        [
          '|',
          '|'
        ],

        /* C2 — sprout */
        [
          ' |',
          ' | |',
          '/| |\\+',
          '~| |+'
        ],

        /* C3 — young */
        [
          '/| | |\\',
          '| |',
          '*.+.*|| |',
          '\\●/| | |\\~',
          '| |*.+.*|'
        ],

        /* C4 — full */
        [
          '/| | |\\',
          '| |',
          '*.+.*|| | ',
          '/| |\\●/| | |\\',
          '       | /*\\ |',
          '       |*-+-*|',
          '  /| |\\| \\*/ |',
          '     /\\●/ |\\ ',
          '~~| |\\●/',
          '*.+.*|| | ',
          '   /| |\\●/| | |\\~'
        ]
      ],
      stalkCol: [0, 1, 1, 1]
    }

  ];

  /* Animation timeline — plays in a loop per plant.
     Slowed right down so the cycle feels seasonal.
     dur values are base durations divided by plant.speed. */
  var TIMELINE = [
    { type: 'show',  stage: 0, dur: 1.5  },
    { type: 'show',  stage: 1, dur: 3.0  },
    { type: 'show',  stage: 2, dur: 5.0  },
    { type: 'show',  stage: 3, dur: 14.0 },
    { type: 'poof',  stage: 3, dur: 1.8  }, /* short + √p easing = fast & punchy */
    { type: 'pause',           dur: 5.0  }
  ];

  var tlStarts = [];
  var cycleDur = (function () {
    var acc = 0;
    TIMELINE.forEach(function (ev) { tlStarts.push(acc); acc += ev.dur; });
    return acc;
  }());

  function getState(localT, speed) {
    if (localT < 0) return null;
    var tc = (localT * speed) % cycleDur;
    for (var i = TIMELINE.length - 1; i >= 0; i--) {
      if (tc >= tlStarts[i]) {
        return { ev: TIMELINE[i], p: (tc - tlStarts[i]) / TIMELINE[i].dur };
      }
    }
    return null;
  }

  /* ── Wind ──────────────────────────────────────────────────
     A slow traveling wave sweeps left→right across the field.
     Each row bends proportionally to its height — base is
     anchored, canopy arcs — like a cornfield in a breeze. */

  var WIND_FREQ   = 0.22;   /* Hz — one full wave every ~4.5 s */
  var WIND_SPREAD = 5.8;    /* radians of phase across full width */
  var WIND_AMP    = 20;     /* max px displacement at the very top row */

  function windX(t, plant, rowIdx, totalRows) {
    /* Phase: global time + plant's x position (traveling wave) + plant's own phase */
    var phase = t * WIND_FREQ * Math.PI * 2 + plant.x * WIND_SPREAD + plant.phase;
    /* Secondary flutter: a faster, smaller ripple per-column of leaves */
    var flutter = Math.sin(t * WIND_FREQ * 3.1 + plant.x * 2.3 + plant.phase * 0.7) * 0.3;
    /* Height fraction: 0 at ground, 1 at canopy — quadratic so the stalk base barely moves */
    var h = (rowIdx + 1) / totalRows;
    var amp = h * h * WIND_AMP;
    return (Math.sin(phase) + flutter) * amp;
  }

  function drawStage(stageIdx, alpha, t, plant, poof) {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;

    var sp         = SPECIES[plant.species];
    var rows       = sp.stages[stageIdx];
    var sc         = sp.stalkCol[stageIdx];
    var px         = Math.round(plant.x * canvas.width);
    var py         = Math.round(plant.y * canvas.height);
    var totalRows  = rows.length;
    poof = poof || 0;

    for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      var row   = rows[rowIdx];
      var chars = Array.from(row);
      var baseY = py - rowIdx * CELL_H;

      for (var colIdx = 0; colIdx < chars.length; colIdx++) {
        var ch = chars[colIdx];
        if (ch === ' ') continue;
        var x = px + (colIdx - sc) * CELL_W;
        var y = baseY;

        if (poof > 0) {
          /* Each plant has a baked-in random scatter direction and spread.
             √p easing: characters shoot out fast, then coast — clearly visible
             even when the alpha has faded to nearly nothing. */
          var shoot  = Math.sqrt(poof);
          var jitter = Math.sin(colIdx * 1.3 + rowIdx * 2.1 + plant.phase) * plant.poofSpread;
          var angle  = plant.poofAngle + jitter;
          var dist   = shoot * (70 + Math.abs(Math.sin(colIdx * 2.2 + rowIdx * 0.9)) * 80);
          x += Math.cos(angle) * dist;
          y += Math.sin(angle) * dist - shoot * rowIdx * 6; /* higher rows lift first */
        } else if (stageIdx >= 2 && !prefersReduced) {
          /* Wind sway — only young/full plants, stronger at top.
             Seeds and sprouts stay still. */
          x += windX(t, plant, rowIdx, totalRows);
        }

        ctx.fillText(ch, x, y);
      }
    }

    ctx.globalAlpha = 1;
  }

  function drawPlant(t, plant) {
    var s = getState(t - plant.delay, plant.speed);
    if (!s) return;

    var ev = s.ev;
    var p  = s.p;

    if (ev.type === 'show') {
      drawStage(ev.stage, 1, t, plant);
    } else if (ev.type === 'poof') {
      drawStage(ev.stage, 1 - p, t, plant, p);
    }
    /* pause: draw nothing */
  }

  function rnd(lo, hi) { return lo + Math.random() * (hi - lo); }
  function pick() { return Math.floor(Math.random() * SPECIES.length); }

  /* Generate a uniform grid of plants filling the full canvas.
     10 cols × 7 rows = 70 plants; small jitter keeps it organic. */
  var GRID_COLS = 10;
  var GRID_ROWS = 7;
  var JITTER_X  = 0.032;
  var JITTER_Y  = 0.032;

  var PLANTS = (function () {
    var list = [];
    for (var r = 0; r < GRID_ROWS; r++) {
      for (var c = 0; c < GRID_COLS; c++) {
        var bx = (c + 0.5) / GRID_COLS;
        var by = 0.10 + (r / (GRID_ROWS - 1)) * 0.88;
        /* Stagger delays diagonally so emergence ripples across the field */
        var diagDelay = (c + r * 1.4) / (GRID_COLS + GRID_ROWS * 1.4) * 5.5;
        list.push({
          x:          bx + rnd(-JITTER_X, JITTER_X),
          y:          by + rnd(-JITTER_Y, JITTER_Y),
          phase:      rnd(0, 6.28),
          delay:      diagDelay + rnd(-0.4, 0.4),
          speed:      rnd(0.45, 0.78),
          species:    pick(),
          /* Per-plant poof — random scatter angle and fan width */
          poofAngle:  rnd(-Math.PI * 0.8, -Math.PI * 0.1), /* mostly upward/sideways */
          poofSpread: rnd(0.4, 1.1)
        });
      }
    }
    return list;
  }());

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font         = FONT_SIZE + 'px monospace';
    ctx.fillStyle    = GREEN;
    ctx.textBaseline = 'top';
    PLANTS.forEach(function (plant) { drawPlant(t, plant); });
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  var startTime = null;

  function animate(ts) {
    if (startTime === null) startTime = ts;
    draw((ts - startTime) / 1000);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', function () {
    resize();
    if (prefersReduced) draw(0);
  });

  if (prefersReduced) {
    draw(0);
  } else {
    requestAnimationFrame(animate);
  }

}());
