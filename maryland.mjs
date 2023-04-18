import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const handler = async () => {
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
    'https://www.marylandattorneygeneral.gov/Pages/IdentityTheft/breachnotices.aspx',
    { waitUntil: 'networkidle0' }
  )
  await page.setViewport({ width: 1280, height: 1024 })

  try {
    // POPUP
    const dismiss = await page.waitForSelector('.prefix-overlay-action-dismiss')
    await page.evaluate((el) => el.click(), dismiss)
  } catch (e) {}
  await page.waitForSelector('#onetidDoclibViewTbl0')
  let years = await page.$$('#onetidDoclibViewTbl0 > tbody[id^="titl"]')
  for (let i = 0; i < years.length; i++) {
    years = await page.$$('#onetidDoclibViewTbl0 > tbody[id^="titl"]')
    let year = years[i]
    const expandYearLink = await year.waitForSelector('tr:first-child > td > a')
    await page.evaluate((el) => el.click(), expandYearLink)
    let done = false
    while (!done) {
      years = await page.$$('#onetidDoclibViewTbl0 > tbody[id^="titl"]')
      year = years[i]
      const dataTableBody = await page.evaluateHandle(
        (el) => el.nextElementSibling,
        year
      )
      await page.waitForFunction(
        (i) => {
          const yearTBodies = document.querySelectorAll(
            '#onetidDoclibViewTbl0 > tbody[id^="titl"]'
          )
          const yearTBody = yearTBodies[i]
          const dataTBody = yearTBody.nextElementSibling
          const rows = dataTBody.childNodes
          return rows.length > 1
        },
        {},
        i
      )
      const paginationTableBody = await page.evaluateHandle(
        (el) => el.nextElementSibling,
        dataTableBody
      )
      const rows = await dataTableBody.$$('tr')
      for (const row of rows) {
        try {
          const [bizName, _, reported, affected, data, type] = await row.$$(
            "td[role='gridcell']"
          )
          let businessName = await page.evaluate(
            (el) => el.textContent,
            bizName
          )
          businessName = businessName.trim()
          let reportedDate = await page.evaluate(
            (el) => el.textContent,
            reported
          )
          reportedDate = reportedDate.trim()
          let numberAffected = await page.evaluate(
            (el) => el.textContent,
            affected
          )
          numberAffected = parseInt(numberAffected.trim(), 10)
          let dataTypes = await page.evaluate((el) => el.textContent, data)
          dataTypes = dataTypes.trim().split(', ')
          let breachType = (
            await page.evaluate((el) => el.textContent, type)
          ).trim()
          DATA.push({
            businessName,
            reportedDate,
            numberAffected,
            dataTypes,
            breachType,
          })
        } catch (e) {
          console.error(e)
        }
      }
      try {
        const pageRange = await paginationTableBody.waitForSelector(
          '.ms-paging'
        )
        const pageRangeText = await page.evaluate(
          (el) => el.textContent,
          pageRange
        )
        const nextPageLink = await paginationTableBody.waitForSelector(
          '.ms-promlink-button-enabled[title="Next"]'
        )
        const loading = page.waitForFunction(
          (i, pageRangeText) => {
            const yearTBodies = document.querySelectorAll(
              '#onetidDoclibViewTbl0 > tbody[id^="titl"]'
            )
            const yearTBody = yearTBodies[i]
            const dataTBody = yearTBody.nextElementSibling
            const pagingTBody = dataTBody.nextElementSibling
            const newPageRange =
              pagingTBody.getElementsByClassName('ms-paging')[0].textContent
            return newPageRange !== pageRangeText
          },
          {},
          i,
          pageRangeText
        )
        await Promise.all([
          await page.evaluate((el) => el.click(), nextPageLink),
          await loading,
        ])
      } catch (e) {
        done = true
      }
    }
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.NODE_ENV !== 'production') {
  handler()
}
