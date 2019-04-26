import { Master, initLogger, sendMessage } from '../src'
const master = new Master([
  "echo Hello"
])
master.enslave('GET', '/', async ({ res }) => {
  const r = await sendMessage(process, {
    msgs: [
      {
        key: 'name',
        type: 'update',
        payload: 'Jon Snow'
      }
    ],
    workerId: process.env['workerId'],
  })
  
  initLogger(`Slave#${process.env['workerId']}`, "whiteBright")(JSON.stringify(r))
  
  res.send('HELLO!')
  return {
    continue: false,
  }
})
master.listen(8000)
