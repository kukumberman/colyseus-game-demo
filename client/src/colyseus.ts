import { Client } from "colyseus.js"
import { BACKEND_HTTP_URL, BACKEND_WS_URL } from "./backend"
import { ServerConfig } from "@shared/types"

export function createClient() {
  return new Client(BACKEND_WS_URL)
}

export async function fetchConfigAsync(signal?: AbortSignal) {
  const response = await fetch(`${BACKEND_HTTP_URL}/config`, { signal })
  const data = await response.json()
  return data as ServerConfig
}
