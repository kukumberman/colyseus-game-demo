import Phaser from "phaser"
import { Client, Room } from "colyseus.js"
import { MyRoomState, Player } from "@shared/schemas"
import { MessageType, RoomLeaveCode } from "@shared/enums"

function imageSkinPathResolver(id: string) {
  return `/assets/${id}.png`
}

export type GameSceneProps = {
  selectedSkin: string
  skins: string[]
}

type PlayerEntity = Phaser.GameObjects.Image

export class GameScene extends Phaser.Scene {
  private client!: Client
  private room!: Room<MyRoomState>

  private playerEntities: Map<string, PlayerEntity> = new Map()

  private debugText!: Phaser.GameObjects.Text

  public constructor(private readonly props: GameSceneProps) {
    super(GameScene.name)
  }

  preload() {
    this.props.skins.forEach((id) => {
      this.load.image(id, imageSkinPathResolver(id))
    })
  }

  async create() {
    this.debugText = this.add.text(0, 0, "debug", { fontSize: 30, color: "white" })
    this.debugText.depth = 100

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
    this.drawText()
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

    entity.setData("ping", 0)

    player.listen("ping", (value: number) => {
      entity.setData("ping", value)
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
}
