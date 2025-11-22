import React from "react"
import { createRoot } from "react-dom/client"
import "./styles/globals.css"

function Popup() {
  return (
    <div className="w-[300px] h-[200px] flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <img src={chrome.runtime.getURL('logo.png')} alt="Junting Orbit" className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Open Side Panel</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Junting Orbit now lives in the side panel for a better experience.
      </p>
      <button 
        onClick={() => chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })}
        className="text-xs text-primary hover:underline"
      >
        Open Side Panel
      </button>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  )
}
