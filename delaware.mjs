import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://attorneygeneral.delaware.gov/fraud/cpu/securitybreachnotification/database/', { waitUnti: 'networkidle0' });
  await page.setViewport({width: 1280, height: 1024});

  try {
      const table = await page.waitForSelector('#example');
      await page.waitForFunction(() => (
          document.querySelectorAll('#example > thead > tr').length > 0
      ));
      const rows = await table.$$('thead > tr');
      for (const row of rows.slice(1)) {
            const [bizName, dates, reported, affected] = await row.$$("td");
            let businessName = await page.evaluate((el) => el.textContent, bizName);
            businessName = businessName.trim();
            let dateString = await page.evaluate((el) => el.textContent, dates);
            let breachDates;
            let startDate;
            let endDate;
            if (dateString.trim().indexOf("and") > -1) {
               breachDates = dateString.split("and").map((date) => date.trim()); 
            } else
            if (dateString.trim().indexOf("–")) {
               [startDate, endDate] = dateString.split("–").map((date) => date.trim());
            } else {
                startDate = dateString.trim();
            }
            let reportedDate = await page.evaluate((el) => el.textContent, reported);
            reportedDate = reportedDate.trim();
            let numberAffected = await page.evaluate((el) => el.textContent, affected);
            numberAffected = parseInt(numberAffected.trim(), 10);
            console.log({
              businessName,
              startDate,
              endDate,
              breachDates,
              reportedDate,
              numberAffected,
            });
      }
  }
  catch(e) { console.error(e); }

  await browser.close();
})();

