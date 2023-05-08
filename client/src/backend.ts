function remote() {
  const { protocol, hostname, port } = window.location
  return `${protocol.replace("http", "ws")}//${hostname}${port && `:${port}`}`
}

export const BACKEND_WS_URL =
  window.location.href.indexOf("localhost") === -1 ? remote() : "ws://localhost:2567"

export const BACKEND_HTTP_URL = BACKEND_WS_URL.replace("ws", "http")
