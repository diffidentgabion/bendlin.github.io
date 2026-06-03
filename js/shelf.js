/* shelf.js — converts vertical mouse wheel to horizontal shelf scroll.
   Touch scrolling is handled natively by overflow-x: scroll. */

(function () {
  'use strict';

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

  document.querySelectorAll('button.card--dummy').forEach(function (card) {
    card.addEventListener('click', function () {
      card.classList.toggle('is-flipped');
    });
  });

  function positionShelfHome() {
    var home = document.querySelector('.shelf__home');
    if (!home) return;
    var h = home.parentElement.offsetHeight;
    if (h > 0) home.style.top = (h / 2) + 'px';
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(positionShelfHome);
  } else {
    window.addEventListener('load', positionShelfHome);
  }
  window.addEventListener('resize', positionShelfHome);

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.shelf__photo').forEach(function (img) {
      img.addEventListener('click', function () {
        lightboxImg.src = img.src;
        if (typeof lightbox.showModal === 'function') {
          lightbox.showModal();
        } else {
          lightbox.setAttribute('open', '');
        }
        document.body.classList.add('lightbox-open');
      });
    });

    lightbox.addEventListener('click', function () {
      if (typeof lightbox.close === 'function') {
        lightbox.close();
      } else {
        lightbox.removeAttribute('open');
      }
      document.body.classList.remove('lightbox-open');
    });

    lightbox.addEventListener('close', function () {
      document.body.classList.remove('lightbox-open');
    });
  }

}());
