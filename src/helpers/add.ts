import { Laplax } from "../../types";

export const add = <T>(
  obj: T,
  payload: any
): Laplax.ResponseMessage => {
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
          if (Array.isArray(payload)) obj.concat(payload)
          else obj.push(payload)
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
