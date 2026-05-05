/**
 * SPA Router — Hash-based routing for AI Agent
 */
const Router = (() => {
  // ── Route definitions ──────────────────────────────────────────────────
  const ROUTES = [
    { path: 'home', template: 'templates/home.html', scripts: ['js/pages/home.js'], css: [], auth: true, title: 'Trang chủ' },
    { path: 'chat', template: 'templates/chat.html', scripts: ['js/pages/chat.js'], css: [], auth: true, title: 'AI Assistant' },
    { path: 'settings', template: 'templates/settings.html', scripts: ['js/pages/settings.js'], css: ['css/settings.css'], auth: true, title: 'Cài đặt' }
  ];

  // ── State ──────────────────────────────────────────────────────────────
  let _currentRoute = null;
  let _loadedScripts = new Set();    // track loaded page scripts
  let _dynamicStylesheets = [];       // track dynamic CSS <link> elements

  // ── Template cache ─────────────────────────────────────────────────────
  const _templateCache = {};

  async function _fetchTemplate(url) {
    if (_templateCache[url]) return _templateCache[url];
    const res = await fetch(url + '?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Template not found: ' + url);
    const html = await res.text();
    _templateCache[url] = html;
    return html;
  }

  // ── Loading spinner ───────────────────────────────────────────────────
  let _spinnerTimer = null;
  function _showSpinner($content) {
    if (!$content) return;
    const existing = $content.querySelector('.route-spinner');
    if (existing) return;
    const spinner = document.createElement('div');
    spinner.className = 'route-spinner';
    spinner.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';
    spinner.innerHTML = '<div style="color: var(--text-muted);">Đang tải...</div>';
    $content.appendChild(spinner);
  }
  
  function _hideSpinner($content) {
    if (!$content) return;
    const s = $content.querySelector('.route-spinner');
    if (s) s.remove();
  }

  // ── Dynamic CSS ────────────────────────────────────────────────────────
  function _loadCSS(hrefs) {
    _dynamicStylesheets.forEach(el => el.remove());
    _dynamicStylesheets = [];

    hrefs.forEach(href => {
      if (document.querySelector(`link[href^="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href + '?v=' + Date.now();
      link.setAttribute('data-dynamic', 'true');
      document.head.appendChild(link);
      _dynamicStylesheets.push(link);
    });
  }

  // ── Dynamic Script Loading ─────────────────────────────────────────────
  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (_loadedScripts.has(src)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src + '?v=' + Date.now();
      script.charset = 'UTF-8';
      script.onload = () => {
        _loadedScripts.add(src);
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load: ' + src));
      document.body.appendChild(script);
    });
  }

  // ── Auth check ─────────────────────────────────────────────────────────
  function _isLoggedIn() {
    return !!localStorage.getItem('auth_token');
  }

  // ── Route matching ─────────────────────────────────────────────────────
  function _parseHash() {
    const hash = location.hash.replace(/^#\/?/, '') || 'home';
    const [path, queryString] = hash.split('?');
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { path, params };
  }

  function _findRoute(path) {
    return ROUTES.find(r => r.path === path);
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  async function navigate(hash) {
    if (hash.startsWith('#')) {
      location.hash = hash;
    } else {
      location.hash = '#/' + hash;
    }
  }

  // ── 404 page ──────────────────────────────────────────────────────────
  function _render404(path) {
    const $content = document.getElementById('app-content');
    if ($content) {
      $content.innerHTML =
        '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center">' +
        '<h1 style="font-size:2rem;color:white;">404</h1>' +
        '<p style="color:var(--text-muted);margin:16px 0;">Trang không tồn tại</p>' +
        '<a href="#/home" style="color:var(--accent-blue);">Về trang chủ</a>' +
        '</div>';
    }
  }

  // ── Page transition ───────────────────────────────────────────────────
  function _fadeOut($el) {
    return new Promise(resolve => {
      $el.style.opacity = '0';
      $el.style.transition = 'opacity 150ms ease';
      setTimeout(resolve, 150);
    });
  }
  function _fadeIn($el) {
    $el.style.opacity = '1';
    $el.style.transition = 'opacity 200ms ease';
  }

  async function _handleRoute() {
    const { path, params } = _parseHash();
    const route = _findRoute(path);
    const $content = document.getElementById('app-content');

    if (!route) {
      if ($content) await _fadeOut($content);
      _render404(path);
      if ($content) _fadeIn($content);
      return;
    }

    if (route.auth && !_isLoggedIn()) {
      window.location.href = '/login.html';
      return;
    }

    window.scrollTo(0, 0);

    if ($content && _currentRoute) await _fadeOut($content);

    _showSpinner($content);
    document.title = route.title + ' - AI Study Hub';
    document.body.setAttribute('data-page', path);

    _loadCSS(route.css || []);

    try {
      const html = await _fetchTemplate(route.template);
      if ($content) $content.innerHTML = html;
    } catch (e) {
      _hideSpinner($content);
      if ($content) $content.innerHTML = '<p style="color:red;">Lỗi tải trang</p>';
      return;
    }

    window._routeParams = params;

    for (const src of (route.scripts || [])) {
      const oldScript = document.querySelector(`script[src^="${src}"]`);
      if (oldScript) oldScript.remove();
      _loadedScripts.delete(src);
      try {
        await _loadScript(src);
      } catch (e) {
        console.error('Script error:', src, e);
      }
    }

    _currentRoute = route;
    _hideSpinner($content);
    if ($content) _fadeIn($content);
  }

  function init() {
    window.addEventListener('hashchange', () => _handleRoute().catch(console.error));

    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      if (!_isLoggedIn()) {
        window.location.href = '/login.html';
        return;
      }
      location.hash = '#/home';
    }
    _handleRoute().catch(console.error);
  }

  return { init, navigate, ROUTES };
})();

function navigate(hash) {
  Router.navigate(hash);
}
