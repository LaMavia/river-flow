import { Master, initLogger, sendMessage } from '../src'
import { Laplax } from '../src'
export interface DataType {
  name: string
}

const master = new Master<DataType>()
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
  
  res.write('HELLO!')
  return {
    continue: false,
  }
})
master.listen(8000)
