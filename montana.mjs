import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://dojmt.gov/consumer/databreach/');
  await page.setViewport({width: 1080, height: 1024});
  const lastPage = await page.waitForSelector('.footable-page-nav[aria-label="last page"]');
  await lastPage.click();
  await page.waitForSelector('.footable-page-nav.disabled[aria-label="last page"]');

  let done = false;
  while (!done) {
      const selectedPageLI = await page.waitForSelector('.footable-pagination-wrapper > .pagination > .footable-page.visible.active');
      const selectedPageNumber = await page.evaluate((el) => el.getAttribute('data-page'), selectedPageLI);
      console.log("Gathering data from page " + selectedPageNumber + "...");
      const table = await page.waitForSelector('.foo-table');
      await page.waitForFunction(() => (
        document.querySelectorAll('.foo-table > tbody > tr').length > 0
      ));
      const rows = await table.$$('tbody > tr');
      for (const row of rows) {
        try {
            const [bizName, letter, start, end, reported, affected] = await row.$$("td");
            const businessName = await page.evaluate((el) => el.textContent, bizName);
            const letterURL = await letter.$eval('a[href]', (el) => el.getAttribute('href'));
            const startDate = await page.evaluate((el) => el.textContent, start);
            const endDate = await page.evaluate((el) => el.textContent, end);
            const reportedDate = await page.evaluate((el) => el.textContent, reported);
            let numberAffected = await page.evaluate((el) => el.textContent, affected);
            numberAffected = parseInt(numberAffected.trim(), 10);
            console.log({
              businessName,
              letterURL,
              startDate,
              endDate,
              reportedDate,
              numberAffected,
            });
        }
        catch(e) { console.error(e); }
      }
      if (selectedPageNumber !== "1") {
          const prevPageLink = await page.waitForSelector('.footable-pagination-wrapper > .pagination > .footable-page-nav[aria-label="previous"] > a[href]');
          await prevPageLink.click()
      } else {
          done = true;
      }
  }

  await browser.close();
})();
