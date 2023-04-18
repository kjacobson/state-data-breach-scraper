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

  await page.goto(
    'https://attorneygeneral.delaware.gov/fraud/cpu/securitybreachnotification/database/',
    { waitUntil: 'networkidle0' }
  )
  await page.setViewport({ width: 1280, height: 1024 })

  try {
    const table = await page.waitForSelector('#example')
    await page.waitForFunction(
      () => document.querySelectorAll('#example > thead > tr').length > 0
    )
    const rows = await table.$$('thead > tr')
    for (const row of rows.slice(1)) {
      const [bizName, dates, reported, affected] = await row.$$('td')
      let businessName = await page.evaluate((el) => el.textContent, bizName)
      businessName = businessName.trim()
      let dateString = await page.evaluate((el) => el.textContent, dates)
      let breachDates
      let startDate
      let endDate
      if (dateString.trim().indexOf('and') > -1) {
        breachDates = dateString.split('and').map((date) => date.trim())
      } else if (dateString.trim().indexOf('–') > -1) {
        ;[startDate, endDate] = dateString.split('–').map((date) => date.trim())
      } else {
        startDate = dateString.trim()
      }
      let reportedDate = await page.evaluate((el) => el.textContent, reported)
      reportedDate = reportedDate.trim()
      let numberAffected = await page.evaluate((el) => el.textContent, affected)
      numberAffected = parseInt(numberAffected.trim(), 10)
      DATA.push({
        businessName,
        startDate,
        endDate,
        breachDates,
        reportedDate,
        numberAffected,
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
