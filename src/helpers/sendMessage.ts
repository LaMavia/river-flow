import { River } from '../../types'

export const sendMessage = (
  process: NodeJS.Process,
  msg: River.Message
): Promise<River.ResponseMessage> =>
  new Promise((res, rej) => {
    if (!process.send) throw new Error('Process.send in undefiend')
    function onRes(msg: River.ResponseMessage) {
      process.removeListener('message', onRes)
      res(msg)
    }
    process.send(msg)
    process.once('message', onRes)
  })
