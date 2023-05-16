import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RoomAvailable } from "colyseus.js"
import { useAppContext } from "../main"
import { fetchConfigAsync } from "../colyseus"
import { RoomLinkView } from "./RoomLinkView"
import { SkinSelectorView } from "./SkinSelectorView"
import { ServerConfig } from "@shared/types"
import { resolveWithMinimumDelay } from "../utils"

type LobbyViewProps = {
  roomName: string
  loadMininumDelay: number
  roomListRefreshRateInSeconds: number
}

export function LobbyView(props: LobbyViewProps) {
  const NAME_KEY = "name"
  const SKIN_KEY = "skin"

  const [searchParams, setSearchParams] = useSearchParams({
    [NAME_KEY]: "Anonymous",
    [SKIN_KEY]: "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [config, setConfig] = useState<ServerConfig>()
  const [error, setError] = useState<Error>()

  const searchParamsAsObject = Object.fromEntries(Array.from(searchParams.entries()))
  const { name } = searchParamsAsObject

  useEffect(() => {
    const abortController = new AbortController()
    fetchConfigAndModifyState(abortController.signal)
    return () => {
      abortController.abort()
    }
  }, [])

  async function fetchConfigAndModifyState(signal?: AbortSignal) {
    try {
      setIsLoading(true)
      setError(undefined)
      const data = await resolveWithMinimumDelay(fetchConfigAsync(signal), props.loadMininumDelay)
      setConfig(data)
      setError(undefined)
      setIsLoading(false)
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== "AbortError") {
          setError(error)
          setIsLoading(false)
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

  function displayConnected() {
    const skins = config!.skins
    return (
      <div>
        <div>Name</div>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <SkinSelectorView
          length={skins.length}
          onChanged={onSkinSelectorChanged}
          imagePathResolver={(skinIndex) => `/assets/${skins[skinIndex]}.png`}
        />
        <RoomList
          roomName={props.roomName}
          refreshRateInSeconds={props.roomListRefreshRateInSeconds}
          loadMininumDelay={props.loadMininumDelay}
          createHrefWithId={createHrefWithId}
        />
      </div>
    )
  }

  function displayRetry() {
    function errorMessage() {
      return `${error!.name} - ${error!.message}`
    }

    return (
      <div>
        <div>An error occured when loading ({errorMessage()})</div>
        <button onClick={() => fetchConfigAndModifyState()}>Retry</button>
      </div>
    )
  }

  function displayContents() {
    return (
      <>
        <h1>Welcome</h1>
        {isLoading ? <div>Loading...</div> : null}
        {!isLoading && config !== undefined ? displayConnected() : null}
        {error !== undefined ? displayRetry() : null}
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

type RoomListProps = {
  roomName: string
  refreshRateInSeconds: number
  loadMininumDelay: number
  createHrefWithId: (id: string) => string
}

export function RoomList(props: RoomListProps) {
  const { client } = useAppContext()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomAvailable<any>[]>([])
  const [countdown, setCountdown] = useState(props.refreshRateInSeconds)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => {
      if (!isLoading) {
        const newCountdown = countdown - 1
        if (newCountdown === 0) {
          setIsLoading(true)
        }
        setCountdown(newCountdown)
      }
    }, 1 * 1000)

    return () => {
      clearTimeout(id)
    }
  }, [countdown, isLoading])

  useEffect(() => {
    if (isLoading) {
      resolveWithMinimumDelay(client.getAvailableRooms(props.roomName), props.loadMininumDelay)
        .then((rooms) => {
          setRooms(rooms)
          setIsLoading(false)
          setCountdown(props.refreshRateInSeconds)
        })
        .catch((error: unknown) => {
          setIsLoading(false)
          setCountdown(props.refreshRateInSeconds)
          console.log("error occurred while fetching rooms")
          console.error(error)
        })
    }
  }, [isLoading])

  function roomList(rooms: RoomAvailable<any>[]) {
    return (
      <ul>
        {rooms.map((room) => (
          <RoomLinkView
            key={room.roomId}
            room={room}
            href={props.createHrefWithId(room.roomId)}
          />
        ))}
      </ul>
    )
  }

  function emptyRoomList() {
    return <div>No rooms found</div>
  }

  function displayLoading() {
    return <div>Loading...</div>
  }

  function displayCountdown() {
    return <div>Updating in {countdown}</div>
  }

  return (
    <div>
      {isLoading ? displayLoading() : displayCountdown()}
      {rooms.length > 0 ? roomList(rooms) : emptyRoomList()}
      <button
        onClick={() => {
          navigate(props.createHrefWithId("joinOrCreate"))
        }}
      >
        joinOrCreate
      </button>
    </div>
  )
}
