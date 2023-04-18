import puppeteer from 'puppeteer'

export const handler = async () => {
  const DATA = []
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  await page.goto(
    'https://oag.my.site.com/datasecuritybreachreport/apex/DataSecurityReportsPage',
    { waitUntil: 'networkidle0' }
  )
  await page.setViewport({ width: 1280, height: 1024 })
  const lastPage = await page.waitForSelector('.paginate_button.last')
  const nav = page.waitForSelector('.paginate_button.last.disabled')
  await page.evaluate((el) => el.click(), lastPage)
  await nav

  let done = false
  while (!done) {
    const selectedPageLI = await page.waitForSelector(
      '.paginate_button.current'
    )
    const selectedPageNumber = await page.evaluate(
      (el) => el.textContent,
      selectedPageLI
    )
    console.log('Gathering data from page ' + selectedPageNumber + '...')
    const table = await page.waitForSelector('#mycdrs')
    await page.waitForFunction(
      () => document.querySelectorAll('#mycdrs > tbody > tr').length > 0
    )
    const rows = await table.$$('tbody > tr')
    for (const row of rows) {
      try {
        const [
          bizName,
          address,
          city,
          state,
          zip,
          dataTypes,
          affected,
          _,
          notice,
          published,
        ] = await row.$$('td')
        const businessName = await page.evaluate(
          (el) => el.textContent.trim(),
          bizName
        )
        const businessAddress = await page.evaluate(
          (el) => el.textContent.trim(),
          address
        )
        const businessCity = await page.evaluate(
          (el) => el.textContent.trim(),
          city
        )
        const businessState = await page.evaluate(
          (el) => el.textContent.trim(),
          state
        )
        const businessZip = await page.evaluate(
          (el) => el.textContent.trim(),
          zip
        )
        const publishedDate = await page.evaluate(
          (el) => el.textContent.trim(),
          published
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
        dataAccessed = dataAccessed.split(';')
        let noticeMethods = await page.evaluate(
          (el) => el.textContent.trim(),
          notice
        )
        noticeMethods = noticeMethods.split(';')
        DATA.push({
          businessName,
          businessAddress,
          businessCity,
          businessState,
          businessZip,
          publishedDate,
          numberAffected,
          dataAccessed,
          noticeMethods,
        })
      } catch (e) {
        console.error(e)
      }
    }
    if (selectedPageNumber !== '1') {
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
