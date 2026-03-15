import { connectRabbit } from '../config/rabbit.js'

export async function loadRabbit() {
  return connectRabbit()
}
