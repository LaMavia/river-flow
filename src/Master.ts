import http from 'http'
import { Laplax, ChalkColors } from '../types'
import { extname } from 'path'
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

export class Master {
  routesRegistry: Laplax.SlaveRegistry[]
  logger: LoggerFunction
  private slavesRegistry: Laplax.KeyValueMap<cl.Worker> = {}
  private state: Laplax.KeyValueMap = {
    name: 'Jon Snow',
  }
  private _tasks: string[]

  constructor(tasks: string[] = []) {
    this.routesRegistry = []
    this.logger = initLogger('Master', 'italic')
    if (cl.isMaster) global.__Master = this
    if (!global.__exportedRoutes) global.__exportedRoutes = []
    for (const props of global.__exportedRoutes) this.enslave(...props)
    this._tasks = tasks
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
    const reg = {
      method,
      path: schemaToRegExp(path),
      callback,
    } as Laplax.SlaveRegistry

    if (this.routesRegistry) {
      this.routesRegistry.push(reg)
      this.routesRegistry = this.routesRegistry.sort((a, b) => {
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

  private *runTasks(tasks: string[]) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const logger = (c: keyof ChalkColors) => initLogger(`Task:${i}`, c)

      yield new Promise((res, rej) => {
        const p = cp.exec(task)
        p.stdout && p.stdout.on('data', logger('cyanBright'))
        p.on('close', res)
        p.on('error', logger('redBright'))
      })
    }
  }

  async *stroll(
    req: Laplax.ShieldReq,
    res: Laplax.ShieldRes,
    method: Laplax.HTTPMethod,
    path: string
  ): AsyncIterableIterator<Laplax.RouteResponse> {
    let lastMsg: Laplax.RouteResponse = {
      req,
      res,
      path,
      method,
      continue: true,
      error: null,
      ok: true,
    }

    for (const slave of this.routesRegistry) {
      if (!slave.path[0].test(path)) continue
      const msg = await slave.callback(lastMsg)
      if (msg) Object.assign(lastMsg, msg)
      yield lastMsg
      if (lastMsg.error) this.logger(lastMsg.error)
      if (!lastMsg.continue || !msg) break
    }

    res.end()
  }

  async onRequest(_req: http.IncomingMessage, _res: http.ServerResponse) {
    const method = _req.method as Laplax.HTTPMethod
    const url = _req.url || ''
    const req: Laplax.ShieldReq = Object.assign(_req, {
      body: await parseBody(_req),
      params: {},
    }) as Laplax.ShieldReq
    const res: Laplax.ShieldRes = Object.assign(_res, {
      send: send.bind({}, _res),
    })

    for await (const _ of this.stroll(req, res, method, url)) {
    }
  }

  private Database({
    type,
    payload,
    key,
  }: Laplax.MessageRequest): Laplax.DBResponseMessage {
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

  private MasterOnMessage(msg: Laplax.Message) {
    const res: Laplax.SendMessageResponse = {
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

  listen(port: number) {
    if (cl.isMaster) {
      Promise.all(this.runTasks(this._tasks)).then(() => {
        const n = cpus().length
        for (let i = 0; i < n; i++) {
          const id = randomEnoughID()
          const slave = cl.fork({ workerId: id })
          this.MasterInitEvents(slave, id)
          this.slavesRegistry[id] = slave
        }
        this.logger(`Starting Master @${port} with ${n} Slaves`)
      })
    } else {
      const server = http.createServer(this.onRequest.bind(this))
      server.listen(port)
      cl.emit('online')
    }
  }
}
