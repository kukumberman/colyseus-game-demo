import { ServerConfig } from "@shared/types"

export const config: ServerConfig = {
  tickRate: 60,
  mapSize: {
    width: 640,
    height: 480,
  },
  player: {
    velocity: 2,
  },
  maxAllowedPing: 200,
  skins: [
    "slightly-smiling-face_1f642",
    "smiling-face-with-sunglasses_1f60e",
    "smiling-face-with-horns_1f608",
  ],
}
