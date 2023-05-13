import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./App.tsx"

const element = document.getElementById("app") as HTMLElement
ReactDOM.createRoot(element).render(
  <React.StrictMode>
    <App element={element} />
  </React.StrictMode>
)
