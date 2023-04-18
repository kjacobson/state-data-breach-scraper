import puppeteer from 'puppeteer'

const handler = async () => {
  const DATA = []
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto('https://www.atg.wa.gov/data-breach-notifications', {
    waitUntil: 'networkidle0',
  })
  await page.setViewport({ width: 1280, height: 1024 })
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
        let businessName = await page.evaluate((el) => el.textContent, bizName)
        businessName = businessName.trim()
        let startDate = await page.evaluate((el) => el.textContent, start)
        startDate = startDate.trim()
        let reportedDate = await page.evaluate((el) => el.textContent, reported)
        reportedDate = reportedDate.trim()
        let numberAffected = await page.evaluate(
          (el) => el.textContent,
          affected
        )
        numberAffected = parseInt(numberAffected.trim(), 10)
        let dataAccessed = await page.evaluate(
          (el) => el.textContent,
          dataTypes
        )
        dataAccessed = dataAccessed.trim().split('; ')
        DATA.push({
          businessName,
          startDate,
          reportedDate,
          numberAffected,
          dataAccessed,
        })
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
