export type ServerConfig = {
  fixedSimulationTickRate: number
  patchRate: number
  mapSize: {
    width: number
    height: number
  }
  player: {
    velocity: number
  }
  maxAllowedPing: number
  pingResponseMaxTime: number
  skins: string[]
}
