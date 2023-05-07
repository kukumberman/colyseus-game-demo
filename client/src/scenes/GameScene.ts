import Phaser from "phaser"
import { Client, Room } from "colyseus.js"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"

// todo: fetch config from server
const velocity = 2

// client side config
const moveInterpolationFactor = 0.2

const config = {
  colors: {
    localPlayerLocalState: 0x00ff00,
    localPlayerServerState: 0xff0000,
    remotePlayerServerState: 0xff00ff,
    remotePlayerInterpolatedState: 0x0000ff,
  },
}

function imageSkinPathResolver(id: string) {
  return `/assets/${id}.png`
}

export type GameSceneProps = {
  selectedSkin: string
  skins: string[]
  speedHackEnabled: boolean
}

type PlayerEntity = Phaser.GameObjects.Image

export class GameScene extends Phaser.Scene {
  private client!: Client
  private room!: Room<MyRoomState>

  private playerEntities: Map<string, PlayerEntity> = new Map()

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

  private localPlayer!: PlayerEntity

  public constructor(private readonly props: GameSceneProps) {
    super(GameScene.name)
  }

  preload() {
    this.props.skins.forEach((id) => {
      this.load.image(id, imageSkinPathResolver(id))
    })
  }

  async create() {
    this.cursorKeys = this.input.keyboard!.createCursorKeys()
    this.debugText = this.add.text(0, 0, "debug", { fontSize: 30, color: "white" })
    this.debugText.depth = 100
    this.graphics = this.add.graphics()
    this.graphics.depth = 50

    this.client = new Client("ws://localhost:2567")
    console.log("Joining room...")
    this.room = await this.client.joinOrCreate("my_room", { skin: this.props.selectedSkin })
    console.log("Joined successfully!")

    this.room.onError(this.onRoomError.bind(this))
    this.room.onLeave(this.onRoomLeave.bind(this))

    this.room.onMessage(MessageType.Ping, this.pingMessageHandler.bind(this))
    this.room.state.players.onAdd(this.onPlayerAdded.bind(this))
    this.room.state.players.onRemove(this.onPlayerRemoved.bind(this))
  }

  // @ts-ignore
  update(time: number, delta: number): void {
    if (!this.room || !this.localPlayer) {
      return
    }

    this.elapsedTime += delta
    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep
      this.fixedTick()
    }

    this.movePlayers()

    this.drawText()
    this.drawGizmos()
  }

  private onRoomError(code: number, reason?: string) {
    alert(`error: ${code} ${reason}`)
  }

  private onRoomLeave(code: number) {
    if (code === RoomLeaveCode.AbnormalClosure) {
      window.location.reload()
    } else {
      const reason = RoomLeaveCode[code]
      alert(`leave: ${code} ${reason}`)
      window.location.reload()
    }
  }

  private onPlayerAdded(player: Player, sessionId: string) {
    const entity = this.add.image(player.x, player.y, player.skin)
    this.playerEntities.set(sessionId, entity)

    if (this.room.sessionId === sessionId) {
      this.localPlayer = entity
      this.localPlayer.depth = 20
    }

    entity.setData("ping", 0)

    player.listen("ping", (value: number) => {
      entity.setData("ping", value)
    })

    player.onChange(() => {
      entity.setData("serverX", player.x)
      entity.setData("serverY", player.y)
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

  private pingMessageHandler() {
    this.room.send(MessageType.Pong)
  }

  private drawText() {
    let text = ""

    Array.from(this.playerEntities.keys()).forEach((sessionId: string, index: number) => {
      const entity = this.playerEntities.get(sessionId)!
      const ping = entity.data.values.ping
      text += `${index + 1}: ${sessionId} (${ping} ms)`
      if (this.room.sessionId === sessionId) {
        text += ` (You)`
      }
      text += "\n"
    })

    this.debugText.text = text
  }

  private drawGizmos() {
    this.graphics.clear()

    for (const [sessionId, entity] of this.playerEntities) {
      const { serverX, serverY } = entity.data.values

      if (sessionId === this.room.sessionId) {
        this.graphics.lineStyle(1, config.colors.localPlayerServerState)
        this.graphics.strokeRect(
          serverX - entity.width * 0.5,
          serverY - entity.height * 0.5,
          entity.width,
          entity.height
        )

        this.graphics.lineStyle(1, config.colors.localPlayerLocalState)
        this.graphics.strokeRect(
          entity.x - entity.width * 0.5,
          entity.y - entity.height * 0.5,
          entity.width,
          entity.height
        )
        continue
      }

      this.graphics.lineStyle(1, config.colors.remotePlayerServerState)
      this.graphics.strokeRect(
        serverX - entity.width * 0.5,
        serverY - entity.height * 0.5,
        entity.width,
        entity.height
      )

      this.graphics.lineStyle(1, config.colors.remotePlayerInterpolatedState)
      this.graphics.strokeRect(
        entity.x - entity.width * 0.5,
        entity.y - entity.height * 0.5,
        entity.width,
        entity.height
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
    this.room.send(MessageType.Input, this.inputPayload)

    if (this.inputPayload.left) {
      this.localPlayer.x -= velocity
    } else if (this.inputPayload.right) {
      this.localPlayer.x += velocity
    }

    if (this.inputPayload.up) {
      this.localPlayer.y -= velocity
    } else if (this.inputPayload.down) {
      this.localPlayer.y += velocity
    }
  }

  private movePlayers() {
    for (const [sessionId, entity] of this.playerEntities) {
      if (sessionId === this.room.sessionId) {
        continue
      }
      const { serverX, serverY } = entity.data.values
      entity.x = Phaser.Math.Linear(entity.x, serverX, moveInterpolationFactor)
      entity.y = Phaser.Math.Linear(entity.y, serverY, moveInterpolationFactor)
    }
  }
}
