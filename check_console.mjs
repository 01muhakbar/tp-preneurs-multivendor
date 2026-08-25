import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to live site...');
  await page.goto('https://palegoldenrod-goose-858947.hostingersite.com/', { waitUntil: 'networkidle' });
  
  console.log('Wait a few seconds for potential async errors...');
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
