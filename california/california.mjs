import { createRow, initBrowser } from '../utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto('https://oag.ca.gov/privacy/databreach/list', {
    waitUntil: 'networkidle0',
  })

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
      DATA.push(
        createRow('CA')({
          businessName,
          breachDates,
          reportedDate,
        })
      )
    }
  } catch (e) {
    console.error(e)
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}
