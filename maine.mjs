import { createRow, initBrowser } from './utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()

  const page = await browser.newPage()

  // TODO: older archives in XSL format
  await page.goto(
    'https://apps.web.maine.gov/online/aeviewer/ME/40/list.shtml',
    { waitUntil: 'networkidle0' }
  )
  const pageSizeSelect = await page.waitForSelector(
    '[name="DataTables_Table_0_length"]'
  )
  await pageSizeSelect.select('100')
  const lastPage = await page.waitForSelector(
    '#DataTables_Table_0_paginate > span > a.paginate_button:last-child'
  )
  await page.evaluate((el) => el.click(), lastPage)
  await page.waitForSelector('#DataTables_Table_0_next.disabled')

  let done = false
  while (!done) {
    const selectedPageLink = await page.waitForSelector(
      '.paginate_button.current'
    )
    const selectedPageNumber = await page.evaluate(
      (el) => el.textContent,
      selectedPageLink
    )
    const table = await page.waitForSelector('#DataTables_Table_0')
    await page.waitForFunction(
      () =>
        document.querySelectorAll('#DataTables_Table_0 > tbody > tr').length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [reported, bizName] = await row.$$('td')
        const businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        const reportedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          reported
        )
        const url = await bizName.$eval('a[href]', (el) =>
          el.getAttribute('href')
        )
        DATA.push(
          createRow('ME')({
            businessName,
            reportedDate,
            url: 'https://apps.web.maine.gov/online/aeviewer/ME/40/' + url,
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
    if (selectedPageNumber !== '1') {
      const prevPageLink = await page.evaluateHandle(
        (el) => el.previousElementSibling,
        selectedPageLink
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
