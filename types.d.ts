import http from 'http'
import { Chalk } from 'chalk'
import { River, Flow } from './src'
import './src/index'

declare interface ChalkColors {
  readonly reset: Chalk
  readonly bold: Chalk
  readonly dim: Chalk
  readonly italic: Chalk
  readonly underline: Chalk
  readonly inverse: Chalk
  readonly hidden: Chalk
  readonly strikethrough: Chalk

  readonly visible: Chalk

  readonly black: Chalk
  readonly red: Chalk
  readonly green: Chalk
  readonly yellow: Chalk
  readonly blue: Chalk
  readonly magenta: Chalk
  readonly cyan: Chalk
  readonly white: Chalk
  readonly gray: Chalk
  readonly grey: Chalk
  readonly blackBright: Chalk
  readonly redBright: Chalk
  readonly greenBright: Chalk
  readonly yellowBright: Chalk
  readonly blueBright: Chalk
  readonly magentaBright: Chalk
  readonly cyanBright: Chalk
  readonly whiteBright: Chalk

  readonly bgBlack: Chalk
  readonly bgRed: Chalk
  readonly bgGreen: Chalk
  readonly bgYellow: Chalk
  readonly bgBlue: Chalk
  readonly bgMagenta: Chalk
  readonly bgCyan: Chalk
  readonly bgWhite: Chalk
  readonly bgBlackBright: Chalk
  readonly bgRedBright: Chalk
  readonly bgGreenBright: Chalk
  readonly bgYellowBright: Chalk
  readonly bgBlueBright: Chalk
  readonly bgMagentaBright: Chalk
  readonly bgCyanBright: Chalk
  readonly bgWhiteBright: Chalk
}

declare type Executable<T> = (arg: River.KeyValueMap) => T

declare namespace River {
  interface KeyValueMap<T = any> {
    [key: string]: T
  }

  type SBReturnType = Partial<RouteResponse> | void
  type Shieldback<T = KeyValueMap> = (
    message: RouteResponse
  ) => SBReturnType | Promise<SBReturnType>

  type RouteExport = [HTTPMethod, string, Shieldback]

  type HTTPMethod = 'POST' | 'GET' | 'UPDATE' | 'DELETE'
  interface SlaveRegistry {
    method: HTTPMethod
    path: [RegExp, string[]]
    callback: Shieldback
  }

  interface Inflow extends http.IncomingMessage {
    params: KeyValueMap<string>
    body: KeyValueMap<any>
  }

  interface Outflow extends http.ServerResponse {
    send: <T>(
      data: T,
      headers?: River.KeyValueMap
    ) => void
  }

  interface RouteResponse {
    req: Inflow
    res: Outflow
    path: string
    method: HTTPMethod
    supervisor: Flow
    ok: boolean
    error: Error | null
    continue: boolean
  }

  interface Message {
    workerId: string
    msgs: MessageRequest[]
  }

  interface MessageRequest {
    type: "get" | "post" | "update" | "delete"
    key: string
    payload?: any
  }

  interface Order {
    type: 'order'
    key: 'public'
    payload: string
  }

  interface ResponseMessage<T = KeyValueMap> {
    data: T & KeyValueMap
    error?: Error
  }

  interface DBResponseMessage extends ResponseMessage {
    key: string
  }

  interface SendMessageResponse extends KeyValueMap {
    errors: Error[]
  }
}
declare global {
  namespace NodeJS {
    interface Global {
      __Flow: Flow
      __exportedRoutes: River.RouteExport[]
      __exportedMdw: River.Shieldback[]
    }

    interface ProcessEnv {
      workerId: string
    }
  }
}
