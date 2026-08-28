/* splash.js — opens the event popup on load and closes it,
   with a quick fade, on any click. */

(function () {
  'use strict';

  var splash = document.querySelector('.splash');
  if (!splash) return;

  if (typeof splash.showModal === 'function') {
    splash.showModal();
    splash.focus();
  } else {
    splash.setAttribute('open', '');
  }

  var closed = false;

  function finishClose() {
    if (closed) return;
    closed = true;
    if (typeof splash.close === 'function') {
      splash.close();
    } else {
      splash.removeAttribute('open');
    }
  }

  function closeSplash() {
    if (splash.classList.contains('is-closing')) return;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      finishClose();
      return;
    }
    splash.classList.add('is-closing');
  }

  splash.addEventListener('click', closeSplash);

  splash.addEventListener('transitionend', function (e) {
    if (e.target === splash && e.propertyName === 'opacity') {
      finishClose();
    }
  });

}());
