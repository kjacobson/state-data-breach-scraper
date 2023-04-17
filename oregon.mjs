import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://justice.oregon.gov/consumer/DataBreach/', { waitUntil: 'networkidle0' });
  await page.setViewport({width: 1280, height: 1024});
  const pageSizeSelect = await page.waitForSelector('[name="grid_length"]');
  await pageSizeSelect.select("100");
  let err;
  while(!err) {
      // for most of the states, we start from the last page
      // it's not necessary, but this routine is for parity
      try {
          const currentPage = await page.waitForSelector("#grid_paginate .paginate_button.current");
          const currentPageText = await page.evaluate(el => el.textContent.trim(), currentPage);
          const nextPage = await page.evaluateHandle(el => el.nextElementSibling, currentPage);
          const nav = page.waitForFunction((currentPageText) => {
              const newCurrentPage = document.querySelector("#grid_paginate .paginate_button.current");
              const newCurrentPageText = newCurrentPage.textContent.trim();
              return newCurrentPageText !== currentPageText;
          }, {}, currentPageText);
          await page.evaluate((el) => el.click(), nextPage);
          await nav;
      }
      catch(e) {
        err = e;
      }
  }
  await page.waitForSelector('#grid_paginate .paginate_button.current:last-child');

  let done = false;
  while (!done) {
      const currentPage = await page.waitForSelector("#grid_paginate .paginate_button.current");
      const currentPageText = await page.evaluate(el => el.textContent.trim(), currentPage);
      const table = await page.waitForSelector('table#grid');
      await page.waitForFunction(() => (
          document.querySelectorAll('#grid > tbody > tr').length > 0
      ));
      const rows = await table.$$('tbody > tr');
      for (const row of rows) {
        try {
            const [bizName, dates, reported] = await row.$$("td");
            let businessName = await page.evaluate((el) => el.textContent, bizName);
            businessName = businessName.trim();
            let reportedDate = await page.evaluate((el) => el.textContent, reported);
            reportedDate = reportedDate.trim();
            let dateString = await page.evaluate((el) => el.textContent, dates);
            let breachDates;
            let startDate;
            let endDate;
            if (dateString.trim().indexOf(",") > -1) {
                breachDates = dateString.split(",").map((date) => date.trim()); 
                breachDates = breachDates.map(str => str.split("-").map(date => date.trim()).join(" - "));
            } else
            if (dateString.trim().indexOf("-") > -1) {
                [startDate, endDate] = dateString.split("-").map((date) => date.trim());
            } else {
                startDate = dateString.trim();
            }
            console.log({
              businessName,
              breachDates,
              startDate,
              endDate,
              reportedDate,
            });
        }
        catch(e) { console.error(e); }
      }
      if (currentPageText !== "1") {
          const prevPageLink = await page.evaluateHandle(el => el.previousElementSibling, currentPage);
          await prevPageLink.click()
      } else {
          done = true;
      }
  }

  await browser.close();
})();
