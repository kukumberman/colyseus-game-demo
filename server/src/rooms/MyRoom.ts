import { Room, Client } from "colyseus"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"

const mapSize = {
  width: 800,
  height: 600,
}

const maxAllowedPing = 200

export class MyRoom extends Room<MyRoomState> {
  private pingIntervalId!: NodeJS.Timer

  onCreate(options: any) {
    this.setState(new MyRoomState())

    this.onMessage(MessageType.Pong, this.pongMessageHandler.bind(this))

    this.pingIntervalId = setInterval(() => this.sendPingMessage(), 1 * 1000)
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
    clearInterval(this.pingIntervalId)
  }

  private pongMessageHandler(client: Client) {
    const player = this.state.players.get(client.sessionId)!
    const ping = Date.now() - player.lastPingTimestamp
    if (ping > maxAllowedPing) {
      client.leave(RoomLeaveCode.MaxPingReached)
    }
    player.ping = ping
  }

  private sendPingMessage() {
    this.clients.forEach((client) => {
      const player = this.state.players.get(client.sessionId)!
      player.lastPingTimestamp = Date.now()
      client.send(MessageType.Ping)
    })
  }
}
