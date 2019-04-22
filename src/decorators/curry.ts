export const Curry: MethodDecorator = <T>(target: T, key: string | symbol, desc: TypedPropertyDescriptor<T | any>) => {
  const original = desc.value as T

  if(typeof original === 'function') {
    desc.value = function currier (...args: any[]): any {
      if(args.length < original.length) return currier.bind(target, ...args)
      return original.call(target, ...args)
    } as any as T
  }

  return desc
}