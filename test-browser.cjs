const { chromium } = require('playwright');

(async () => {
  console.log('--- STARTING BROWSER VERIFICATION ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
  page.on('pageerror', err => console.log('[BROWSER ERROR]', err.message));

  console.log('1. Navigating to https://tefadkv.vercel.app/login ...');
  await page.goto('https://tefadkv.vercel.app/login', { waitUntil: 'networkidle' });

  console.log('2. Entering student credentials...');
  await page.locator('input[type="email"], input[placeholder*="Email"]').first().fill('ahidnasabilanajah@gmail.com');
  await page.locator('input[type="password"], input[placeholder*="sandi"]').first().fill('Password123!');

  console.log('3. Clicking login button...');
  await page.locator('button[type="submit"]').first().click();

  await page.waitForTimeout(4000);
  console.log('4. URL after login:', page.url());

  console.log('5. Clicking Pesanan Saya menu...');
  const pesananSaya = page.locator('text=Pesanan Saya').first();
  await pesananSaya.click();
  await page.waitForTimeout(2000);

  const orderCountText = await page.locator('text=/\\d+\\s+Order/').first().textContent().catch(() => 'not found');
  console.log('6. Order count text before reload:', orderCountText);

  console.log('7. Testing Page Reload (F5)...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  const pesananSayaAfter = page.locator('text=Pesanan Saya').first();
  await pesananSayaAfter.click();
  await page.waitForTimeout(2000);

  const orderCountTextAfter = await page.locator('text=/\\d+\\s+Order/').first().textContent().catch(() => 'not found');
  console.log('8. Order count text AFTER reload (F5):', orderCountTextAfter);

  await page.screenshot({ path: 'test_student_reload_result.png' });
  console.log('9. Screenshot saved to test_student_reload_result.png');

  await browser.close();
  console.log('--- TEST FINISHED ---');
})();
