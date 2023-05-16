import { Room, Client } from "colyseus"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"
import { config } from "../config"
import { NameSanitizer, SkinSanitizer } from "../core/validation"

export class MyRoom extends Room<MyRoomState> {
  private fixedTimeStep: number = 0
  private elapsedTime: number = 0
  private pingIntervalId!: NodeJS.Timer
  private nameValidator!: NameSanitizer
  private skinValidator!: SkinSanitizer

  onCreate(options: any) {
    this.setState(new MyRoomState())
    this.state.elapsedTime = 0
    this.fixedTimeStep = 1000 / config.fixedSimulationTickRate

    this.onMessage(MessageType.Input, this.inputMessageHandler.bind(this))
    this.onMessage(MessageType.Rotation, this.rotationMessageHandler.bind(this))
    this.onMessage(MessageType.Pong, this.pongMessageHandler.bind(this))
    this.onMessage(MessageType.FetchConfig, (client) => {
      client.send(MessageType.FetchConfig, config)
    })

    this.pingIntervalId = setInterval(() => this.sendPingMessage(), 1 * 1000)
    this.setSimulationInterval(this.simulationIntervalHandler.bind(this))
    this.setPatchRate(1000 / config.patchRate)

    this.nameValidator = new NameSanitizer("I'm Gay", 16)
    this.skinValidator = new SkinSanitizer(config.skins[0], config.skins)
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!")

    const player = new Player()
    player.sessionId = client.sessionId

    player.skin = this.skinValidator.sanitize(options.skin)
    player.name = this.nameValidator.sanitize(options.name)

    player.x = Math.random() * config.mapSize.width
    player.y = Math.random() * config.mapSize.height
    player.angle = 0
    player.ping = 0
    player.lastPingTimestamp = Date.now()
    player.lastPingResponseTimestamp = player.lastPingTimestamp

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
    player.lastPingResponseTimestamp = Date.now()
    const ping = player.lastPingResponseTimestamp - player.lastPingTimestamp
    if (ping > config.maxAllowedPing) {
      client.send(MessageType.MaxPingReached, ping)
    }
    player.ping = ping
  }

  private sendPingMessage() {
    this.clients.forEach((client) => {
      const player = this.state.players.get(client.sessionId)!
      player.lastPingTimestamp = Date.now()
      client.send(MessageType.Ping)
    })

    this.tryRemoveInactiveClients()
  }

  private simulationIntervalHandler(deltaTime: number) {
    this.elapsedTime += deltaTime
    this.state.elapsedTime += deltaTime / 1000

    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep
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

  private tryRemoveInactiveClients() {
    this.clients.forEach((client) => {
      const player = this.state.players.get(client.sessionId)!
      const timeDifference = Date.now() - player.lastPingResponseTimestamp
      if (timeDifference > config.pingResponseMaxTime) {
        client.leave(RoomLeaveCode.MaxPingReached)
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
