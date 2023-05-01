import { createRow, initBrowser } from './utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto('https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf', {
    waitUntil: 'networkidle0',
  })
  const lastPage = await page.waitForSelector('.ui-paginator-last')
  const nav = page.waitForSelector('.ui-paginator-last.ui-state-disabled')
  await page.evaluate((el) => el.click(), lastPage)
  await nav

  let done = false
  while (!done) {
    const selectedPageLI = await page.waitForSelector(
      '.ui-paginator-page.ui-state-active'
    )
    const selectedPageNumber = await page.evaluate(
      (el) => el.textContent.trim(),
      selectedPageLI
    )
    const table = await page.waitForSelector('.ui-datatable table')
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.ui-datatable table > tbody > tr').length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [
          _,
          bizName,
          bizState,
          bizType,
          affected,
          reported,
          type,
          dataLoc,
        ] = await row.$$('td')
        const businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        const state = await page.evaluate(
          (el) => el.textContent.trim(),
          bizState
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
        const breachType = await page.evaluate(
          (el) => el.textContent.trim(),
          type
        )
        const dataSource = await page.evaluate(
          (el) => el.textContent.trim(),
          dataLoc
        )
        DATA.push(
          createRow(state)({
            businessName,
            state,
            reportedDate,
            numberAffected,
            breachType,
            dataSource,
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
    if (selectedPageNumber !== '1') {
      const prevPageLink = await page.waitForSelector('.ui-paginator-prev')
      const navWait = page.waitForFunction(
        (selectedPageNumber) => {
          const currentPageNumber = document
            .querySelector('.ui-paginator-page.ui-state-active')
            .innerText.trim()
          return currentPageNumber !== selectedPageNumber
        },
        {},
        selectedPageNumber
      )
      await page.evaluate((el) => el.click(), prevPageLink)
      await navWait
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
