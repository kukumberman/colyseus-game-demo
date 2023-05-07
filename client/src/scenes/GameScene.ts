import Phaser from "phaser"
import { Client, Room } from "colyseus.js"
import { MyRoomState, Player } from "@shared/schemas"

export type GameSceneProps = {
  selectedSkin: string
}

type PlayerEntity = Phaser.GameObjects.Image

export class GameScene extends Phaser.Scene {
  private client!: Client
  private room!: Room<MyRoomState>

  private playerEntities: Map<string, PlayerEntity> = new Map()

  public constructor(private readonly props: GameSceneProps) {
    super(GameScene.name)
  }

  async create() {
    this.client = new Client("ws://localhost:2567")
    console.log("Joining room...")
    this.room = await this.client.joinOrCreate("my_room", { skin: this.props.selectedSkin })
    console.log("Joined successfully!")

    this.room.state.players.onAdd(this.onPlayerAdded.bind(this))
    this.room.state.players.onRemove(this.onPlayerRemoved.bind(this))
  }

  private onPlayerAdded(player: Player, sessionId: string) {
    const entity = this.add.image(player.x, player.y, player.skin)
    this.playerEntities.set(sessionId, entity)
  }

  // @ts-ignore
  private onPlayerRemoved(player: Player, sessionId: string) {
    const entity = this.playerEntities.get(sessionId)
    if (entity !== undefined) {
      entity.destroy()
      this.playerEntities.delete(sessionId)
    }
  }
}
