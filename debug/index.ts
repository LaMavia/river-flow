import { Flow, initLogger, sendMessage } from '../dist'
import { resolve } from 'path'
import fs from 'fs'
const master = new Flow(['echo Hello'])
master.enslave('GET', '/', async ({ res, supervisor }) => {
  res.send(fs.readFileSync(resolve(supervisor.public, './index.html')))
  return {
    continue: false,
  }
})
master.listen(8000)
master.public = __dirname

master.post("/", ({ supervisor }) => {
  supervisor.logger("Here I'm!")
})