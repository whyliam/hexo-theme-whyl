/* Progressive enhancement: album links, navigation and images work without JS. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-navigation');
  if (toggle && nav) {
    toggle.hidden = false;
    function closeMenu() { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
    });
  }
  document.querySelectorAll('.post-content img').forEach(function (img) {
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = img.src.replace(/^http:\/\/pics\.naaln\.com\//i, 'https://pics.naaln.com/');
    if (!img.closest('a')) {
      const link = document.createElement('a');
      link.href = img.src;
      link.className = 'photo-link image-surface';
      link.setAttribute('data-lightbox', '');
      link.setAttribute('aria-label', '放大照片：' + (img.alt || '照片'));
      img.replaceWith(link);
      link.append(img);
    }
  });
  document.querySelectorAll('.image-surface img').forEach(function (img) {
    function failed() { img.parentElement.classList.add('image-error'); }
    img.addEventListener('error', failed);
    img.addEventListener('load', function () { img.parentElement.classList.remove('image-error'); });
    if (img.complete && !img.naturalWidth) failed();
  });
  const links = Array.from(document.querySelectorAll('[data-lightbox]'));
  if (!links.length || typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', '照片查看器');
  dialog.innerHTML = '<div class="lightbox-toolbar"><span class="lightbox-counter" aria-live="polite"></span><button type="button" class="lightbox-close" aria-label="关闭照片">×</button></div>' +
    '<div class="lightbox-stage"><button type="button" class="lightbox-prev" aria-label="上一张照片">‹</button><img class="lightbox-image" alt=""><p class="lightbox-status" role="status" hidden></p><button type="button" class="lightbox-next" aria-label="下一张照片">›</button></div><p class="lightbox-caption"></p>';
  document.body.append(dialog);
  const image = dialog.querySelector('.lightbox-image');
  const status = dialog.querySelector('.lightbox-status');
  const previous = dialog.querySelector('.lightbox-prev');
  const next = dialog.querySelector('.lightbox-next');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let closing = false;
  let current = 0, trigger = null, previousOverflow = '', touch = null;
  function closeViewer() {
    if (closing) return;
    closing = true;
    dialog.classList.add('is-closing');
    setTimeout(function () { dialog.close(); dialog.classList.remove('is-closing'); closing = false; }, reducedMotion.matches ? 0 : 180);
  }
  function show(index) {
    current = (index + links.length) % links.length;
    const source = links[current].querySelector('img');
    image.hidden = true;
    status.hidden = false;
    status.textContent = '正在加载照片…';
    image.alt = source ? source.alt : '';
    image.src = links[current].href;
    dialog.querySelector('.lightbox-caption').textContent = image.alt;
    dialog.querySelector('.lightbox-counter').textContent = (current + 1) + ' / ' + links.length;
    previous.hidden = next.hidden = links.length < 2;
  }
  image.addEventListener('load', function () { image.hidden = false; status.hidden = true;
    if (!reducedMotion.matches) { image.getAnimations().forEach(animation => animation.cancel()); image.animate([{opacity:0,transform:'translateY(8px) scale(.985)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.23,1,.32,1)'}); } });
  image.addEventListener('error', function () { image.hidden = true; status.hidden = false; status.textContent = '照片加载失败，请关闭后重试。'; });
  links.forEach(function (link, index) {
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
      event.preventDefault();
      trigger = link;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      show(index);
      dialog.showModal();
      dialog.querySelector('.lightbox-close').focus({preventScroll: true});
    });
  });
  dialog.querySelector('.lightbox-close').addEventListener('click', closeViewer);
  previous.addEventListener('click', function () { show(current - 1); });
  next.addEventListener('click', function () { show(current + 1); });
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); closeViewer(); });
  dialog.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) closeViewer(); });
  dialog.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    image.removeAttribute('src');
    if (trigger) trigger.focus({preventScroll: true});
  });
  const stage = dialog.querySelector('.lightbox-stage');
  stage.addEventListener('touchstart', function (event) {
    touch = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
  }, {passive:true});
  stage.addEventListener('touchmove', function (event) { if (event.touches.length > 1) touch = null; }, {passive:true});
  stage.addEventListener('touchcancel', function () { touch = null; });
  stage.addEventListener('touchend', function (event) {
    if (!touch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
}());
