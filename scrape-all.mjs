const states = [
  // 'california',
  // 'delaware',
  // 'hawaii',
  // 'iowa',
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
    }
  }
}
if (process.env.NODE_ENV !== 'production') {
  handler()
}
