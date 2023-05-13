import React, { useEffect, useRef, useState } from "react"
import Phaser from "phaser"
import { mount } from "./game"

type AppProps = {
  element: HTMLElement
}

export function App(props: AppProps) {
  const [count, setCount] = useState(0)
  const [fullscreenSupported, setFullscreenSupported] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const ref = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (ref.current === null) {
      const game = mount(props.element)
      ref.current = game
      setFullscreenSupported(game.scale.fullscreen.available)
    }
  }, [])

  function onClickToggleFullscreen() {
    const game = ref.current!
    setFullscreen(!game.scale.isFullscreen)
    if (game.scale.isFullscreen) {
      game.scale.stopFullscreen()
    } else {
      game.scale.startFullscreen()
    }
  }

  return (
    <React.Fragment>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
        }}
      >
        <div>Count: {count}</div>
        <div>
          <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
        </div>
        {fullscreenSupported ? (
          <div>
            <button onClick={onClickToggleFullscreen}>
              {fullscreen ? "Minimize" : "Fullscreen"}
            </button>
          </div>
        ) : null}
      </div>
    </React.Fragment>
  )
}
