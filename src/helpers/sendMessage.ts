import { Laplax } from '../../types'
import util from 'util'
import fs from 'fs'

export const sendMessage = (
  process: NodeJS.Process,
  msg: Laplax.Message
): Promise<Laplax.ResponseMessage> =>
  new Promise((res, rej) => {
    if (!process.send) throw new Error('Process.send in undefiend')
    function onRes(msg: Laplax.ResponseMessage) {
      process.removeListener('message', onRes)
      res(msg)
    }
    process.send(msg)
    process.once('message', onRes)
  })
