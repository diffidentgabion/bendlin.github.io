/* shelf.js — converts vertical mouse wheel to horizontal shelf scroll
   (touch scrolling is handled natively by overflow-x: scroll), flips the
   dummy cards, switches main.html between shelves and journal view, lays
   out the journal masonry, and runs the journal lightbox. */

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

  /* --- Journal ---------------------------------------------------------
     Two exclusive modes on main.html, driven by the URL hash so the back
     button works: shelves (default) and journal (#journal). The section not
     in use is hidden, so neither mode can be scrolled into the other. */
  var shelves = document.querySelector('.shelves');
  var journal = document.querySelector('.journal');
  var grid = journal && journal.querySelector('.journal__grid');

  if (shelves && journal && grid) {
    var photos = Array.prototype.slice.call(grid.querySelectorAll('.journal__photo'));
    var strip = shelves.querySelector('.shelf__strip');
    var home = journal.querySelector('.journal__home');
    var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    var dealt = 0;
    var mode = null;

    /* Masonry: deal photos (newest first) into --journal-columns equal
       columns, each into the currently shortest one. Height is tracked as
       height/width from the img attributes — no need to wait for loading.
       Re-deals only when the column count changes (e.g. phone ↔ desktop). */
    function deal() {
      var count = parseInt(getComputedStyle(journal).getPropertyValue('--journal-columns'), 10) || 4;
      if (count === dealt) return;
      dealt = count;
      var cols = [];
      var heights = [];
      for (var i = 0; i < count; i++) {
        cols.push(document.createElement('div'));
        cols[i].className = 'journal__col';
        heights.push(0);
      }
      photos.forEach(function (img) {
        var shortest = heights.indexOf(Math.min.apply(null, heights));
        cols[shortest].appendChild(img);
        heights[shortest] += img.getAttribute('height') / img.getAttribute('width') + 0.05; // + approx. gap
      });
      grid.replaceChildren.apply(grid, cols);
      grid.classList.add('is-masonry');
    }

    /* Scroll to top — smoothly if animate (and motion isn't reduced),
       otherwise instantly — then call done */
    function glide(top, animate, done) {
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        removeEventListener('scrollend', finish);
        done();
      }
      if (!animate || reduceMotion.matches || Math.abs(scrollY - top) < 2) {
        scrollTo({ top: top, behavior: 'instant' });
        finish();
        return;
      }
      addEventListener('scrollend', finish);
      setTimeout(finish, 1200); // fallback where scrollend isn't supported
      scrollTo({ top: top, behavior: 'smooth' });
    }

    /* Reveal the journal below the shelves, glide down to it, then drop the
       shelves so the journal is the whole page */
    function showJournal(animate) {
      mode = 'journal';
      journal.hidden = false;
      glide(journal.offsetTop, animate, function () {
        if (mode !== 'journal') return;
        shelves.hidden = true;
        scrollTo({ top: 0, behavior: 'instant' });
        if (animate) home.focus({ preventScroll: true });
      });
    }

    /* Put the shelves back above the journal's top, glide up, then drop
       the journal */
    function showShelves(animate) {
      mode = 'shelves';
      shelves.hidden = false;
      scrollTo({ top: journal.offsetTop, behavior: 'instant' });
      glide(0, animate, function () {
        if (mode !== 'shelves') return;
        journal.hidden = true;
        if (animate) strip.focus({ preventScroll: true });
      });
    }

    function sync() {
      var wanted = location.hash === '#journal' ? 'journal' : 'shelves';
      if (wanted === mode) return;
      var animate = mode !== null; // no glide on first load
      if (wanted === 'journal') showJournal(animate);
      else showShelves(animate);
    }

    deal();
    sync();
    addEventListener('resize', deal);
    addEventListener('hashchange', sync);
  }

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.journal__photo').forEach(function (img) {
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
