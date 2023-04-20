import { createRow, initBrowser } from '../utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto('https://cca.hawaii.gov/ocp/notices/security-breach/', {
    waitUntil: 'networkidle0',
  })
  const pageSizeSelect = await page.waitForSelector(
    '[name="tablepress-1_length"]'
  )
  await pageSizeSelect.select('100')
  const nextPageSelector = '.paginate_button.next:not(.disabled)'
  let err
  while (!err) {
    try {
      // for most of the states, we start from the last page
      // it's not necessary, but this routine is for parity
      const nextPage = await page.waitForSelector(nextPageSelector)
      const nav = page.waitForNavigation()
      await page.evaluate((el) => el.click(), nextPage)
      await nav
    } catch (e) {
      err = e
    }
  }
  await page.waitForSelector('.paginate_button.next.disabled')

  let done = false
  while (!done) {
    const pageRange = await page.waitForSelector('#tablepress-1_info')
    const pageRangeText = await page.evaluate((el) => el.textContent, pageRange)
    const table = await page.waitForSelector('#tablepress-1')
    await page.waitForFunction(
      () => document.querySelectorAll('#tablepress-1 > tbody > tr').length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [reported, _, bizName, type, affected, letter] = await row.$$(
          'td'
        )
        let businessName = await page.evaluate((el) => el.textContent, bizName)
        businessName = businessName.trim()
        let reportedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          reported
        )
        reportedDate = reportedDate.replace('.', '/')
        let numberAffected = await page.evaluate(
          (el) => el.textContent,
          affected
        )
        numberAffected = parseInt(numberAffected.trim(), 10)
        let breachType = (
          await page.evaluate((el) => el.textContent, type)
        ).trim()
        let letterURL = ''
        try {
          letterURL = await letter.$eval('a[href]', (el) =>
            el.getAttribute('href').trim()
          )
        } catch (e) {}
        DATA.push(
          createRow('HI')({
            businessName,
            reportedDate: new Date(reportedDate).toLocaleDateString(),
            numberAffected,
            breachType,
            letterURL,
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
    if (pageRangeText.indexOf('Showing 1 to') === -1) {
      const prevPageLink = await page.waitForSelector(
        '.paginate_button.previous'
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
