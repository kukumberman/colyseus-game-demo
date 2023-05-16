import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { GameView } from "./components/GameView"
import { LobbyView } from "./components/LobbyView"
import { RoomView } from "./components/RoomView"

type AppProps = {
  basename: string
}

export function App(props: AppProps) {
  const roomName = "my_room"
  return (
    <BrowserRouter basename={props.basename}>
      <Routes>
        <Route
          path="/"
          element={<GameView />}
        >
          <Route
            path="/"
            element={
              <LobbyView
                roomName={roomName}
                loadMininumDelay={1000}
                roomListRefreshRateInSeconds={5}
              />
            }
          />
          <Route
            path="room/:id"
            element={<RoomView roomName={roomName} />}
          />
          <Route
            path="*"
            element={<Navigate to="/" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
