import { Master, initLogger, sendMessage } from '../src'
import { resolve } from 'path'
import fs from 'fs'
const master = new Master(['echo Hello'])
master.enslave('GET', '/', async ({ res, supervisor }) => {
  const r = await sendMessage(process, {
    msgs: [
      {
        key: 'name',
        type: 'update',
        payload: 'Jon Snow',
      },
    ],
    workerId: process.env['workerId'],
  })

  // initLogger(`Slave#${process.env['workerId']}`, "whiteBright")(JSON.stringify(r))

  res.send(fs.readFileSync(resolve(supervisor.public, './index.html')))
  return {
    continue: false,
  }
})
master.listen(8000)
master.public = __dirname
