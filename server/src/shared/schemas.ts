import { MapSchema, Schema, type } from "@colyseus/schema"

export class Player extends Schema {
  @type("float32") x: number
  @type("float32") y: number
  @type("string") skin: string
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>()
}
