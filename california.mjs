import puppeteer from 'puppeteer'

;(async () => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto('https://oag.ca.gov/privacy/databreach/list', {
    waitUntil: 'networkidle0',
  })
  await page.setViewport({ width: 1280, height: 1024 })

  try {
    const table = await page.waitForSelector('#block-system-main .views-table')
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          '#block-system-main .views-table > tbody > tr'
        ).length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      const [bizName, dates, reported] = await row.$$('td')
      let businessName = await page.evaluate((el) => el.textContent, bizName)
      businessName = businessName.trim()
      let breachDates = await page.evaluate((el) => el.textContent, dates)
      breachDates = breachDates.trim().split(', ')
      let reportedDate = await page.evaluate((el) => el.textContent, reported)
      reportedDate = reportedDate.trim()
      console.log({
        businessName,
        breachDates,
        reportedDate,
      })
    }
  } catch (e) {
    console.error(e)
  }

  await browser.close()
})()
