import Phaser from "phaser"
import { GameScene } from "./scenes/GameScene"

const urlParams = new URLSearchParams(window.location.search)

export function mount(element: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: element,
    fullscreenTarget: element,
    physics: {
      default: "arcade",
    },
    scene: [
      new GameScene({
        speedHackEnabled: urlParams.has("speedhack"),
        nogizmos: urlParams.has("nogizmos"),
      }),
    ],
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
  })
}
