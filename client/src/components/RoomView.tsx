import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Room } from "colyseus.js"
import { MyRoomState, Player } from "@shared/schemas"
import { PlayerListItem } from "./PlayerListItem"
import { useAppContext } from "../main"

type RoomViewProps = {
  roomName: string
}

export function RoomView(props: RoomViewProps) {
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(window.location.search)
  const [currentRoom, setCurrentRoom] = useState<Room<MyRoomState> | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const { client, game } = useAppContext()

  const searchParamsAsObject = Object.fromEntries(Array.from(searchParams.entries()))

  const { id } = useParams()
  const roomId = id!

  useEffect(() => {
    // try to connect to room with given id
    // if room does not exist then navigate to root page

    const options = searchParamsAsObject

    const dt = Date.now() % 1000

    let room: Room | undefined

    const joinByIdAsync = async (roomId: string) => {
      try {
        console.log("Joining room...", dt)
        room = await client.joinById(roomId, options)
        console.log("Joined room!", dt, room)
        setCurrentRoom(room)
      } catch (e: unknown) {
        console.log("Failed to join room by id", dt)
        console.error(e)
        onJoinFailed()
      }
    }

    const joinOrCreateAsync = async (roomName: string) => {
      try {
        console.log("Creating room...", dt)
        room = await client.joinOrCreate(roomName, options)
        console.log("Created room!", dt, room)
        setCurrentRoom(room)
        // todo: replace part of url with room id
      } catch (e: unknown) {
        console.log("Failed to create room", dt)
        console.error(e)
        onCreateFailed()
      }
    }

    let promise = Promise.resolve()

    if (roomId === "joinOrCreate") {
      promise = promise.then(() => joinOrCreateAsync(props.roomName))
    } else {
      promise = promise.then(() => joinByIdAsync(roomId))
    }

    const cleanup = () => {
      if (room !== undefined) {
        console.log("closing room", dt)
        room.leave()
      }
    }

    return () => {
      promise = promise.then(cleanup)
    }
  }, [])

  useEffect(() => {
    let intervalId: NodeJS.Timer

    if (currentRoom !== null) {
      game!.events.emit("FOOBAR", client, currentRoom, null)
      updatePlayerList()
      intervalId = setInterval(updatePlayerList, 1 * 1000)
    }

    return () => {
      clearInterval(intervalId)
    }
  }, [currentRoom])

  function navigateToHome() {
    navigate("/", { replace: true })
  }

  function onJoinFailed() {
    navigateToHome()
  }

  function onCreateFailed() {
    navigateToHome()
  }

  function updatePlayerList() {
    setPlayers(Array.from(currentRoom!.state.players.values()))
  }

  function displayPlayerList() {
    return (
      <div>
        <div>Players: {players.length}</div>
        <ul>
          {players.map((player, index) => (
            <PlayerListItem
              key={player.sessionId}
              index={index}
              player={player}
              isMine={player.sessionId === currentRoom!.sessionId}
            />
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <Link to="/">Home</Link>
      {currentRoom !== null ? <h1>{currentRoom.roomId}</h1> : <div>Joining {roomId} ...</div>}
      {displayPlayerList()}
    </div>
  )
}
