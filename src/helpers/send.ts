import { River } from '../../types'
import { ServerResponse } from 'http';

const switchDataType = <T>(x: T) => {
  if (x instanceof Buffer) return x.toString('utf-8')
  else if (
    typeof x === 'object' ||
    typeof x === 'bigint' ||
    typeof x === 'symbol'
  )
    return JSON.stringify(x)
  return x
}

export const send = <T>(
  res: ServerResponse,
  data: T,
  headers: River.KeyValueMap = {}
) => {
  res.statusCode = 200
  if (!res.headersSent)
    for (const header in headers) 
      res.setHeader(header, headers[header])
  res.write(switchDataType(data), 'utf-8')
}
