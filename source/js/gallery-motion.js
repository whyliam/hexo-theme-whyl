/* Keep full-document navigation, history and native links; progressively animate. */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nativeTransitions = 'onpageswap' in window;
  window.addEventListener('pageshow', function () { document.documentElement.classList.remove('page-leaving'); });
  if (nativeTransitions) return;
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduced.matches || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const target = new URL(link.href, location.href);
    if (target.origin !== location.origin || target.pathname === location.pathname && target.search === location.search || link.hasAttribute('data-lightbox')) return;
    event.preventDefault();
    document.documentElement.classList.add('page-leaving');
    setTimeout(function () { location.assign(target.href); }, 140);
  });
}());
