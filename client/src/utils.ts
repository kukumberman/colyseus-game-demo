import { Room } from "colyseus.js"

export async function sendAsync<T>(
  room: Room,
  type: string | number,
  body?: any,
  timeout: number = 1000
): Promise<T> {
  let remove: () => void

  const promise = new Promise<T>((resolve, _) => {
    remove = room.onMessage(type, async (message: T) => {
      remove()
      resolve(message as T)
    })
    room.send(type, body)
  })

  if (timeout > 0) {
    let rejectTimeoutId
    const signal = new Promise<T>((_, reject) => {
      rejectTimeoutId = setTimeout(() => {
        remove()
        reject("Timeout")
      }, timeout)
    })
    await Promise.race([signal, promise])
    clearTimeout(rejectTimeoutId)
  }

  return promise
}
