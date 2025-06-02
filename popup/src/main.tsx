// popup/src/main.tsx (updated stub)
if (!window.chrome) {
  ;(window as any).chrome = {}
}
if (!window.chrome.runtime) {
  ;(window as any).chrome.runtime = {}
}
if (!window.chrome.runtime.sendMessage) {
  // @ts-ignore: we know we're overriding the Chrome API for dev-mode mocking
  window.chrome.runtime.sendMessage = (
    _msg: any,
    callback: (resp: any) => void
  ) => {
    // parse ?status= from the browser’s address bar
    const urlParams = new URLSearchParams(window.location.search)
    const s = urlParams.get('status') || 'idle'

    let fakeResponse
    switch (s) {
      case 'in-progress':
        fakeResponse = {
          trackedTabId: 123,
          status: 'in-progress' as const,
          trackedUrl: 'https://claude.ai/whatever'
        }
        break
      case 'done':
        fakeResponse = {
          trackedTabId: 123,
          status: 'done' as const,
          trackedUrl: 'https://claude.ai/whatever'
        }
        break
      default:
        fakeResponse = {
          trackedTabId: null,
          status: 'idle' as const,
          trackedUrl: ''
        }
    }
    // invoke the callback with our fake data
    callback(fakeResponse)
  }
}
// (mock chrome.tabs.update too—same as before)
if (!window.chrome.tabs) {
  ;(window as any).chrome.tabs = {
    update: (_tabId: number, _obj: any) => {
      alert(`Would have switched to tab ${_tabId}`)
    }
  }
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
