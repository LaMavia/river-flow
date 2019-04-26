import { expect } from 'chai'
import { add } from '../src'
describe('add', () => {
  it('number', () => {
    const r = add(0, 1)
    expect(r.data).to.eq(1)
    expect(r.error).to.be.undefined
  })

  it('string', () => {
    const r = add('Jon ', 'Snow')
    expect(r.data).to.eq('Jon Snow')
    expect(r.error).to.be.undefined
  })

  it('bigint', () => {
    let a = BigInt(1),
      b = BigInt(1)
    const r = add(a, b)
    expect(r.data).to.eq(BigInt(2))
    expect(r.error).to.be.undefined
  })

  it('object', () => {
    const r = add({}, ['name', 'Jon'])
    expect(r.data.name).to.eq('Jon')
    expect(r.error).to.be.undefined
  })

  it('Map', () => {
    const r = add(new Map(), ['name', 'Jon'])
    expect(r.data.get('name')).to.eq('Jon')
    expect(r.error).to.be.undefined
  })

  it('WeakMap', () => {
    const _k = {}
    const r = add(new WeakMap(), [_k, 'Jon Snow'])
    expect(r.data.get(_k)).to.eq('Jon Snow')
    expect(r.error).to.be.undefined
  })

  it('Set', () => {
    const r = add(new Set(), 'a cat')
    expect(r.data.has('a cat')).to.be.true
    expect(r.error).to.be.undefined
  })

  it('WeakSet', () => {
    const _o = { a: 'cat' }
    const r = add(new WeakSet(), _o)
    expect(r.data.has(_o)).to.be.true
    expect(r.error).to.be.undefined
  })

  it('Array', () => {
    const r0 = add([], 2)
    expect(r0.data[0]).to.eq(2)
    expect(r0.error).to.be.undefined

    const r1 = add(new Uint8Array(), 2)
    expect(r1.data[0]).to.eq(2)
    expect(r1.error).to.be.undefined
  })

  it('not undefined', () => {
    const r = add(undefined, 2)
    expect(r.data).to.be.undefined
    expect(r.error).not.not.be.undefined
  })
})
