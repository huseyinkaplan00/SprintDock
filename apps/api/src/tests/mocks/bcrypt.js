export async function hash(value) {
  return `hashed:${value}`
}

export async function compare(value, hashedValue) {
  return hashedValue === `hashed:${value}`
}

export default { hash, compare }
