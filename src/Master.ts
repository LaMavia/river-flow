import http from 'http'
import { River, ChalkColors } from '../types'
import { extname, resolve } from 'path'
import cl from 'cluster'
import { cpus } from 'os'
import {
  randomEnoughID,
  send,
  add,
  initLogger,
  LoggerFunction,
  parseBody,
  schemaToRegExp,
} from './helpers/'
import cp from 'child_process'
import { readFile } from 'fs'
import mime from 'mime'

export class Flow {
  routesRegistry: River.SlaveRegistry[]
  mwdRegistry: River.Shieldback[]
  logger: LoggerFunction
  private _public: string = ''
  private slavesRegistry: River.KeyValueMap<cl.Worker> = {}
  private state: River.KeyValueMap = {
    name: 'Jon Snow',
  }
  private _tasks: string[]

  constructor(tasks: string[] = []) {
    this.routesRegistry = []
    this.mwdRegistry = []
    this.logger = initLogger(
      cl.isMaster ? 'Master' : `Slave#${process.env['workerId']}`,
      'italic'
    )
    if (cl.isMaster) global.__Flow = this
    this.consumeFlow()
    this._tasks = tasks
  }

  get ext() {
    return process.mainModule ? extname(process.mainModule.filename) : '.js'
  }

  set public(v: string) {
    this._public = v

    if (cl.isMaster) {
      for (const id in this.slavesRegistry) {
        this.slavesRegistry[id].send({
          type: 'order',
          key: 'public',
          payload: this._public,
        } as River.Order)
      }
    }
  }

  get public() {
    return this._public
  }

  static route(props: River.RouteExport) {
    if (!global.__exportedRoutes) global.__exportedRoutes = []
    global.__exportedRoutes.push(props)
  }

  static middleware(middleware: River.Shieldback) {
    if (!global.__exportedMdw) global.__exportedMdw = []
    global.__exportedMdw.push(middleware)
  }

  private consumeFlow() {
    if (!global.__exportedRoutes) global.__exportedRoutes = []
    if (!global.__exportedMdw) global.__exportedMdw = []
    let r: River.RouteExport
    // @ts-ignore
    while ((r = global.__exportedRoutes.shift())) {
      this.enslave(...r)
    }

    let m: River.Shieldback
    // @ts-ignore
    while ((m = global.__exportedMdw.shift())) this.gate(m)
  }

  enslave(method: River.HTTPMethod, path: string, callback: River.Shieldback) {
    const reg = {
      method,
      path: schemaToRegExp(path),
      callback,
    } as River.SlaveRegistry

    if (this.routesRegistry) {
      this.routesRegistry.push(reg)
      this.logger(`Initializing a route "${reg.method}: ${path}"`)
      /* UNCOMMENT IF SWITCHING TO THE MULTI-MATCH ROUTING */
      /*
      this.routesRegistry = this.routesRegistry.sort((a, b) => {
        const gl = (a: any): number =>
          (a.path[0].source.match(/\//) || []).length
        debugger
        return gl(b) - gl(a)
      })*/
    }
    return reg
  }

  gate(middleware: River.Shieldback) {
    this.mwdRegistry.push(middleware)
    this.logger(`Initializing a middleware ${middleware.name}`)
  }

  get(path: string, callback: River.Shieldback) {
    return this.enslave('GET', path, callback)
  }

  post(path: string, callback: River.Shieldback) {
    return this.enslave('POST', path, callback)
  }

  delete(path: string, callback: River.Shieldback) {
    return this.enslave('DELETE', path, callback)
  }

  update(path: string, callback: River.Shieldback) {
    return this.enslave('GET', path, callback)
  }

  private async *runTasks(tasks: string[]) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const logger = (c: keyof ChalkColors) => initLogger(`Task:${i}`, c)

      yield await new Promise((res, rej) => {
        const p = cp.exec(task)
        p.stdout && p.stdout.on('data', logger('cyanBright'))
        p.on('close', res)
        p.on('error', logger('redBright'))
      })
    }
  }

  serverStatic(res: River.Outflow, path: string): void {
    path = path.replace(/^[\\\/]/, '')
    readFile(
      resolve(this._public, path),
      {
        encoding: 'utf-8',
      },
      (err, data) => {
        if (err && res.writable) return res.writeHead(404, JSON.stringify(err))
        res.statusCode = 200
        res.send(data, {
          'Content-Type': mime.getType(path),
        })
        res.end()
      }
    )
  }

  async stream(
    req: River.Inflow,
    res: River.Outflow,
    method: River.HTTPMethod,
    path: string
  ) {
    const route = this.routesRegistry.find(
      r => r.path[0].test(path) && r.method === method
    )
    if (!route) {
      res.writeHead(404, `Route ${path} not found`)
    } else {
      let mdwMsg: River.RouteResponse = {
        req,
        res,
        path,
        method,
        continue: true,
        error: null,
        ok: true,
        supervisor: this,
      }
      for (const mdw of this.mwdRegistry) {
        const msg = await mdw(mdwMsg)
        if (msg && msg.error)
          return res.writeHead(405, String(msg.error)), res.end()
        if (msg && !msg.continue)
          return res.writeHead(418, 'You shall not pass'), res.end()
      }
      Promise.resolve(
        route.callback({
          req,
          res,
          path,
          method,
          continue: true,
          error: null,
          ok: true,
          supervisor: this,
        })
      ).then((msg: River.SBReturnType) => {
        if (msg && msg.error) this.logger(msg.error)
        res.end()
      })
    }
  }

  async onRequest(_req: http.IncomingMessage, _res: http.ServerResponse) {
    const method = _req.method as River.HTTPMethod
    const path = _req.url || ''
    const req: River.Inflow = Object.assign(_req, {
      body: await parseBody(_req),
      params: {},
    }) as River.Inflow
    const res: River.Outflow = Object.assign(_res, {
      send: send.bind({}, _res),
    })
    if (/\.\w+$/i.test(path)) {
      this.serverStatic(res, path)
    } else {
      this.stream(req, res, method, path)
    }
  }

  private Database({
    type,
    payload,
    key,
  }: River.MessageRequest): River.DBResponseMessage {
    let data: any
    let error: any
    try {
      switch (type) {
        case 'get':
          data = this.state[key]
          break
        case 'delete':
          {
            delete this.state[key]
            data = !this.state[key]
          }
          break
        case 'post':
          const { data: d, error: err } = add(this.state[key], payload)
          data = d
          error = err
          break
        case 'update':
          data = this.state[key] = payload
          break
        default:
          error = new Error(`Invalid database request type: ${type}`)
          break
      }
    } catch (err) {
      error = err
    }

    return {
      data,
      error,
      key,
    }
  }

  private MasterInitEvents(slave: cl.Worker, id: string) {
    slave.on('message', this.MasterOnMessage.bind(this))
    slave.on('listening', () => {
      this.logger(`Slave ready! (${id})`)
    })
  }

  private MasterOnMessage(msg: River.Message) {
    const res: River.SendMessageResponse = {
      errors: [],
    }
    for (const req of msg.msgs) {
      const { data, key, error } = this.Database(req)
      res[key] = data
      if (error) res.errors.push(error)
    }
    // console.dir(msg, {colors: true, depth: 2})
    this.slavesRegistry[msg.workerId].send(res)
  }

  private SlaveInitEvents() {
    process.on('message', (order: River.Order) => {
      if (order.type !== 'order') return
      this[order.key] = order.payload
    })
  }

  async listen(port: number) {
    if (cl.isMaster) {
      for await (const _ of this.runTasks(this._tasks)) {
      }
      const n = 4 // cpus().length
      for (let i = 0; i < n; i++) {
        cl.setupMaster({
          inspectPort: 6000 + i,
        })
        const id = randomEnoughID()
        const slave = cl.fork({ workerId: id })
        this.MasterInitEvents(slave, id)
        this.slavesRegistry[id] = slave
      }
      this.logger(`Starting Master @${port} with ${n} Slaves`)
    } else {
      this.consumeFlow()
      const server = http.createServer(this.onRequest.bind(this))
      server.listen(port)
      this.SlaveInitEvents()
      cl.emit('online')
    }
  }
}
