import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { GameView } from "./components/GameView"
import { LobbyView } from "./components/LobbyView"
import { RoomView } from "./components/RoomView"

export function App() {
  const roomName = "my_room"
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<GameView />}
        >
          <Route
            path="/"
            element={<LobbyView roomName={roomName} />}
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
