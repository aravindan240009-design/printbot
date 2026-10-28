// Runs before paint. Only appearance is persisted; never document or tenant data.
(function () {
  var preference = 'light';
  try { preference = localStorage.getItem('printbot-theme-v1') || 'light'; } catch (_) {}
  var dark = preference === 'dark';
  var root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.classList.toggle('dark', dark);
})();
