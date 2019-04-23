import http from 'http'
import { Chalk } from 'chalk'
import { Master } from './src';

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

declare type Executable<T> = (arg: Shield.KeyValueMap) => T

declare namespace Shield {
  interface KeyValueMap<T = any> {
    [key: string]: T
  }

  type Shieldback<T = KeyValueMap> = (message: Message<T>) => Partial<Message<T>> | void

  type RouteExport = [HTTPMethod, string, Shieldback]

  type HTTPMethod = 'POST' | 'GET' | 'UPDATE' | 'DELETE'
  interface SlaveRegistry {
    method: HTTPMethod
    path: [RegExp, string[]]
    callback: Shieldback
  }

  interface ShieldReq extends http.IncomingMessage {
    params: KeyValueMap<string>
    body: KeyValueMap<any>
  }

  interface ShieldRes extends http.ServerResponse {}

  interface Message<DataType extends KeyValueMap = KeyValueMap> {
    req: ShieldReq
    res: ShieldRes
    path: string
    method: HTTPMethod
    ok: boolean
    error: Error | null
    continue: boolean
    data: DataType
  }
}
declare global {
  namespace NodeJS {
    interface Global {
      __Master: Master
      __exportedRoutes: Shield.RouteExport[]
    }
  }
}
