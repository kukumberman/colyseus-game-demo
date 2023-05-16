import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useAppContext } from "../main"

export function GameView() {
  const { game } = useAppContext()
  const [fullscreenSupported, setFullscreenSupported] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  function onEnterFullscreen() {
    setFullscreen(true)
  }

  function onLeaveFullscreen() {
    setFullscreen(false)
  }

  useEffect(() => {
    if (game !== undefined) {
      setFullscreenSupported(game.scale.fullscreen.available)
      game.scale.addListener(Phaser.Scale.Events.ENTER_FULLSCREEN, onEnterFullscreen)
      game.scale.addListener(Phaser.Scale.Events.LEAVE_FULLSCREEN, onLeaveFullscreen)
    }

    return () => {
      if (game !== undefined) {
        game.scale.removeListener(Phaser.Scale.Events.ENTER_FULLSCREEN, onEnterFullscreen)
        game.scale.removeListener(Phaser.Scale.Events.LEAVE_FULLSCREEN, onLeaveFullscreen)
      }
    }
  }, [game])

  function onClickToggleFullscreen() {
    if (game === undefined) {
      return
    }
    if (game.scale.isFullscreen) {
      game.scale.stopFullscreen()
    } else {
      game.scale.startFullscreen()
    }
  }

  function prettyFullscreenText() {
    return fullscreen ? "Minimize" : "Fullscreen"
  }

  function overlay() {
    return (
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
        }}
      >
        {fullscreenSupported ? (
          <div>
            <button
              onClick={onClickToggleFullscreen}
              style={{
                width: 100,
                height: 100,
              }}
            >
              {prettyFullscreenText()}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      {overlay()}
      <Outlet />
    </>
  )
}
