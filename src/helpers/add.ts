import { Laplax } from "../../types";

export const add = <T>(
  obj: T,
  payload: any
): Laplax.ResponseMessage<T> => {
  let data, error
  try {
    switch (typeof obj) {
      case 'bigint': obj += payload;break;
      case 'number': obj += payload;break;
      // @ts-ignore
      case 'string': obj += payload;break;
      case 'boolean': obj = payload;break;
      case 'undefined': throw new Error(`Object is undefined; Cannot assign value: ${payload} to undefined`);break;
      case 'object': {
        if (!obj)
          throw new Error(
            `Object is null; Cannot assign value: ${payload} to null`
          )

        if (obj instanceof Map || obj instanceof WeakMap)
          obj.set(payload[0], payload[1])
        else if (obj instanceof Set || obj instanceof WeakSet)
          obj.add(payload)
          else if (Array.isArray(obj)) {
            if (Array.isArray(payload)) 
            (obj as any).concat(payload)
            else (obj as any as any[]).push(payload)
            // @ts-ignore
        } else if(typeof obj.map === 'function') { /* Typed Arrays */
          // @ts-ignore
          const constr = obj.__proto__.constructor
          // @ts-ignore
          const na = new constr(obj.length + 1)
          for(let i in obj) na[i] = obj[i]
          na[na.length - 1] = payload
          obj = na
        } else {
          obj[payload[0]] = payload[1]
        }
      };break;
    }
    data = obj
  } catch (err) {
    error = err
  }
  return {
    data, error
  }
}
