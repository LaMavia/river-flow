import { Shield } from "../types";

export class Slave {
  constructor() {
    process.on("message", this.onMessage)
    NodeJS
  }

  onMessage(data: Shield.Message) {
      
  }
}