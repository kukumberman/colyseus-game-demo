import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RoomAvailable } from "colyseus.js"
import { useAppContext } from "../main"
import { fetchConfigAsync } from "../colyseus"
import { RoomLinkView } from "./RoomLinkView"
import { SkinSelectorView } from "./SkinSelectorView"
import { ServerConfig } from "@shared/types"

type LobbyViewProps = {
  roomName: string
}

export function LobbyView(props: LobbyViewProps) {
  const NAME_KEY = "name"
  const SKIN_KEY = "skin"

  const [searchParams, setSearchParams] = useSearchParams({
    [NAME_KEY]: "Anonymous",
    [SKIN_KEY]: "",
  })

  const searchParamsAsObject = Object.fromEntries(Array.from(searchParams.entries()))
  const { name } = searchParamsAsObject

  const [config, setConfig] = useState<ServerConfig>()
  const [rooms, setRooms] = useState<RoomAvailable[]>([])
  const [error, setError] = useState<Error>()
  const navigate = useNavigate()

  const { client } = useAppContext()

  // todo
  // use state machine
  // if config fetch failed and error is not aborted - display message (propably server is not running) and retry button
  // if config fetch is success - retry room list fetch automatically with 1 second interval

  useEffect(() => {
    const abortController = new AbortController()
    fetchConfigAndModifyState(abortController.signal)
    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const fetchAvailableRoomsAsync = async () => {
      try {
        const rooms = await client.getAvailableRooms(props.roomName)
        setRooms(rooms)
      } catch (e: unknown) {
        console.log("Failed to fetch available rooms")
        if (e instanceof Error) {
          console.log(e.name)
        }
        console.error(e)
      }
    }

    if (config !== undefined) {
      fetchAvailableRoomsAsync()
    }

    return () => {
      // AbortController is not supported in colyseus client
    }
  }, [config])

  async function fetchConfigAndModifyState(signal?: AbortSignal) {
    try {
      const data = await fetchConfigAsync(signal)
      return setConfig(data)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== "AbortError") {
          setError(error)
        }
      }
    }
  }

  function setName(value: string) {
    setSearchParams({ ...searchParamsAsObject, [NAME_KEY]: value })
  }

  function setSkin(value: string) {
    setSearchParams({ ...searchParamsAsObject, [SKIN_KEY]: value })
  }

  function onSkinSelectorChanged(skinIndex: number) {
    setSkin(skinIndex.toString())
  }

  function createHrefWithId(id: string) {
    const value = `/room/${id}`

    if (searchParams.size > 0) {
      return value + `?${searchParams.toString()}`
    }

    return value
  }

  function roomList() {
    return (
      <div>
        <ul>
          {rooms.map((room) => (
            <RoomLinkView
              key={room.roomId}
              room={room}
              href={createHrefWithId(room.roomId)}
            />
          ))}
        </ul>
      </div>
    )
  }

  function emptyRoomList() {
    return <div>No rooms found</div>
  }

  function displayConnected() {
    return (
      <div>
        <div>Name</div>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <SkinSelectorView
          length={config!.skins.length}
          onChanged={onSkinSelectorChanged}
          imagePathResolver={(skinIndex) => `/assets/${config!.skins[skinIndex]}.png`}
        />
        {rooms.length > 0 ? roomList() : emptyRoomList()}
        <button
          onClick={() => {
            navigate(createHrefWithId("joinOrCreate"))
          }}
        >
          joinOrCreate
        </button>
      </div>
    )
  }

  function displayRetry() {
    return (
      <div>
        <div>
          {error!.name} - {error!.message}
        </div>
        <button onClick={() => fetchConfigAndModifyState()}>Retry</button>
      </div>
    )
  }

  function displayContents() {
    return (
      <>
        <h1>Welcome</h1>
        <div>Lobby</div>
        {config !== undefined ? displayConnected() : <div>Not connected</div>}
        {config === undefined && error !== undefined ? displayRetry() : null}
      </>
    )
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 500,
            backgroundColor: "white",
            pointerEvents: "all",
          }}
        >
          {displayContents()}
        </div>
      </div>
    </div>
  )
}
