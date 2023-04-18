import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const createRow = (state) => (data) => {
  return {
    state,
    business_name: data.businessName || '',
    dba: data.dba || 'N/A', // ND only
    business_address: data.businessAddress || '', // TX only
    business_city: data.businessCity || '', // TX only
    business_state: data.businessState || '', // TX only
    business_zip: data.businessZip || '', // TX only
    start_date: data.startDate || '',
    end_date: data.endDate || '',
    breach_dates: data.breachDates || '',
    reported_date: data.reportedDate || '',
    published_date: data.publishedDate || '', // TX only
    number_affected: data.numberAffected || 'Unknown',
    data_accessed: data.dataAccessed || 'Not available',
    notice_methods: data.noticeMethods || 'Not available', // TX only
    breach_type: data.breachType || 'Not available',
    letter_url: data.letterURL || 'N/A',
    url: data.url || '',
  }
}

export const initBrowser = async () => {
  return await puppeteer.launch({
    args: chromium.args,
    ignoreHTTPSErrors: true,
    defaultViewport: chromium.defaultViewport,
    executablePath:
      process.env.NODE_ENV !== 'production'
        ? './chrome/mac_arm-1065249/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
        : await chromium.executablePath,
    headless: process.env.NODE_ENV === 'production',
  })
}
