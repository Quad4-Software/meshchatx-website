(function () {
    try {
        var stored = localStorage.getItem('theme');
        var preference = stored || 'system';
        var dark =
            preference === 'dark' ||
            (preference !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', dark);
        document.documentElement.classList.toggle('light', !dark);
        document.documentElement.dataset.theme = preference;
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    } catch (e) {}
})();
