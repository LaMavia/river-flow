import * as Shield from '../src'
import "./slave"
export interface Gossip {
  name: string
}

const master = new Shield.Master<Gossip>()
master.enslave('GET', '/', ({req, res}) => {
  res.write('Hello!')
  return {
    data: {
      cat: ''
    },
    continue: false,
  }
})
master.listen(8000)