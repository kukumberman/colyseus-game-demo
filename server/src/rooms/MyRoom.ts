import { Room, Client } from "colyseus"
import { MyRoomState, Player } from "@shared/schemas"

const mapSize = {
  width: 800,
  height: 600,
}

export class MyRoom extends Room<MyRoomState> {
  onCreate(options: any) {
    this.setState(new MyRoomState())
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!")

    const player = new Player()

    // todo: validate incoming skin
    player.skin = options.skin

    player.x = Math.random() * mapSize.width
    player.y = Math.random() * mapSize.height

    this.state.players.set(client.sessionId, player)
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!")
    this.state.players.delete(client.sessionId)
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...")
  }
}
