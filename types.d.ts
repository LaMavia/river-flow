import http from "http"

declare namespace Shield {

  interface KeyValueMap {
    [key: string]: any
  }

  type HTTPMethod =  "POST" | "GET" | "UPDATE" | "DELETE"
  interface SlaveRegistry {
    method: HTTPMethod
    path: [RegExp, string[]]
    path_to_slave: string
  }

  interface ShieldReq extends http.IncomingMessage {
    params: {
      [param: string]: string
    }
  }
  
  interface ShieldRes extends http.ServerResponse {
  
  }
  
  interface Message {
    req: ShieldReq
    res: ShieldRes
  }

  interface Response<T> extends Message {
    ok: boolean
    error: Error | null
    data: T
  }

}
