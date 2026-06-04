(async () => {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  await page.goto('http://localhost:9002/loja?p=TciTjGRHlRrCXXcLLjhv', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000); // wait for deep link to trigger
  
  try {
    // wait for finalize button in sheet
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const finalizeBtn = btns.find(b => b.textContent.includes('Finalizar Pedido'));
        if (finalizeBtn && !finalizeBtn.disabled) finalizeBtn.click();
    });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Error clicking:', e.toString());
  }
  
  await browser.close();
})();
