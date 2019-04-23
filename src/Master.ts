import http from 'http'
import { Laplax } from '../types'
import { schemaToRegExp } from './helpers/dynamicPath'
import { extname } from 'path'
import { parseBody } from './helpers/parseBody'
import npath, { resolve } from 'path'
import { initLogger, LoggerFunction } from './helpers/logger'
import cl from 'cluster'
import { cpus } from 'os'

export class Master<DataType extends Laplax.KeyValueMap = Laplax.KeyValueMap> {
  slavesRegister: Laplax.SlaveRegistry[]
  logger: LoggerFunction

  constructor() { 
    this.slavesRegister = []
    this.logger = initLogger('Master', 'italic')
    global.__Master = this
    if(!global.__exportedRoutes) global.__exportedRoutes = []
    for (const props of global.__exportedRoutes) this.enslave(...props)
  }

  get ext() {
    return process.mainModule ? extname(process.mainModule.filename) : '.js'
  }

  static route(props: Laplax.RouteExport) {
    if (!global.__exportedRoutes) global.__exportedRoutes = []
    global.__exportedRoutes.push(props)
  }

  enslave(
    method: Laplax.HTTPMethod,
    path: string,
    callback: Laplax.Shieldback
  ) {
    const dir = npath.dirname(
      (require.main && require.main.filename) || __filename
    )
    debugger
    const reg = {
      method,
      path: schemaToRegExp(path),
      callback,
    } as Laplax.SlaveRegistry

    if (this.slavesRegister) {
      this.slavesRegister.push(reg)
      this.slavesRegister = this.slavesRegister.sort((a, b) => {
        const gl = (a: any): number =>
          (a.path[0].source.match(/\//) || []).length
        debugger
        return gl(b) - gl(a)
      })
    }
    return reg
  }

  get(path: string, callback: Laplax.Shieldback) {
    return this.enslave('GET', path, callback)
  }

  post(path: string, callback: Laplax.Shieldback) {
    return this.enslave('POST', path, callback)
  }

  delete(path: string, callback: Laplax.Shieldback) {
    return this.enslave('DELETE', path, callback)
  }

  update(path: string, callback: Laplax.Shieldback) {
    return this.enslave('GET', path, callback)
  }

  *stroll(
    req: Laplax.ShieldReq,
    res: Laplax.ShieldRes,
    method: Laplax.HTTPMethod,
    path: string
  ): IterableIterator<Laplax.Message<DataType>> {
    let lastMsg: Laplax.Message<DataType> = {
      req,
      res,
      path,
      method,
      continue: true,
      error: null,
      ok: true,
      data: {} as DataType,
    }

    for (const slave of this.slavesRegister.filter(s => {
      debugger
      return s.path[0].test(path)
    })) {
      const msg = slave.callback(lastMsg)
      if (msg) Object.assign(lastMsg, msg)
      yield lastMsg
      if (lastMsg.error) this.logger(lastMsg.error)
      if (!lastMsg.continue || !msg) break
    }

    res.end()
  }

  async onRequest(_req: http.IncomingMessage, res: http.ServerResponse) {
    const method = _req.method as Laplax.HTTPMethod
    const url = _req.url || ''
    const req: Laplax.ShieldReq = Object.assign({}, _req, {
      body: await parseBody(_req),
      params: {},
    }) as Laplax.ShieldReq

    for (const msg of this.stroll(req, res, method, url)) {
      debugger
    }
  }

  listen(port: number) {
    if (cl.isMaster) {
      const n = cpus().length
      for (let i = 0; i < n; i++) cl.fork()
      this.logger(`Starting Master @${port} with ${n} Slaves`)
    } else {
      const server = http.createServer(this.onRequest.bind(this))
      server.listen(port)
    }
  }
}
