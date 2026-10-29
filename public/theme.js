// Apply appearance before paint. Persist only appearance, never shop/document data.
(function () {
 var preference;
 try { var requested=new URLSearchParams(location.search).get('theme');var stored=localStorage.getItem('printbot-theme-v1');preference=requested==='light'||requested==='dark'?requested:stored==='light'||stored==='dark'?stored:null; } catch (_) {}
 if(!preference)preference='light';
 var root=document.documentElement;root.dataset.theme=preference;root.style.colorScheme=preference;root.classList.toggle('dark',preference==='dark');
})();
