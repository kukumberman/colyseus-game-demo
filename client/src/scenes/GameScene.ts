import Phaser from "phaser"
import { Client, Room } from "colyseus.js"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"
import { ServerConfig } from "@shared/types"
import { sendAsync } from "../utils"

// client side config
const config = {
  moveInterpolationFactor: 0.7, // [0..1]
  rotateInterpolationFactor: 20, // [0..360]
  gizmos: {
    forwardLineRadius: 50,
    lineWidth: 1,
    colors: {
      localPlayerLocalState: 0x00ff00,
      localPlayerServerState: 0xff0000,
      remotePlayerServerState: 0xff00ff,
      remotePlayerInterpolatedState: 0x0000ff,
    },
  },
}

function imageSkinPathResolver(id: string) {
  return `/assets/${id}.png`
}

export type GameSceneProps = {
  speedHackEnabled: boolean
  nogizmos: boolean
}

type PlayerEntity = Phaser.GameObjects.Image

export class GameScene extends Phaser.Scene {
  private room!: Room<MyRoomState> | undefined
  private serverConfig!: ServerConfig | undefined

  private playerEntities: Map<string, PlayerEntity> = new Map()
  private localPlayer!: PlayerEntity | undefined
  private rect!: Phaser.GameObjects.Rectangle | undefined

  private elapsedTime: number = 0
  private fixedTimeStep: number = 1000 / 60
  private debugText!: Phaser.GameObjects.Text
  private graphics!: Phaser.GameObjects.Graphics

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys
  private readonly inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  }

  public constructor(private readonly props: GameSceneProps) {
    super(GameScene.name)
  }

  create() {
    this.game.events.on("FOOBAR", this.initialize, this)

    this.cursorKeys = this.input.keyboard!.createCursorKeys()
  }

  // @ts-ignore
  update(time: number, delta: number): void {
    if (!this.room || !this.localPlayer || !this.serverConfig) {
      return
    }

    this.elapsedTime += delta
    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep
      this.fixedTick()
    }

    this.rotateLocalPlayer()
    this.movePlayers()

    this.drawText()

    if (!this.props.nogizmos) {
      this.drawGizmos()
    }
  }

  // @ts-ignore
  private async initialize(client: Client, room: Room, serverConfig: ServerConfig) {
    // @ts-ignore
    window.room = room

    this.debugText = this.add.text(0, 0, "debug", { fontSize: 30, color: "white" })
    this.debugText.depth = 100
    this.graphics = this.add.graphics()
    this.graphics.depth = 50

    console.log(client, room, serverConfig)

    this.room = room
    this.serverConfig = serverConfig
    this.listenRoomEvents()

    await this.fetchConfigAndPrepareMap()

    this.serverConfig.skins.forEach((id) => {
      this.load.image(id, imageSkinPathResolver(id))
    })

    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      Array.from(this.playerEntities.entries()).forEach(([sessionId, entity]) => {
        const player = this.room!.state.players.get(sessionId)!
        entity.setTexture(player.skin)
      })
    })

    this.load.start()
  }

  private dispose() {
    this.serverConfig = undefined
    this.room = undefined
    this.localPlayer = undefined

    this.debugText.destroy()
    this.graphics.destroy()

    Array.from(this.playerEntities.values()).forEach((entity) => entity.destroy())
    this.playerEntities.clear()

    if (this.rect !== undefined) {
      this.rect.destroy()
      this.rect = undefined
    }

    this.elapsedTime = 0
  }

  private listenRoomEvents() {
    if (this.room === undefined) {
      return
    }
    this.room.onError(this.onRoomError.bind(this))
    this.room.onLeave(this.onRoomLeave.bind(this))

    this.room.onMessage(MessageType.Ping, this.messageHandler_Ping.bind(this))
    this.room.onMessage(MessageType.MaxPingReached, this.messageHandler_MaxPingReached.bind(this))

    this.room.state.players.onAdd(this.onPlayerAdded.bind(this))
    this.room.state.players.onRemove(this.onPlayerRemoved.bind(this))
  }

  private async fetchConfigAndPrepareMap() {
    this.serverConfig = await sendAsync(this.room!, MessageType.FetchConfig)

    const { width, height } = this.serverConfig!.mapSize

    this.rect = this.add.rectangle(0, 0, width, height, 0xa4a4a4).setOrigin(0, 0)
    this.rect.depth = -1
  }

  private onRoomError(code: number, reason?: string) {
    alert(`error: ${code} ${reason}`)
  }

  private onRoomLeave(code: number) {
    if (code === RoomLeaveCode.AbnormalClosure) {
      window.location.reload()
    } else {
      this.dispose()
      const reason = RoomLeaveCode[code]
      console.log(`leave: ${code} ${reason}`)
    }
  }

  private onPlayerAdded(player: Player, sessionId: string) {
    const entity = this.add.image(player.x, player.y, player.skin)
    this.playerEntities.set(sessionId, entity)

    if (this.room!.sessionId === sessionId) {
      this.localPlayer = entity
      this.localPlayer.depth = 20
    }

    entity.setData("serverX", player.x)
    entity.setData("serverY", player.y)
    entity.setData("serverAngle", player.angle)
    entity.setData("ping", player.ping)

    player.listen("ping", (value: number) => {
      entity.setData("ping", value)
    })

    player.onChange(() => {
      entity.setData("serverX", player.x)
      entity.setData("serverY", player.y)
      entity.setData("serverAngle", player.angle)
    })
  }

  // @ts-ignore
  private onPlayerRemoved(player: Player, sessionId: string) {
    const entity = this.playerEntities.get(sessionId)
    if (entity !== undefined) {
      entity.destroy()
      this.playerEntities.delete(sessionId)
    }
  }

  private messageHandler_Ping() {
    this.room!.send(MessageType.Pong)
  }

  private messageHandler_MaxPingReached(ping: number) {
    console.warn(MessageType.MaxPingReached, ping)
  }

  private drawText() {
    let text = ""
    text += `Time: ${this.room!.state.elapsedTime.toFixed(2)}` + "\n"

    Array.from(this.playerEntities.keys()).forEach((sessionId: string, index: number) => {
      const entity = this.playerEntities.get(sessionId)!
      const ping = entity.data.values.ping
      text += `${index + 1}: ${sessionId} (${ping} ms)`
      if (this.room!.sessionId === sessionId) {
        text += ` (You)`
      }
      text += "\n"
    })

    this.debugText.text = text
  }

  private drawGizmos() {
    this.graphics.clear()

    let angle = 0

    for (const [sessionId, entity] of this.playerEntities) {
      const { serverX, serverY, serverAngle } = entity.data.values

      const isMe = sessionId === this.room!.sessionId

      const colorServerState = isMe
        ? config.gizmos.colors.localPlayerServerState
        : config.gizmos.colors.remotePlayerServerState
      const colorLocalState = isMe
        ? config.gizmos.colors.localPlayerLocalState
        : config.gizmos.colors.remotePlayerInterpolatedState

      this.graphics.lineStyle(config.gizmos.lineWidth, colorServerState)
      this.graphics.strokeRect(
        serverX - entity.width * 0.5,
        serverY - entity.height * 0.5,
        entity.width,
        entity.height
      )
      angle = serverAngle * Phaser.Math.DEG_TO_RAD
      this.graphics.lineBetween(
        serverX,
        serverY,
        serverX + Math.sin(-angle) * config.gizmos.forwardLineRadius,
        serverY + Math.cos(-angle) * config.gizmos.forwardLineRadius
      )

      this.graphics.lineStyle(config.gizmos.lineWidth, colorLocalState)
      this.graphics.strokeRect(
        entity.x - entity.width * 0.5,
        entity.y - entity.height * 0.5,
        entity.width,
        entity.height
      )
      angle = entity.angle * Phaser.Math.DEG_TO_RAD
      this.graphics.lineBetween(
        entity.x,
        entity.y,
        entity.x + Math.sin(-angle) * config.gizmos.forwardLineRadius,
        entity.y + Math.cos(-angle) * config.gizmos.forwardLineRadius
      )
    }
  }

  private fixedTick(): void {
    this.inputPayload.left = this.cursorKeys.left.isDown
    this.inputPayload.right = this.cursorKeys.right.isDown
    this.inputPayload.up = this.cursorKeys.up.isDown
    this.inputPayload.down = this.cursorKeys.down.isDown

    //! hacking - malicious code?
    if (this.props.speedHackEnabled) {
      for (let index = 0; index < 5; index++) {
        this.moveLocalPlayer()
      }
    }

    this.moveLocalPlayer()
  }

  private moveLocalPlayer() {
    const velocity = this.serverConfig!.player.velocity
    const localPlayer = this.localPlayer!

    this.room!.send(MessageType.Input, this.inputPayload)

    if (this.inputPayload.left) {
      localPlayer.x -= velocity
    } else if (this.inputPayload.right) {
      localPlayer.x += velocity
    }

    if (this.inputPayload.up) {
      localPlayer.y -= velocity
    } else if (this.inputPayload.down) {
      localPlayer.y += velocity
    }
  }

  private rotateLocalPlayer() {
    const localPlayer = this.localPlayer!
    const pointer = this.input.activePointer
    const direction = new Phaser.Math.Vector2(pointer.worldX, pointer.worldY)
      .subtract(localPlayer)
      .normalize()

    const angle = Phaser.Math.Angle.WrapDegrees(
      Math.atan2(direction.y, direction.x) * Phaser.Math.RAD_TO_DEG - 90
    )
    localPlayer.angle = angle
    this.room!.send(MessageType.Rotation, angle)
  }

  private movePlayers() {
    for (const [sessionId, entity] of this.playerEntities) {
      if (sessionId === this.room!.sessionId) {
        continue
      }
      const { serverX, serverY, serverAngle } = entity.data.values
      entity.x = Phaser.Math.Linear(entity.x, serverX, config.moveInterpolationFactor)
      entity.y = Phaser.Math.Linear(entity.y, serverY, config.moveInterpolationFactor)
      entity.angle =
        Phaser.Math.Angle.RotateTo(
          entity.angle * Phaser.Math.DEG_TO_RAD,
          serverAngle * Phaser.Math.DEG_TO_RAD,
          config.rotateInterpolationFactor * Phaser.Math.DEG_TO_RAD
        ) * Phaser.Math.RAD_TO_DEG
    }
  }
}
