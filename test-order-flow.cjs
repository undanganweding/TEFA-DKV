const { chromium } = require('playwright');

(async () => {
  console.log('--- STARTING PLAYWRIGHT LIVE TEST (WITH MODAL CLOSE) ---');
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
  await page.locator('button:has-text(\"Masuk Dashboard\")').click();
  await page.waitForTimeout(4000);

  console.log('4. Navigating to \"Buat Pesanan\" tab...');
  await page.locator('button:has-text(\"Buat Pesanan\")').first().click();
  await page.waitForTimeout(1500);

  console.log('5. Submitting order form via button \"Submit Pesanan Ke Admin TEFA\"...');
  const submitOrderBtn = page.locator('button:has-text(\"Submit Pesanan Ke Admin TEFA\")').first();
  await submitOrderBtn.click();
  await page.waitForTimeout(3000);

  // Close the Success Modal if present
  console.log('6. Checking and closing success popup modal...');
  const closeSuccessBtn = page.locator('button:has-text(\"Lihat Pesanan Saya\"), button:has-text(\"Tutup\"), button:has-text(\"OK\")').first();
  if (await closeSuccessBtn.isVisible()) {
    await closeSuccessBtn.click();
    await page.waitForTimeout(1500);
  }

  console.log('7. Navigating to \"Pesanan Saya\" tab...');
  await page.locator('button:has-text(\"Pesanan Saya\")').first().click();
  await page.waitForTimeout(2000);

  const badgeText = await page.locator('text=/\\d+\\s+Order/').first().textContent().catch(() => 'none');
  console.log('Order badge count after submission:', badgeText);
  const cardCount = await page.locator('text=POS-2026').count();
  console.log('Order cards count on page:', cardCount);

  console.log('8. TESTING RELOAD (F5)...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Click Pesanan Saya tab after reload
  await page.locator('button:has-text(\"Pesanan Saya\")').first().click();
  await page.waitForTimeout(2000);

  const badgeTextAfter = await page.locator('text=/\\d+\\s+Order/').first().textContent().catch(() => 'none');
  console.log('=== HASIL SETELAH RELOAD (F5) ===');
  console.log('Order badge count AFTER RELOAD (F5):', badgeTextAfter);
  const cardCountAfter = await page.locator('text=POS-2026').count();
  console.log('Order cards count AFTER RELOAD (F5):', cardCountAfter);

  await page.screenshot({ path: 'test_student_reload_success.png' });
  console.log('Screenshot saved to test_student_reload_success.png');

  await browser.close();
  console.log('--- TEST FINISHED SUCCESSFULLY ---');
})();
