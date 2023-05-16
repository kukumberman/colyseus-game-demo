import { Room } from "colyseus.js"

export function createAbortError() {
  return new DOMException("The user aborted a request.", "AbortError")
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function resolveAfterDelay<T>(value: T, ms: number) {
  await sleep(ms)
  return value
}

export async function resolveWithMinimumDelay<T>(promise: Promise<T>, delay: number) {
  const startedAt = Date.now()
  const data = await promise
  const timeDifference = Date.now() - startedAt
  if (timeDifference > delay) {
    return data
  }
  const remainedDelay = delay - timeDifference
  return resolveAfterDelay(data, remainedDelay)
}

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
