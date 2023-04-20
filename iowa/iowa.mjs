import { createRow, initBrowser } from '../utils.mjs'

export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  await page.goto(
    'https://www.iowaattorneygeneral.gov/for-consumers/security-breach-notifications',
    { waitUntil: 'networkidle0' }
  )
  let years = await page.$$('#navigation > ul > li:nth-child(8) > ul > li')

  for (let i = years.length - 1; i >= 0; i--) {
    const currentYearLink = await page.waitForSelector(
      `#navigation > ul > li:nth-child(8) > ul > li:nth-child(${
        i + 1
      }) > a[href]`
    )
    const nav = page.waitForNavigation()
    await page.evaluate((el) => el.click(), currentYearLink)
    await nav

    const table = await page.waitForSelector(
      '#content table[role="presentation"]'
    )
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          '#content table[role="presentation"] > tbody > tr'
        ).length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows.slice(1)) {
      try {
        const [reported, bizName] = await row.$$('td')
        let businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        const letterURL = await bizName.$eval('a[href]', (el) =>
          el.getAttribute('href')
        )
        let reportedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          reported
        )
        DATA.push(
          createRow('IA')({
            businessName,
            reportedDate,
            letterURL: 'https://www.iowaattorneygeneral.gov' + letterURL,
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}
