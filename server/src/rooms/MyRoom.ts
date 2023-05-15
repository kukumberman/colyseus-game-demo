import { Room, Client } from "colyseus"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"
import { config } from "../config"

function validateSkin(value: unknown) {
  const defaultSkin = config.skins[0]

  const validateNumber = (valueAsNumber: number) => {
    if (Number.isNaN(valueAsNumber) || !Number.isFinite(valueAsNumber)) {
      return defaultSkin
    }

    if (!Number.isInteger(valueAsNumber)) {
      valueAsNumber = Math.floor(valueAsNumber)
    }

    if (valueAsNumber < 0 || valueAsNumber >= config.skins.length) {
      return defaultSkin
    }

    return config.skins[valueAsNumber]
  }

  if (typeof value === "string") {
    if (config.skins.includes(value)) {
      return value
    }

    const valueAsNumber = Number(value)
    return validateNumber(valueAsNumber)
  }

  if (typeof value === "number") {
    return validateNumber(value)
  }

  return defaultSkin
}

export class MyRoom extends Room<MyRoomState> {
  private fixedTimeStep: number = 0
  private elapsedTime: number = 0
  private pingIntervalId!: NodeJS.Timer

  onCreate(options: any) {
    this.setState(new MyRoomState())
    this.state.elapsedTime = 0
    this.fixedTimeStep = 1000 / config.tickRate

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
    player.sessionId = client.sessionId

    // todo: validate incoming skin and name
    player.skin = validateSkin(options.skin)
    player.name = options.name

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
