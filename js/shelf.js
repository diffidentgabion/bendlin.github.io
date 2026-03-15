/* shelf.js — converts vertical mouse wheel to horizontal shelf scroll.
   Touch scrolling is handled natively by overflow-x: scroll. */

(function () {
  'use strict';

  // Random vw offsets generated once — stable across resizes
  var randomOffsets = [];
  document.querySelectorAll('.shelf').forEach(function () {
    randomOffsets.push(0.1 + Math.random() * 0.25); // +10vw to +35vw on top of label zone
  });

  function sizeDummies() {
    document.querySelectorAll('.shelf').forEach(function (shelf, i) {
      var label = shelf.querySelector('.shelf__label');
      var dummy = shelf.querySelector('.shelf__track > :first-child');
      if (!label || !dummy) return;
      var labelZone = label.offsetLeft + label.offsetWidth;
      var computed = labelZone + randomOffsets[i] * window.innerWidth;
      var max = window.innerWidth * 0.62;
      dummy.style.minWidth = Math.round(Math.min(computed, max)) + 'px';
    });
  }

  sizeDummies();
  window.addEventListener('resize', sizeDummies);

  document.querySelectorAll('.shelf__track').forEach(function (track) {
    var target = 0;
    var current = 0;
    var rafId = null;

    function tick() {
      var diff = target - current;
      if (Math.abs(diff) < 0.5) {
        current = target;
        track.scrollLeft = current;
        rafId = null;
        return;
      }
      current += diff * 0.1;
      track.scrollLeft = current;
      rafId = requestAnimationFrame(tick);
    }

    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        var max = track.scrollWidth - track.clientWidth;
        target = Math.max(0, Math.min(target + e.deltaY, max));
        if (!rafId) rafId = requestAnimationFrame(tick);
      }
    }, { passive: false });
  });

}());
