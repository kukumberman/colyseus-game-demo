import { MapSchema, Schema, type } from "@colyseus/schema"

export class Player extends Schema {
  @type("float32") x: number
  @type("float32") y: number
  @type("float32") angle: number
  @type("string") skin: string
  @type("uint16") ping: number

  lastPingTimestamp: number
  inputQueue: any[] = []
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>()
}
