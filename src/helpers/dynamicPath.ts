import { Laplax } from '../../types'

export const parseURLParams = (
  req: Laplax.ShieldReq,
  keys: string[],
  regex: RegExp,
  path: string
): Laplax.ShieldReq => {
  const matches = path.match(regex) || []
  const params = keys.reduce(
    (params, key, i) => {
      params[key] = matches[i]
      return params
    },
    {} as Laplax.KeyValueMap
  )

  req.params = Object.assign(req.params, params)
  return req
}

export const schemaToRegExp = (path_schema: string): [RegExp, string[]] => {
  const param_regex = /:(\w+)/g
  const keys = (path_schema.match(param_regex) || []).map(key =>
    key.replace(/:/g, '')
  )
  const regex = new RegExp(
    path_schema.replace(param_regex, '(\\w*)').replace(/\//g, '\\/')
  )

  return [regex, keys]
}
