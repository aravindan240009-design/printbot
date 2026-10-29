/** Run against the production previews using an existing Playwright Page. */
export async function verifyAtelierSuite(page) {
 const results=[];
 const check=(site,name,passed)=>{results.push({site,name,passed:!!passed});if(!passed)throw new Error(site+': '+name);};
 const sites=[['customer',5174],['shop',5176],['admin',5177],['desktop',5175],['platform',3003]];
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [site,port] of sites){
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:'+port+'/?theme=dark');
  if(site==='desktop'){await page.evaluate(()=>localStorage.removeItem('printbot_session'));await page.reload();}
  await page.getByRole('button',{name:'Dark theme',exact:true}).waitFor();
  check(site,'dark theme applied',await page.evaluate(()=>document.documentElement.dataset.theme==='dark'));
  check(site,'original identity present',await page.locator('.pb-logo').count()>0);
  check(site,'local Manrope typography',await page.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Manrope')));
  await page.getByRole('button',{name:'Light theme',exact:true}).click();
  check(site,'light theme applied',await page.evaluate(()=>document.documentElement.dataset.theme==='light'));
  await page.evaluate(()=>history.replaceState(null,'','/'));
  await page.reload();
  check(site,'theme preference persists',await page.evaluate(()=>document.documentElement.dataset.theme==='light'));
  for(const width of [390,768,1440]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   check(site,'no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  check(site,'no remote Google fonts',await page.evaluate(()=>!performance.getEntriesByType('resource').some(entry=>entry.name.includes('fonts.googleapis')||entry.name.includes('fonts.gstatic'))));
  check(site,'reduced-motion content visible',await page.locator('h1').first().isVisible());
 }
 await page.goto('http://127.0.0.1:4173/?theme=dark');
 check('landing','custom identity present',await page.locator('.pb-logo').count()>0);
 await page.getByRole('button',{name:'Switch to light theme'}).click();
 check('landing','light appearance works',await page.evaluate(()=>document.documentElement.dataset.theme==='light'));
 for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});check('landing','no overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 check('landing','reduced motion skips WebGL',await page.locator('canvas').count()===0);
 return results;
}
