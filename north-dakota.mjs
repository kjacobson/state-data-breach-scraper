import { createRow, initBrowser } from './utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto(
    'https://attorneygeneral.nd.gov/consumer-resources/data-breach-notices'
  )
  const lastPage = await page.waitForSelector('.pagination .pager-last')
  await lastPage.click()
  await page.waitForSelector('.pagination .pager-last', { hidden: true })

  let done = false
  while (!done) {
    const selectedPageLI = await page.waitForSelector(
      '.pagination > li.active > span'
    )
    const selectedPageNumber = await page.evaluate(
      (el) => el.textContent,
      selectedPageLI
    )
    const table = await page.waitForSelector('#block-system-main .views-table')
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          '#block-system-main .views-table > tbody > tr'
        ).length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [bizName, dba, dates, reported, affected, doc] = await row.$$(
          'td'
        )
        const businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        const dbaName = await page.evaluate((el) => el.textContent.trim(), dba)
        const letterURL = await doc.$eval('a[href]', (el) =>
          el.getAttribute('href')
        )
        let dateString = await page.evaluate(
          (el) => el.textContent.trim(),
          dates
        )
        let breachDates
        let startDate
        let endDate
        if (dateString.trim().indexOf('and') > -1) {
          breachDates = dateString.split('and').map((date) => date.trim())
        } else if (dateString.trim().indexOf('to') > -1) {
          ;[startDate, endDate] = dateString
            .split('to')
            .map((date) => date.trim())
        } else {
          startDate = dateString
        }
        const reportedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          reported
        )
        let numberAffected = await page.evaluate(
          (el) => el.textContent.trim(),
          affected
        )
        numberAffected = parseInt(numberAffected, 10)
        numberAffected = isNaN(numberAffected ? 'Unknown' : numberAffected)
        DATA.push(
          createRow('ND')({
            businessName,
            dba: dbaName,
            letterURL,
            breachDates,
            startDate:
              new Date(startDate).toString() === 'Invalid Date'
                ? startDate
                : new Date(startDate).toLocaleDateString(),
            endDate:
              new Date(endDate).toString() === 'Invalid Date'
                ? endDate
                : new Date(endDate).toLocaleDateString(),
            reportedDate:
              new Date(reportedDate).toString() === 'Invalid Date'
                ? reportedDate
                : new Date(reportedDate).toLocaleDateString(),
            numberAffected,
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
    if (selectedPageNumber !== '1') {
      const prevPageLink = await page.waitForSelector(
        '.pagination > li.prev > a[href]'
      )
      const pageChange = page.waitForFunction(
        (selectedPageNumber) => {
          const selectedPage = document.querySelector(
            '.pagination > li.active > span'
          )
          const newSelectedPage = selectedPage.textContent
          return newSelectedPage !== selectedPageNumber
        },
        {},
        selectedPageNumber
      )
      await Promise.all([
        await page.evaluate((el) => el.click(), prevPageLink),
        await pageChange,
      ])
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
