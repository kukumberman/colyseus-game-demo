import { MapSchema, Schema, type } from "@colyseus/schema"

export class Player extends Schema {
  @type("string") sessionId!: string
  @type("float32") x!: number
  @type("float32") y!: number
  @type("float32") angle!: number
  @type("string") skin!: string
  @type("string") name!: string
  @type("uint16") ping!: number

  lastPingTimestamp!: number
  lastPingResponseTimestamp!: number
  inputQueue: any[] = []
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>()
  @type("float32") elapsedTime!: number
}
