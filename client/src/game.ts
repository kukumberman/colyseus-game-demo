import { GameScene } from "./scenes/GameScene"

const skins = [
  "slightly-smiling-face_1f642",
  "smiling-face-with-sunglasses_1f60e",
  "smiling-face-with-horns_1f608",
]

const urlParams = new URLSearchParams(window.location.search)
const selectedSkin = parseSkin(urlParams.get("skin"))

function parseSkin(value: string | null) {
  if (value === null) {
    return skins[0]
  }

  if (skins.includes(value)) {
    return value
  }

  const index = Number(value)
  if (Number.isNaN(index) || index < 0 || index >= skins.length) {
    return skins[0]
  }

  return skins[index]
}

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
        skins,
        selectedSkin,
      }),
    ],
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
  })
}
