import { createRow, initBrowser } from '../utils.mjs'

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
  /January|February|Feburary|March|April|Aptil|May|June|July|August|September|October|Ocotber|November|December/
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
    const listItems = await page.$$(
      '#bodycontainer > main > .wide-width > ul > li > a'
    )
    for (const item of listItems) {
      const text = await page.evaluate((el) => el.textContent.trim(), item)
      const href = await page.evaluate((el) => el.getAttribute('href'), item)
      const breakPoint = text.search(months)
      let businessName
      let reportedDate
      if (breakPoint > 0) {
        businessName = text.substring(0, breakPoint)
        // remove comma and one or more spaces between company name and date
        businessName = businessName.trim()
        businessName = businessName.substring(0, businessName.length - 1)
        // TODO: take date from end of URL
        reportedDate = text.substring(breakPoint)
          .replace("20220", "2022")
          .replace("20202", "2020")
          .replace("20212", "2022")
          .replace("20166", "2016")
          .replace("12017", "2017")
          .replace("2033", "2022")
          .replace("20144", "2014")
          .replace("202", "2021")
          .replace("1986", "2016")
      }
      DATA.push(
        createRow('NH')({
          businessName,
          reportedDate: reportedDate
            ? new Date(reportedDate).toLocaleDateString()
            : '',
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
