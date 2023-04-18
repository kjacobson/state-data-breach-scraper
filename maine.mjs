import puppeteer from 'puppeteer'

export const handler = async () => {
  const DATA = []
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  // TODO: older archives in XSL format
  await page.goto(
    'https://apps.web.maine.gov/online/aeviewer/ME/40/list.shtml',
    { waitUntil: 'networkidle0' }
  )
  await page.setViewport({ width: 1280, height: 1024 })
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
        let businessName = await page.evaluate((el) => el.textContent, bizName)
        businessName = businessName.trim()
        let reportedDate = await page.evaluate((el) => el.textContent, reported)
        reportedDate = reportedDate.trim()
        DATA.push({
          businessName,
          reportedDate,
        })
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
