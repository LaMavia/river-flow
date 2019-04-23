import { Master } from "../src";

export default Master.route(["GET", "/slave", ({ res }) => {
  res.write("Shhhhh!!<br/>It's a secret!")
  return {
    continue: false
  }
}])