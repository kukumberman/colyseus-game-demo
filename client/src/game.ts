import { GameScene } from "./scenes/GameScene"

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
        selectedSkin: "todo",
      }),
    ],
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
  })
}
