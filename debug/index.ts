import { Master, initLogger, sendMessage } from '../src'
import { Laplax } from '../src'
export interface DataType {
  name: string
}

const master = new Master<DataType>()
master.enslave('GET', '/', async ({ res }) => {
  // const r = await new Promise(res => {
  //   if (!process.send) throw new Error('Process.send in undefiend')
  //   process.once('message', res)
  //   process.send({
  //     key: 'name',
  //     type: 'get',
  //     payload: 'Jon Snow',
  //     workerId: process.env['workerId'],
  //   } as Laplax.Message)
  // })
  /**/
  // if(process.listeners('message').length < 2) {
    await sendMessage(process, {
      key: 'name',
      type: 'get',
      payload: 'Jon Snow',
      workerId: process.env['workerId'],
    })
  // }
  
  
  /*
  initLogger(`Slave#${process.env['workerId']}`, "whiteBright")(JSON.stringify(r))
 */
  res.write('HELLO!')
  return {
    continue: false,
  }
})
master.listen(8000)
