import { Shield } from '../types'
import { EventEmitter } from 'events';

export abstract class Slave<GossipType extends Shield.KeyValueMap = Shield.KeyValueMap> extends EventEmitter {
  constructor() {
    super()
    global.process.on('message', this.onMessage.bind(this))
    this.on("end", this.onEnd.bind(this))
  }

  onEnd(msg: Shield.Message<GossipType>) {
    process.send&&process.send(msg)
  }

  onMessage(msg: Shield.Message<GossipType>) {
    
  }
}
