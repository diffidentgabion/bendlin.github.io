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

        /* B2 — sprout (user rows top→bottom: ` ⎝` / ` ||` / `  |⎠` / `||`) */
        ['||', '  |⎠', ' ||', ' ⎝'],

        /* B3 — young (user rows top→bottom reversed) */
        [
          ' | ||',
          '  |||⎠',
          ' ||||||',
          '||||||||',
          '||⊹|||||⊹',
          '⎝||||||⊹',
          '    ⎠'
        ],

        /* B4 — full (user rows top→bottom reversed) */
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
    }

  ];

  /* Animation timeline — plays in a loop per plant.
     Stages snap on digitally (no crossfades).
     dur values are base durations scaled by plant.speed. */
  var TIMELINE = [
    { type: 'show',  stage: 0, dur: 1.0 },
    { type: 'show',  stage: 1, dur: 1.8 },
    { type: 'show',  stage: 2, dur: 2.4 },
    { type: 'show',  stage: 3, dur: 6.0 },
    { type: 'poof',  stage: 3, dur: 1.5 },
    { type: 'pause',           dur: 2.5 }
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

  function drawStage(stageIdx, alpha, t, plant, poof) {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;

    var sp   = SPECIES[plant.species];
    var rows = sp.stages[stageIdx];
    var sc   = sp.stalkCol[stageIdx];
    var px   = Math.round(plant.x * canvas.width);
    var py   = Math.round(plant.y * canvas.height);
    poof = poof || 0;

    for (var rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      var row   = rows[rowIdx];
      var isTop = rowIdx === rows.length - 1;
      var chars = Array.from(row);
      var baseY = py - rowIdx * CELL_H;

      for (var colIdx = 0; colIdx < chars.length; colIdx++) {
        var ch = chars[colIdx];
        if (ch === ' ') continue;
        var x = px + (colIdx - sc) * CELL_W;
        var y = baseY;

        if (poof > 0) {
          var ease = poof * poof;
          x += ease * 90 + Math.sin(colIdx * 0.7 + rowIdx * 1.1) * ease * 10;
          y -= ease * 20 + Math.cos(colIdx * 0.5 + rowIdx * 0.9) * ease * 6;
        } else if (isTop && !prefersReduced) {
          y += Math.sin(t * 1.4 + colIdx * 0.8 + plant.phase) * 8;
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

  var PLANTS = [
    { x: 0.08,  y: 0.78, phase: rnd(0, 6.28), delay: rnd(0.0, 1.0), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.22,  y: 0.65, phase: rnd(0, 6.28), delay: rnd(0.5, 2.0), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.38,  y: 0.82, phase: rnd(0, 6.28), delay: rnd(0.8, 2.5), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.52,  y: 0.70, phase: rnd(0, 6.28), delay: rnd(0.0, 1.5), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.67,  y: 0.76, phase: rnd(0, 6.28), delay: rnd(1.0, 3.0), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.83,  y: 0.68, phase: rnd(0, 6.28), delay: rnd(0.3, 1.8), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.14,  y: 0.44, phase: rnd(0, 6.28), delay: rnd(1.5, 3.5), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.33,  y: 0.50, phase: rnd(0, 6.28), delay: rnd(0.8, 2.8), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.58,  y: 0.42, phase: rnd(0, 6.28), delay: rnd(2.0, 4.0), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.76,  y: 0.48, phase: rnd(0, 6.28), delay: rnd(1.2, 3.2), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.91,  y: 0.55, phase: rnd(0, 6.28), delay: rnd(2.5, 4.5), speed: rnd(0.7, 1.4), species: pick() },
    { x: 0.46,  y: 0.28, phase: rnd(0, 6.28), delay: rnd(3.0, 5.0), speed: rnd(0.7, 1.4), species: pick() }
  ];

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
