export type ServerConfig = {
  tickRate: number
  mapSize: {
    width: number
    height: number
  }
  player: {
    velocity: number
  }
  maxAllowedPing: number
  skins: string[]
}
