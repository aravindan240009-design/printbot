// Enforce clean light theme for Customer Web Portal
(function () {
  var root = document.documentElement;
  root.dataset.theme = 'light';
  root.style.colorScheme = 'light';
  root.classList.remove('dark');
  try {
    localStorage.setItem('printbot-theme-v1', 'light');
    localStorage.setItem('pb_theme', 'light');
  } catch (_) {}
})();
