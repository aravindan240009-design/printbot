// Runs before paint. Only appearance is persisted; never document or tenant data.
(function () {
  var preference = 'system';
  try { preference = localStorage.getItem('printbot-theme-v1') || 'system'; } catch (_) {}
  var dark = preference === 'dark' || (preference !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  var root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.classList.toggle('dark', dark);
})();
