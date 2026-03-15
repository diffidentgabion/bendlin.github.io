/* shelf.js — smooth horizontal scroll for shelf tracks (wheel + touch drag) */

(function () {
  'use strict';

  document.querySelectorAll('.shelf__track').forEach(function (track) {
    var target = 0;
    var current = 0;
    var rafId = null;

    function maxScroll() {
      return track.scrollWidth - track.clientWidth;
    }

    function clamp(val) {
      return Math.max(0, Math.min(val, maxScroll()));
    }

    function tick() {
      var diff = target - current;
      if (Math.abs(diff) < 0.5) {
        current = target;
        track.scrollLeft = current;
        rafId = null;
        return;
      }
      current += diff * 0.1; /* easing: 10% of remaining distance per frame */
      track.scrollLeft = current;
      rafId = requestAnimationFrame(tick);
    }

    /* --- Mouse wheel: vertical scroll → horizontal movement --------------- */

    track.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        target = clamp(target + e.deltaY);
        if (!rafId) rafId = requestAnimationFrame(tick);
      }
    }, { passive: false });

    /* --- Touch drag -------------------------------------------------------- */

    var touchStartX = 0;
    var touchStartY = 0;
    var touchScrollStart = 0;
    var dragging = false;

    track.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchScrollStart = track.scrollLeft;
      current = track.scrollLeft;
      target = track.scrollLeft;
      dragging = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
      var dx = touchStartX - e.touches[0].clientX;
      var dy = touchStartY - e.touches[0].clientY;

      /* commit to horizontal drag once direction is clear */
      if (!dragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 4) {
        dragging = true;
      }

      if (dragging) {
        e.preventDefault(); /* prevent page scroll during horizontal drag */
        var next = clamp(touchScrollStart + dx);
        current = next;
        target = next;
        track.scrollLeft = next;
      }
    }, { passive: false });

    track.addEventListener('touchend', function () {
      dragging = false;
    }, { passive: true });
  });

}());
