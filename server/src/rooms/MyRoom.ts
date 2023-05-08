import { Room, Client } from "colyseus"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"
import { ServerConfig } from "@shared/types"

const fixedTimeStep = 1000 / 60

const config: ServerConfig = {
  mapSize: {
    width: 640,
    height: 480,
  },
  player: {
    velocity: 2,
  },
  maxAllowedPing: 200,
}

export class MyRoom extends Room<MyRoomState> {
  private elapsedTime: number = 0
  private pingIntervalId!: NodeJS.Timer

  onCreate(options: any) {
    this.setState(new MyRoomState())
    this.state.elapsedTime = 0

    this.onMessage(MessageType.Input, this.inputMessageHandler.bind(this))
    this.onMessage(MessageType.Rotation, this.rotationMessageHandler.bind(this))
    this.onMessage(MessageType.Pong, this.pongMessageHandler.bind(this))
    this.onMessage(MessageType.FetchConfig, (client) => {
      client.send(MessageType.FetchConfig, config)
    })

    this.pingIntervalId = setInterval(() => this.sendPingMessage(), 1 * 1000)
    this.setSimulationInterval(this.simulationIntervalHandler.bind(this))
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!")

    const player = new Player()

    // todo: validate incoming skin
    player.skin = options.skin

    player.x = Math.random() * config.mapSize.width
    player.y = Math.random() * config.mapSize.height
    player.angle = 0
    player.ping = 0
    player.lastPingTimestamp = Date.now()

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
    if (ping > config.maxAllowedPing) {
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

  private simulationIntervalHandler(deltaTime: number) {
    this.elapsedTime += deltaTime
    this.state.elapsedTime += deltaTime / 1000

    while (this.elapsedTime >= fixedTimeStep) {
      this.elapsedTime -= fixedTimeStep
      this.fixedUpdate()
    }
  }

  private fixedUpdate() {
    this.state.players.forEach((player) => {
      let input: any

      // dequeue player inputs
      while ((input = player.inputQueue.shift())) {
        if (input.left) {
          player.x -= config.player.velocity
        } else if (input.right) {
          player.x += config.player.velocity
        }

        if (input.up) {
          player.y -= config.player.velocity
        } else if (input.down) {
          player.y += config.player.velocity
        }
      }
    })
  }

  private inputMessageHandler(client: Client, input: any) {
    // todo: validate incoming data
    const player = this.state.players.get(client.sessionId)!
    player.inputQueue.push(input)
  }

  private rotationMessageHandler(client: Client, angle: number) {
    // todo: validate incoming data
    const player = this.state.players.get(client.sessionId)!
    player.angle = angle % 360
  }
}
