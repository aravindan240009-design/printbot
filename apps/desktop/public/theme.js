// Clean Enterprise Light Theme (strictly light mode across all workstation interfaces)
(function () {
  var root = document.documentElement;
  root.dataset.theme = 'light';
  root.style.colorScheme = 'light';
  root.classList.remove('dark');
  try {
    localStorage.setItem('printbot-theme-v1', 'light');
    localStorage.setItem('printbot_theme', 'light');
  } catch (_) {}
})();
