import http from 'http'
import cp, { ChildProcess } from 'child_process'
import { Shield } from '../types'
import { schemaToRegExp } from './helpers/dynamicPath'
import { extname } from 'path'
import { parseBody } from './helpers/parseBody'
import npath, { resolve } from 'path'
import { initLogger, LoggerFunction } from './helpers/logger'

export class Master<DataType extends Shield.KeyValueMap = Shield.KeyValueMap> {
  server: http.Server
  slavesRegister: Shield.SlaveRegistry[]
  logger: LoggerFunction

  constructor() {
    this.slavesRegister = []
    this.server = http.createServer(this.onRequest.bind(this))
    this.logger = initLogger('Master', 'italic')
    global.__Master = this
    for(const props of global.__exportedRoutes) this.enslave(...props)
  }

  get ext() {
    return process.mainModule ? extname(process.mainModule.filename) : '.js'
  }

  static route(props: Shield.RouteExport) {
    if(!global.__exportedRoutes) global.__exportedRoutes = []
    global.__exportedRoutes.push(props)
  }

  enslave(
    method: Shield.HTTPMethod,
    path: string,
    callback: Shield.Shieldback
  ) {
    const dir = npath.dirname(
      (require.main && require.main.filename) || __filename
    )
    debugger
    const reg = {
      method,
      path: schemaToRegExp(path),
      callback,
    } as Shield.SlaveRegistry

    this.slavesRegister && this.slavesRegister.push(reg)
    return reg
  }

  get(path: string, callback: Shield.Shieldback) {
    return this.enslave('GET', path, callback)
  }

  post(path: string, callback: Shield.Shieldback) {
    return this.enslave('POST', path, callback)
  }

  delete(path: string, callback: Shield.Shieldback) {
    return this.enslave('DELETE', path, callback)
  }

  update(path: string, callback: Shield.Shieldback) {
    return this.enslave('GET', path, callback)
  }

  *stroll(
    req: Shield.ShieldReq,
    res: Shield.ShieldRes,
    method: Shield.HTTPMethod,
    path: string
  ): IterableIterator<Shield.Message<DataType>> {
    let lastMsg: Shield.Message<DataType> = {
      req,
      res,
      path,
      method,
      continue: true,
      error: null,
      ok: true,
      data: {} as DataType,
    }

    for (const slave of this.slavesRegister
      .filter(s => {
        debugger
        return s.path[0].test(path)
      })
      .sort((a, b) => {
        const gl = (a: any): number => (a.path[0].source.match(/\//) || []).length
        debugger
        return gl(b) - gl(a)
      })
      ) {
      const msg = slave.callback(lastMsg)
      if (msg) Object.assign(lastMsg, msg)
      yield lastMsg
      if (lastMsg.error) this.logger(lastMsg.error)
      if (!lastMsg.continue) break
    }

    res.end()
  }

  async onRequest(_req: http.IncomingMessage, res: http.ServerResponse) {
    const method = _req.method as Shield.HTTPMethod
    const url = _req.url || ''
    const req: Shield.ShieldReq = Object.assign({}, _req, {
      body: await parseBody(_req),
      params: {},
    }) as Shield.ShieldReq

    for (const msg of this.stroll(req, res, method, url)) {
      debugger
    }
  }

  listen(port: number = 8000) {

    this.server.listen(port)
    this.logger(`Listening @${port}`)
    return this
  }
}
