(function () {
    var lang = 'ru';
    try { lang = localStorage.getItem('liw-lang') || 'ru'; } catch (e) {}
    function set(l) {
      document.documentElement.lang = l === 'kk' ? 'kk' : 'ru';
      document.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === document.documentElement.lang)); });
      try { localStorage.setItem('liw-lang', document.documentElement.lang); } catch (e) {}
    }
    document.querySelectorAll('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { set(b.dataset.lang); }); });
    set(lang);
  })();
