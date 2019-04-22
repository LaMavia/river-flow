import http from 'http'
import cp from 'child_process'
import { Curry } from './decorators/curry'
import { Shield } from '../types'
import { schemaToRegExp } from './helpers/dynamicPath'

export class Master {
  server: http.Server
  slaves_register: Shield.SlaveRegistry[] = []

  constructor() {
    this.server = http.createServer(this.on_request.bind(this))
  }

  @Curry
  enslave(method: Shield.HTTPMethod, path: string, path_to_slave: string) {
    const reg = {
      method,
      path: schemaToRegExp(path),
      path_to_slave
    } as Shield.SlaveRegistry
    this.slaves_register.push(reg)
    return reg
  }

  @Curry
  get(path: string, path_to_slave: string) {
    return this.enslave('GET', path, path_to_slave)
  }

  @Curry
  post(path: string, path_to_slave: string) {
    return this.enslave('POST', path, path_to_slave)
  }

  @Curry
  delete(path: string, path_to_slave: string) {
    return this.enslave('DELETE', path, path_to_slave)
  }

  @Curry
  update(path: string, path_to_slave: string) {
    return this.enslave('GET', path, path_to_slave)
  }

  *iterOverSlaves(method: Shield.HTTPMethod, path: string) {
    for (const slave of this.slaves_register.filter(
      r => r.method === method && r.path[0].test(path)
    )) {
      yield new Promise<Shield.Response<any>>((res, rej) => {
        const p = cp.fork(slave.path_to_slave)
        p.on('message', (msg: Shield.Response<any>) => {
          res(msg)
        })
        p.on('error', rej)
      })
    }
  }

  async on_request(req: http.IncomingMessage, res: http.ServerResponse) {
    const method = req.method as Shield.HTTPMethod
    const url = req.url || ''

    for await (const slave_reg of this.iterOverSlaves(method, url)) {
      slave_reg
    }
  }

  listen(port: number = 8000) {
    return this.server.listen(port)
  }
}
