import sqlite from 'better-sqlite3'

const dayString = new Date()
  .toLocaleString('en-US', { hour12: false })
  .replace(/[\/\,\ \:A-Z]+/g, '')

const db = sqlite(`${dayString}.db`, {})
db.pragma('journal_mode = WAL')

const createTable = `
CREATE TABLE IF NOT EXISTS breaches (
	state TEXT NOT NULL,
	entity_name TEXT NOT NULL,
    dba TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_zip TEXT,
    start_date TEXT,
    end_date TEXT,
    breach_dates TEXT,
    reported_date TEXT,
    published_date TEXT,
    number_affected INT,
    data_accessed TEXT,
    notice_methods TEXT,
    breach_type TEXT,
    letter_url TEXT,
    url TEXT
);
`
const indices = [
  'CREATE INDEX IF NOT EXISTS idx_state ON breaches (state);',
  'CREATE INDEX IF NOT EXISTS idx_entity_name ON breaches (entity_name);',
  'CREATE INDEX IF NOT EXISTS idx_start_date ON breaches (start_date);',
  'CREATE INDEX IF NOT EXISTS idx_end_date ON breaches (end_date);',
  'CREATE INDEX IF NOT EXISTS idx_breach_dates ON breaches (breach_dates);',
  'CREATE INDEX IF NOT EXISTS idx_reported_date ON breaches (reported_date);',
  'CREATE INDEX IF NOT EXISTS idx_published_date ON breaches (published_date);',
  'CREATE INDEX IF NOT EXISTS idx_number_affected ON breaches (number_affected);',
  'CREATE INDEX IF NOT EXISTS idx_data_accessed ON breaches (data_accessed);',
]

const states = [
  // 'california',
  // 'delaware',
  // 'hawaii',
  'iowa',
  'maine',
  // 'maryland',
  // 'montana',
  // 'new-hampshire',
  // 'new-jersey',
  // 'north-dakota',
  // 'oregon',
  // 'texas',
  // 'washington',
]

export const handler = async () => {
  db.prepare(createTable).run()
  indices.map((stmt) => db.prepare(stmt)).map((stmt) => stmt.run())
  if (process.env.NODE_ENV === 'production') {
    const { LambdaClient, InvokeCommand } = await import(
      '@aws-sdk/client-lambda'
    )
    const client = new LambdaClient({ region: 'us-east-1' })
    const tasks = states.map((state) => {
      const params = {
        FunctionName: state,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: '{}',
      }
      const command = new InvokeCommand(params)
      return client
        .send(command)
        .then((result) => Buffer.from(result.Payload))
        .then(JSON.parse)
        .then(console.log)
    })
    await Promise.all(tasks)
  } else {
    for (const state of states) {
      const fn = (await import(`./${state}.mjs`)).handler
      const result = await fn()
      console.log(result)
      const insert = db.prepare(`INSERT INTO breaches (
        state,
        entity_name,
        dba,
        business_address,
        business_city,
        business_state,
        business_zip,
        start_date,
        end_date,
        breach_dates,
        reported_date,
        published_date,
        number_affected,
        data_accessed,
        notice_methods,
        breach_type,
        letter_url,
        url
      ) VALUES (
        @state,
        @entity_name,
        @dba,
        @business_address,
        @business_city,
        @business_state,
        @business_zip,
        @start_date,
        @end_date,
        @breach_dates,
        @reported_date,
        @published_date,
        @number_affected,
        @data_accessed,
        @notice_methods,
        @breach_type,
        @letter_url,
        @url
      )`)
      result.forEach((item) => {
        insert.run(item)
      })
    }
  }
  db.close()
}
if (process.env.NODE_ENV !== 'production') {
  handler()
}
