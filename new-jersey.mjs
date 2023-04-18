import puppeteer from 'puppeteer'

export const handler = async () => {
  const DATA = []
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 1024 })
  await page.goto(
    'https://www.cyber.nj.gov/threat-center/public-data-breaches/',
    { waitUntil: 'networkidle0' }
  )

  const featuredPost = await page.waitForSelector(
    '.featuredPostBlock .articleFeature'
  )
  const link = await featuredPost.waitForSelector('h3 > a[href]')
  const businessName = await page.evaluate((el) => el.textContent.trim(), link)
  const href = await page.evaluate((el) => el.getAttribute('href'), link)
  const date = await featuredPost.waitForSelector('.postDate')
  const reportedDate = await page.evaluate((el) => el.textContent.trim(), date)
  console.log({
    businessName,
    reportedDate: new Date(reportedDate).toLocaleDateString(),
    url: 'https://www.cyber.nj.gov' + href,
  })

  const blog = await page.waitForSelector('.mainContentBlock')
  const posts = await blog.$$('.container-fluid > #alertsList')
  // first post covers multiple breaches, hence the -1
  for (let i = 0; i < posts.length - 1; i++) {
    const post = posts[i]
    const link = await post.waitForSelector('h2 > a[href]')
    const businessName = await page.evaluate(
      (el) => el.textContent.trim(),
      link
    )
    const href = await page.evaluate((el) => el.getAttribute('href'), link)
    const date = await post.waitForSelector('.postDate')
    const reportedDate = await page.evaluate(
      (el) => el.textContent.trim(),
      date
    )
    DATA.push({
      businessName,
      reportedDate: new Date(reportedDate).toLocaleDateString(),
      url: 'https://www.cyber.nj.gov' + href,
    })
  }
  await browser.close()

  console.log(DATA)
  return DATA
}

if (process.env.RUN) {
  handler()
}
