import * as Shield from '../dist'
import "./slave"
export interface DataType {
  name: string
}

const master = new Shield.Master<DataType>()
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