import qs from "querystring"
import http from "http"

export const parseBody = <T>(req: http.IncomingMessage) => new Promise<T>((resolve, rej) => {
  let body: string = ''

  req.on("data", c => {
    body += c
  })
    .on("end", () => {
      resolve(qs.parse(body) as any as T)
    })
    .on("error", rej)
})