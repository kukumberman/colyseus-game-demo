import Phaser from "phaser"
import { Client, Room } from "colyseus.js"

export class GameScene extends Phaser.Scene {
  private client!: Client
  private room!: Room

  async create() {
    this.client = new Client("ws://localhost:2567")
    console.log("Joining room...")
    this.room = await this.client.joinOrCreate("my_room")
    console.log("Joined successfully!")
  }
}
