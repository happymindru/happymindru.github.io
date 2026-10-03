/* ==========================================================
   Регина Ильясова — сайт-визитка. Vanilla JS, без зависимостей.
   ========================================================== */
(function () {
  'use strict';

  // --- НАСТРОЙКА ---------------------------------------------------------
  // true  → скрыть все блоки и карточки с атрибутом data-draft
  //         (кейсы, отзывы, пустые карточки статистики), пока нет материалов.
  // false → показывать черновые заглушки (для согласования с клиентом).
  var CONFIG = { hideDrafts: true };
  // ------------------------------------------------------------------------

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Год в подвале
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Скрытие черновых блоков
  if (CONFIG.hideDrafts) {
    doc.querySelectorAll('[data-draft]').forEach(function (el) { el.remove(); });
  }

  // Меню: если секции нет на странице — убираем ссылку
  doc.querySelectorAll('.nav a[href^="#"]').forEach(function (a) {
    if (!doc.querySelector(a.getAttribute('href'))) a.remove();
  });

  // --- Шапка: тень при прокрутке -----------------------------------------
  var header = doc.querySelector('.header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // --- Мобильное меню ----------------------------------------------------
  var burger = doc.getElementById('burger');
  var nav = doc.getElementById('nav');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || burger.getAttribute('aria-expanded') !== 'true') return;
    setMenu(false);
    burger.focus();
  });
  doc.addEventListener('click', function (e) {
    if (!header.contains(e.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', function () { setMenu(false); });

  // --- Появление блоков при прокрутке ------------------------------------
  var revealEls = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // --- Подсветка активного пункта меню -----------------------------------
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav a[href^="#"]'));
  if ('IntersectionObserver' in window && navLinks.length) {
    var sectionMap = {};
    navLinks.forEach(function (a) {
      var s = doc.querySelector(a.getAttribute('href'));
      if (s) sectionMap[s.id] = a;
    });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var link = sectionMap[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(sectionMap).forEach(function (id) { navIO.observe(doc.getElementById(id)); });
    // Блоки без пункта меню (бренды, кейсы, отзывы) сбрасывают подсветку
    ['hero', 'brand', 'cases', 'reviews'].forEach(function (id) {
      var el = doc.getElementById(id);
      if (!el) return;
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) navLinks.forEach(function (a) { a.classList.remove('is-active'); });
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(el);
    });
  }

  // --- Работы: обложки, фильтр, видео ------------------------------------
  var cards = Array.prototype.slice.call(doc.querySelectorAll('.work'));

  // Обложка подтягивается только если файл существует
  cards.forEach(function (card) {
    var url = card.getAttribute('data-poster');
    if (!url) return;
    var img = new Image();
    img.onload = function () {
      card.querySelector('.work__media').style.backgroundImage = 'url("' + url + '")';
    };
    img.src = url;
  });

  function pauseAll(except) {
    doc.querySelectorAll('.work video').forEach(function (v) {
      if (v !== except) v.pause();
    });
  }

  function startVideo(card) {
    var media = card.querySelector('.work__media');
    var title = card.querySelector('h3').textContent;
    var video = media.querySelector('video');

    if (!video) {
      video = doc.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('controls', '');
      video.setAttribute('preload', 'metadata');
      video.setAttribute('aria-label', title);
      if (media.style.backgroundImage) video.poster = card.getAttribute('data-poster');
      video.src = card.getAttribute('data-src');
      video.addEventListener('error', function () {
        video.remove();
        media.classList.remove('is-playing');
        if (!media.querySelector('.work__note')) {
          var note = doc.createElement('p');
          note.className = 'work__note';
          note.setAttribute('role', 'status');
          note.textContent = 'Видео скоро появится';
          media.appendChild(note);
          setTimeout(function () { note.remove(); }, 3500);
        }
      }, true);
      media.appendChild(video);
    }

    pauseAll(video);
    media.classList.add('is-playing');
    // Кнопка play скрывается — переводим фокус на плеер, чтобы клавиатура не теряла место
    video.focus({ preventScroll: true });
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* пользователь нажмёт play в контролах */ });
  }

  doc.getElementById('worksGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('.work__play');
    if (btn) startVideo(btn.closest('.work'));
  });

  // Фильтр по формату
  var chips = Array.prototype.slice.call(doc.querySelectorAll('.chip'));
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      pauseAll(null);
      cards.forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split(' ');
        var show = f === 'all' || tags.indexOf(f) !== -1;
        card.hidden = !show;
        if (show) card.classList.add('is-in');
      });
    });
  });
})();
