(function initStaticPageUi() {
    function readStoredTheme() {
        try {
            var storedTheme = localStorage.getItem('hui-theme');
            if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
        } catch (_error) {
            // Ignore localStorage access issues.
        }
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    }

    function persistTheme(theme) {
        try {
            localStorage.setItem('hui-theme', theme);
        } catch (_error) {
            // Ignore storage write errors.
        }
    }

    function applyTheme(theme) {
        var normalizedTheme = theme === 'dark' ? 'dark' : 'light';
        var root = document.documentElement;
        root.classList.remove('dark', 'light');
        root.classList.add(normalizedTheme);
        root.setAttribute('data-theme', normalizedTheme);
        root.style.colorScheme = normalizedTheme;

        var themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) themeMeta.setAttribute('content', normalizedTheme === 'dark' ? '#0f172a' : '#0066cc');

        var toggle = document.getElementById('theme-toggle');
        if (toggle) {
            var isDark = normalizedTheme === 'dark';
            toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
            toggle.setAttribute('aria-label', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
        }
    }

    function bindThemeToggle() {
        var toggle = document.getElementById('theme-toggle');
        if (!toggle || toggle.dataset.boundToggle === '1') return;
        toggle.dataset.boundToggle = '1';
        toggle.addEventListener('click', function () {
            var nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(nextTheme);
            persistTheme(nextTheme);
        });
    }

    function hydrateYear() {
        var yearNode = document.getElementById('footer-year');
        if (!yearNode) return;
        yearNode.textContent = String(new Date().getFullYear());
    }

    function applyPageTitle() {
        var titleNode = document.getElementById('department-page-title');
        var metaTitle = document.title;
        if (titleNode && !titleNode.textContent.trim()) titleNode.textContent = metaTitle;
    }

    applyTheme(readStoredTheme());
    bindThemeToggle();
    hydrateYear();
    applyPageTitle();
})();
