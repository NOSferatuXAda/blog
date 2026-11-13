(function () {
  'use strict';

  var body = document.querySelector('.post-body');
  if (!body || !document.querySelector('.surreal-essay-marker')) return;
  if (body.querySelector('.surreal-toc')) return;

  var headings = Array.prototype.slice.call(body.querySelectorAll('h2')).filter(function (heading) {
    return heading.textContent.trim();
  });
  if (headings.length < 3) return;

  var nav = document.createElement('nav');
  nav.className = 'surreal-toc';
  nav.setAttribute('aria-labelledby', 'surreal-toc-title');

  var kicker = document.createElement('p');
  kicker.className = 'surreal-toc__kicker';
  kicker.id = 'surreal-toc-title';
  kicker.textContent = 'INDEX / 本文目录';
  nav.appendChild(kicker);

  var list = document.createElement('ol');
  list.className = 'surreal-toc__list';

  headings.forEach(function (heading, index) {
    if (!heading.id) heading.id = 'section-' + (index + 1);

    var item = document.createElement('li');
    var link = document.createElement('a');
    link.href = '#' + heading.id;
    link.textContent = heading.textContent.trim();
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '#' + heading.id);
      }
    });

    item.appendChild(link);
    list.appendChild(item);
  });

  nav.appendChild(list);

  var marker = body.querySelector('.surreal-essay-marker');
  if (marker && marker.nextSibling) body.insertBefore(nav, marker.nextSibling);
  else body.insertBefore(nav, body.firstChild);
})();
