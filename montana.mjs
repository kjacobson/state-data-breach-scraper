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

  await page.goto('https://dojmt.gov/consumer/databreach/')
  await page.setViewport({ width: 1080, height: 1024 })
  const lastPage = await page.waitForSelector(
    '.footable-page-nav[aria-label="last page"] > a[href]'
  )
  await page.evaluate((el) => el.click(), lastPage)
  await page.waitForSelector(
    '.footable-page-nav.disabled[aria-label="last page"]'
  )

  let done = false
  while (!done) {
    const selectedPageLI = await page.waitForSelector(
      '.footable-pagination-wrapper > .pagination > .footable-page.visible.active'
    )
    const selectedPageNumber = await page.evaluate(
      (el) => el.getAttribute('data-page'),
      selectedPageLI
    )
    const table = await page.waitForSelector('.foo-table')
    await page.waitForFunction(
      () => document.querySelectorAll('.foo-table > tbody > tr').length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [bizName, letter, start, end, reported, affected] = await row.$$(
          'td'
        )
        if (
          (await page.evaluate((el) => el.childNodes.length, bizName)) === 0
        ) {
          // there are some empty rows on the last page if it only has a few items
          continue
        }
        const businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        let letterURL = ''
        try {
          letterURL = await letter.$eval('a[href]', (el) =>
            el.getAttribute('href').trim()
          )
        } catch (e) {}
        const startDate = await page.evaluate(
          (el) => el.textContent.trim(),
          start
        )
        const endDate = await page.evaluate((el) => el.textContent.trim(), end)
        const reportedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          reported
        )
        let numberAffected = await page.evaluate(
          (el) => el.textContent.trim(),
          affected
        )
        numberAffected = parseInt(numberAffected, 10)
        DATA.push({
          businessName,
          letterURL,
          startDate,
          endDate,
          reportedDate,
          numberAffected: isNaN(numberAffected) ? 'Unknown' : numberAffected,
        })
      } catch (e) {
        console.error(e)
        console.error(await page.evaluate((el) => el.innerHTML, row))
      }
    }
    if (selectedPageNumber !== '1') {
      const prevPageLink = await page.waitForSelector(
        '.footable-pagination-wrapper > .pagination > .footable-page-nav[aria-label="previous"] > a[href]'
      )
      await page.evaluate((el) => el.click(), prevPageLink)
    } else {
      done = true
    }
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.NODE_ENV !== 'production') {
  handler()
}
