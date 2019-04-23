import chalk from "chalk"
import { Executable, ChalkColors } from "../../types";

const toLength = (x: number, l: number) => x.toString().padStart(l, "0")

export const withTime = (text: string) => {
  const d = new Date()
  
  return `{${toLength(d.getHours(), 2)}:${toLength(d.getMinutes(), 2)}:${toLength(d.getSeconds(),2)}:${toLength(d.getMilliseconds(), 3)}}${text}`
}

export type LoggerFunction = (text: any) => void
export const log = (text: any, color: keyof ChalkColors) =>
  console.log(
    ((chalk[color] as any) as Executable<string>)(
      typeof text === "object" ? JSON.stringify(text) : text
    )
  )
export const c_log = (text: any) => log(text, "yellowBright")

export const initLogger = (name: string, color: keyof ChalkColors): LoggerFunction => (text: any) => log(withTime(`[${name}]> ${text}`), color)