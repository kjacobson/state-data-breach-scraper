import { createRow, initBrowser } from './utils.mjs'

const pages = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'numeric',
]
const months =
  /January|February|March|April|May|June|July|August|September|October|November|December/
export const handler = async () => {
  const DATA = []
  const browser = await initBrowser()
  const page = await browser.newPage()

  for (const letter of pages) {
    await page.goto(
      `https://www.doj.nh.gov/consumer/security-breaches/${letter}.htm`,
      { waitUntil: 'networkidle0' }
    )
    await page.waitForSelector('#bodycontainer > main')
    const listItems = await page.$$('#bodycontainer > main ul > li > a')
    for (const item of listItems) {
      let text = await page.evaluate((el) => el.textContent, item)
      text = text.trim()
      const href = await page.evaluate((el) => el.getAttribute('href'), item)
      const breakPoint = text.search(months)
      let businessName = text.substring(0, breakPoint)
      // remove comma and one or more spaces between company name and date
      businessName = businessName.trim()
      businessName = businessName.substring(0, businessName.length - 1)
      const reportedDate = text.substring(breakPoint)
      DATA.push(
        createRow('NH')({
          businessName,
          reportedDate: new Date(reportedDate).toLocaleDateString(),
          url: 'https://www.doj.nh.gov/consumer/security-breaches/' + href,
        })
      )
    }
  }
  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}
