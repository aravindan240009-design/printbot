// Framework-independent Playwright browser checks. Pass an existing Playwright Page.
// No runtime dependency or proprietary service is added to the website.
export async function verifyLuxuryLanding(page, baseURL = 'http://localhost:4173') {
  const results = [];
  const check = (name, passed) => { results.push({ name, passed: Boolean(passed) }); if (!passed) throw new Error(name); };
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL);
  await page.locator('canvas').waitFor();
  let initial = await page.locator('.webgl-scene').getAttribute('data-feed');
  await page.waitForFunction(value => document.querySelector('.webgl-scene')?.getAttribute('data-feed') !== value, initial);
  check('Automatic paper feed advances', true);
  initial = await page.locator('.webgl-scene').getAttribute('data-rotation');
  await page.waitForFunction(value => document.querySelector('.webgl-scene')?.getAttribute('data-rotation') !== value, initial);
  check('Automatic turntable advances', true);
  await page.getByRole('button', { name: 'Pause site animations' }).click();
  await page.waitForFunction(() => document.querySelector('.webgl-scene')?.getAttribute('data-running') === 'false');
  const pausedFeed = await page.locator('.webgl-scene').getAttribute('data-feed');
  await page.getByRole('button', { name: 'Let’s talk print' }).click();
  await page.keyboard.press('Tab');
  check('Availability dialog traps focus', await page.evaluate(() => document.activeElement.getAttribute('aria-label') === 'Close availability information'));
  await page.keyboard.press('Escape');
  check('Availability dialog restores focus', await page.getByRole('button', { name: 'Let’s talk print' }).evaluate(el => el === document.activeElement));
  check('Pause holds paper feed', pausedFeed === await page.locator('.webgl-scene').getAttribute('data-feed'));
  await page.locator('.editorial-photo').scrollIntoViewIfNeeded();
  await page.locator('.editorial-photo img').evaluate(img => img.decode());
  check('Editorial WebP loads', await page.locator('.editorial-photo img').evaluate(img => img.naturalWidth >= 1000));
  check('Pause keeps editorial heading readable', await page.locator('#editorial-title').evaluate(el => getComputedStyle(el).clipPath === 'none'));
  check('Two SVG prints present', await page.locator('.print-artwork').count() === 2);
  await page.getByRole('button', { name: 'Resume site animations' }).click();
  await page.waitForFunction(() => document.querySelector('.webgl-scene')?.getAttribute('data-running') === 'true');
  await page.locator('.editorial-photo').scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const offscreenFeed = await page.locator('.webgl-scene').getAttribute('data-feed');
  await page.getByRole('tab', { name: 'Configure & preview' }).click();
  check('Customer journey works', await page.getByRole('heading', { name: 'Every detail, their way.' }).isVisible());
  await page.getByRole('tab', { name: 'Configure & preview' }).press('ArrowRight');
  check('Journey supports arrow keys', await page.getByRole('tab', { name: 'Confirm & track' }).getAttribute('aria-selected') === 'true');
  await page.getByRole('button', { name: 'Manual approval', exact: true }).click();
  check('Manual mode illustration works', await page.getByText('Awaiting approval', { exact: true }).count() === 1);
  await page.getByRole('button', { name: 'Annual', exact: true }).click();
  check('Annual billing illustration works', (await page.locator('.billing-copy').textContent()).includes('billed annually'));
  check('Offscreen scene does not advance', offscreenFeed === await page.locator('.webgl-scene').getAttribute('data-feed'));
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    check(`No horizontal overflow at ${width}px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('canvas').waitFor({ state: 'detached' });
  check('Mobile uses lightweight poster', await page.locator('canvas').count() === 0);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  check('Mobile navigation opens', await page.getByRole('navigation').isVisible());
  await page.getByRole('link', { name: 'The experience', exact: true }).click();
  check('Mobile navigation closes', await page.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded') === 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  check('Reduced motion skips WebGL', await page.locator('canvas').count() === 0);
  check('Reduced motion stops SVG rotation', await page.locator('.svg-orbits').evaluate(el => getComputedStyle(el).animationName === 'none'));
  check('Reduced motion keeps headline readable', await page.locator('.hero-line > span').first().evaluate(el => getComputedStyle(el).transform === 'none'));
  return results;
}
