import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const handler = async () => {
  const DATA = []
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath:
      process.env.NODE_ENV !== 'production'
        ? './chrome/mac_arm-1131672/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
        : await chromium.executablePath,
    headless: process.env.NODE_ENV === 'production',
  })
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
      DATA.push({
        businessName,
        breachDates,
        reportedDate,
      })
    }
  } catch (e) {
    console.error(e)
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.NODE_ENV !== 'production') {
  handler()
}
