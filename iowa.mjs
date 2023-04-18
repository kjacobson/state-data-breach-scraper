import puppeteer from 'puppeteer'

export const handler = async () => {
  const DATA = []
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto(
    'https://www.iowaattorneygeneral.gov/for-consumers/security-breach-notifications',
    { waitUntil: 'networkidle0' }
  )
  await page.setViewport({ width: 1280, height: 1024 })
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
  }

  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}
