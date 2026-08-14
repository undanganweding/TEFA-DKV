const { chromium } = require('playwright');

(async () => {
  console.log('--- STARTING PLAYWRIGHT LIVE TEST ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));

  console.log('1. Navigating to https://tefadkv.vercel.app/login ...');
  await page.goto('https://tefadkv.vercel.app/login', { waitUntil: 'networkidle' });

  console.log('2. Filling student credentials...');
  const textInputs = await page.locator('input[type="text"]');
  await textInputs.first().fill('ahidnasabilanajah@gmail.com');
  const passwordInputs = await page.locator('input[type="password"]');
  await passwordInputs.first().fill('Password123!');

  console.log('3. Clicking \"Masuk Dashboard\" button...');
  const submitBtn = page.locator('button:has-text(\"Masuk Dashboard\")');
  await submitBtn.click();

  console.log('4. Waiting for student portal load...');
  await page.waitForTimeout(5000);
  console.log('URL after login:', page.url());

  console.log('5. Clicking \"Pesanan Saya\" tab...');
  const pesananSaya = page.locator('text=Pesanan Saya').first();
  await pesananSaya.click();
  await page.waitForTimeout(2000);

  const orderCountElement = await page.locator('text=/\\d+\\s+Order/').first();
  const countBefore = await orderCountElement.textContent().catch(() => 'none');
  console.log('Order badge count before reload:', countBefore);

  console.log('6. Making a new order...');
  const buatPesananBtn = page.locator('text=Buat Pesanan').first();
  await buatPesananBtn.click();
  await page.waitForTimeout(1500);

  // Click on first active product card
  const productCard = page.locator('text=Cetak Banner').first();
  if (await productCard.isVisible()) {
    await productCard.click();
    await page.waitForTimeout(1000);
  }

  // Look for submit order / pesan button
  const orderNowBtn = page.locator('button:has-text(\"Pesan Sekarang\"), button:has-text(\"Buat Pesanan\")').last();
  if (await orderNowBtn.isVisible()) {
    await orderNowBtn.click();
    await page.waitForTimeout(3000);
    console.log('Order submitted!');
  }

  // Go to Pesanan Saya
  await page.locator('text=Pesanan Saya').first().click();
  await page.waitForTimeout(2000);

  const countAfterCreate = await page.locator('text=/\\d+\\s+Order/').first().textContent().catch(() => 'none');
  console.log('Order badge count after create:', countAfterCreate);

  console.log('7. TESTING RELOAD (F5)...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Click Pesanan Saya after reload
  await page.locator('text=Pesanan Saya').first().click();
  await page.waitForTimeout(2000);

  const countAfterReload = await page.locator('text=/\\d+\\s+Order/').first().textContent().catch(() => 'none');
  console.log('Order badge count AFTER RELOAD (F5):', countAfterReload);

  await page.screenshot({ path: 'verification_final_reload.png' });
  console.log('Screenshot saved to verification_final_reload.png');

  await browser.close();
  console.log('--- TEST FINISHED SUCCESSFULLY ---');
})();
