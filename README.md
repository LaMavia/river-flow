# Laplax
A Node.js http/1.0 multithreaded framework with a basic IPC.

## Features
1. Full intellisense support.
1. Built-in IPC support.

## Getting started
### Installation
The package includes both: module and typings.
`npm install laplax`
### Basic Usage
```javascript
const Laplax = require('laplax')

const m = new Laplax.Master()
m.get('/', ({ req, res }) => {
  res.write('Hello!')
})

m.listen(8000)
```
### More Advanced Routing
```javascript
const { Master, initLogger, sendMessage, Laplax } = require('laplax')

const master = new Master()
master.enslave('GET', '/', async ({ res }) => {
  /* Sends a message to the master process in order to get/update the state */
  const { name } = await sendMessage(process, {
    workerId: process.env['workerId'],
    msgs: [
      {
        type: 'update',
        key: 'name',
        payload: 'Jon Snow',
      }
    ]
  })
  
  res.write(`You know nothing ${name}`)
  return {
    continue: false,
  }
})
master.listen(8000)
```

## Known issues
1. EventEmitter memory leak in sendMessage when overloaded with requests. Event listeners are cleared anyway, so it's not such a big issue.