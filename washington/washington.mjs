import { createRow, initBrowser } from '../utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto('https://www.atg.wa.gov/data-breach-notifications', {
    waitUntil: 'networkidle0',
  })
  const lastPage = await page.waitForSelector('.page-numbers.last > a[href]')
  const nav = page.waitForNavigation()
  await page.evaluate((el) => el.click(), lastPage)
  await nav
  await page.waitForSelector('.pagination li.active.last')

  let done = false
  while (!done) {
    const selectedPageLI = await page.waitForSelector(
      '.pagination > li.active > a'
    )
    const selectedPageNumber = await page.evaluate(
      (el) => el.textContent,
      selectedPageLI
    )
    const table = await page.waitForSelector(
      '#block-views-data-breach-notifications-block .view-content .view-table'
    )
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          '#block-views-data-breach-notifications-block .view-content .view-table > tbody > tr'
        ).length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [reported, bizName, start, affected, dataTypes] = await row.$$(
          'td'
        )
        const businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        let letterURL = ''
        try {
          letterURL = await bizName.$eval('a[href]', (el) =>
            el.getAttribute('href').trim()
          )
        } catch (e) {}
        const startDate = await page.evaluate(
          (el) => el.textContent.trim(),
          start
        )
        const reportedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          reported
        )
        let numberAffected = await page.evaluate(
          (el) => el.textContent.trim(),
          affected
        )
        numberAffected = parseInt(numberAffected, 10)
        let dataAccessed = await page.evaluate(
          (el) => el.textContent.trim(),
          dataTypes
        )
        dataAccessed = dataAccessed.split('; ')
        DATA.push(
          createRow('WA')({
            businessName,
            startDate,
            reportedDate,
            numberAffected,
            dataAccessed,
            letterURL,
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
    if (selectedPageNumber !== '1') {
      const prevPageLink = await page.waitForSelector(
        '.prev.page-numbers a[href]'
      )
      await prevPageLink.click()
    } else {
      done = true
    }
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}
