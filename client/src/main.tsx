import React, { createContext, useContext, useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App.tsx"
import { mount } from "./game"
import { createClient } from "./colyseus.ts"

const client = createClient()

type AppContextType = {
  game?: Phaser.Game
  client: ReturnType<typeof createClient>
}

const AppContext = createContext<AppContextType>(null!)

export function useAppContext() {
  return useContext(AppContext)
}

function AppContextProvider() {
  const [game, setGame] = useState<Phaser.Game>()

  useEffect(() => {
    const instance = mount(document.body)
    setGame(instance)

    return () => {
      instance.destroy(true)
    }
  }, [])

  return (
    <AppContext.Provider value={{ client, game }}>
      <App />
    </AppContext.Provider>
  )
}

const element = document.getElementById("app") as HTMLElement

ReactDOM.createRoot(element).render(
  <React.StrictMode>
    <AppContextProvider />
  </React.StrictMode>
)
