import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useAppContext } from "../main"

export function GameView() {
  const { game } = useAppContext()
  const [fullscreenSupported, setFullscreenSupported] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (game !== undefined) {
      setFullscreenSupported(game.scale.fullscreen.available)
    }
  }, [game])

  function onClickToggleFullscreen() {
    if (game === undefined) {
      return
    }
    setFullscreen(!game.scale.isFullscreen)
    if (game.scale.isFullscreen) {
      game.scale.stopFullscreen()
    } else {
      game.scale.startFullscreen()
    }
  }

  function overlay() {
    return (
      <>
        {fullscreenSupported ? (
          <div>
            <button onClick={onClickToggleFullscreen}>
              {fullscreen ? "Minimize" : "Fullscreen"}
            </button>
          </div>
        ) : null}
        <Outlet />
      </>
    )
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        backgroundColor: "white",
      }}
    >
      {overlay()}
    </div>
  )
}
