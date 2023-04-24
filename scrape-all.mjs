const dayString = new Date()
  .toLocaleString('en-SE', { hour12: false })
  .replace(/[\-\/\,\ \.\:A-Z]+/g, '')


const states = [
  'california',
  'delaware',
  'hawaii',
  'iowa',
  'maine',
  'maryland',
  'montana',
  'new-hampshire',
  'new-jersey',
  'north-dakota',
  'oregon',
  'texas',
  'washington',
]

export const handler = async () => {

  const dbFilename = `${dayString}.json`
  if (process.env.NODE_ENV === 'production') {
    const { Low, Memory } = await import('lowdb')
    const adapter = new Memory()
    const db = new Low(adapter, { breaches: [] })
    await db.read()
    const { LambdaClient, InvokeCommand } = await import(
      '@aws-sdk/client-lambda'
    )
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const lambdaClient = new LambdaClient({ region: 'us-east-1' })
    const s3Client = new S3Client({ region: 'us-east-1' })
    const tasks = states.map((state) => {
      const params = {
        FunctionName: state,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: '{}',
      }
      const command = new InvokeCommand(params)
      return lambdaClient
        .send(command)
        .then((result) => Buffer.from(result.Payload))
        .then(JSON.parse)
        .then((result) => {
          Array.prototype.push.apply(db.data.breaches, result)
          return true;
        })
    })
    await Promise.all(tasks)
    const putCommand = new PutObjectCommand({
      Bucket: 'ksj-lambda-zips',
      Key: `database/${dbFilename}`,
      Body: JSON.stringify(db.data, null, 2),
    })
    await s3Client.send(putCommand)
  } else {
    const { Low } = await import('lowdb')
    const { JSONFile } = await import('lowdb/node')
    const adapter = new JSONFile(dbFilename)
    const db = new Low(adapter, { breaches: [] })
    await db.read()
    for (const state of states) {
      const fn = (await import(`./${state}/${state}.mjs`)).handler
      const result = await fn()
      console.log(result)
      Array.prototype.push.apply(db.data.breaches, result)
    }
    await db.write()
  }
}
if (process.env.NODE_ENV !== 'production') {
  handler()
}
