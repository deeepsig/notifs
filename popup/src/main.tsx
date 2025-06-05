// // popup/src/main.tsx (Development version with Chrome API mocking)
// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'

// // CRITICAL: Set up Chrome API mocks BEFORE any React code runs
// function initializeChromeMocks() {
//   // Only mock if chrome APIs don't exist (development mode)
//   if (typeof window !== 'undefined' && !window.chrome?.runtime) {
//     console.log('🔧 Development mode: Setting up Chrome API mocks')

//     // Ensure chrome object exists
//     if (!window.chrome) {
//       ;(window as any).chrome = {}
//     }

//     // Mock chrome.runtime
//     ;(window as any).chrome.runtime = {
//       sendMessage: (message: any, callback?: (response: any) => void) => {
//         console.log('📤 Mock sendMessage:', message)

//         // Handle different message types
//         if (message.type === 'get-status') {
//           // Parse ?status= from URL for easy testing
//           const urlParams = new URLSearchParams(window.location.search)
//           const status = urlParams.get('status') || 'idle'
//           const service = urlParams.get('service') || 'claude'

//           let fakeResponse
//           switch (status) {
//             case 'in-progress':
//               fakeResponse = {
//                 trackedTabId: 123,
//                 status: 'in-progress' as const,
//                 trackedUrl:
//                   service === 'chatgpt'
//                     ? 'https://chat.openai.com/c/fake-chat-id'
//                     : 'https://claude.ai/chat/fake-chat-id'
//               }
//               break
//             case 'done':
//               fakeResponse = {
//                 trackedTabId: 123,
//                 status: 'done' as const,
//                 trackedUrl:
//                   service === 'chatgpt'
//                     ? 'https://chat.openai.com/c/fake-chat-id'
//                     : 'https://claude.ai/chat/fake-chat-id'
//               }
//               break
//             default:
//               fakeResponse = {
//                 trackedTabId: null,
//                 status: 'idle' as const,
//                 trackedUrl: ''
//               }
//           }

//           console.log('📥 Mock response:', fakeResponse)

//           // Simulate async behavior like real Chrome API
//           setTimeout(() => {
//             if (callback) callback(fakeResponse)
//           }, 50)
//         }

//         return true // Indicate async response
//       }
//     }

//     // Mock chrome.tabs
//     ;(window as any).chrome.tabs = {
//       update: (tabId: number, updateProps: any) => {
//         console.log(
//           `📋 Mock tabs.update: Would switch to tab ${tabId}`,
//           updateProps
//         )
//         // Create a nice notification instead of alert
//         const notification = document.createElement('div')
//         notification.innerHTML = `
//           <div style="
//             position: fixed;
//             top: 20px;
//             right: 20px;
//             background: #333;
//             color: white;
//             padding: 12px 20px;
//             border-radius: 8px;
//             font-family: system-ui;
//             font-size: 14px;
//             z-index: 10000;
//             box-shadow: 0 4px 12px rgba(0,0,0,0.3);
//           ">
//             🚀 Dev Mode: Would switch to tab ${tabId}
//           </div>
//         `
//         document.body.appendChild(notification)
//         setTimeout(() => {
//           document.body.removeChild(notification)
//         }, 2000)
//       }
//     }

//     // Mock chrome.storage
//     ;(window as any).chrome.storage = {
//       onChanged: {
//         addListener: (callback: Function) => {
//           console.log('📦 Mock storage.onChanged.addListener')
//           // Store the callback for potential future use
//           ;(window as any)._mockStorageCallback = callback
//         },
//         removeListener: (callback: Function) => {
//           console.log('📦 Mock storage.onChanged.removeListener')
//         }
//       },
//       local: {
//         get: (keys: string[], callback: Function) => {
//           console.log('📦 Mock storage.local.get:', keys)
//           // Return empty data for now
//           setTimeout(() => callback({}), 10)
//         },
//         set: (data: any, callback?: Function) => {
//           console.log('📦 Mock storage.local.set:', data)
//           if (callback) setTimeout(callback, 10)
//         }
//       }
//     }

//     // Add global helper functions for testing
//     ;(window as any).simulateStatusChange = (
//       newStatus: 'idle' | 'in-progress' | 'done'
//     ) => {
//       console.log(`🔄 Simulating status change to: ${newStatus}`)
//       const url = new URL(window.location.href)
//       url.searchParams.set('status', newStatus)
//       window.history.replaceState({}, '', url.toString())

//       // Trigger storage change event if callback exists
//       if ((window as any)._mockStorageCallback) {
//         ;(window as any)._mockStorageCallback({
//           status: { newValue: newStatus }
//         })
//       }

//       // Force a page refresh to see the change
//       window.location.reload()
//     }
//     ;(window as any).setService = (service: 'claude' | 'chatgpt') => {
//       console.log(`🔄 Switching to service: ${service}`)
//       const url = new URL(window.location.href)
//       url.searchParams.set('service', service)
//       window.history.replaceState({}, '', url.toString())
//       window.location.reload()
//     }

//     // Log helpful testing info
//     console.log(`
// 🚀 Chrome Extension Development Mode Active!

// Current state: ${new URLSearchParams(window.location.search).get('status') || 'idle'}
// Current service: ${new URLSearchParams(window.location.search).get('service') || 'claude'}

// 💡 Test different states:
// • Add ?status=idle (default)
// • Add ?status=in-progress
// • Add ?status=done
// • Add &service=claude (default)
// • Add &service=chatgpt

// 📋 Example URLs:
// • ${window.location.origin}/?status=in-progress&service=claude
// • ${window.location.origin}/?status=done&service=chatgpt

// 🎮 Console commands:
// • simulateStatusChange('in-progress')
// • simulateStatusChange('done')
// • simulateStatusChange('idle')
// • setService('chatgpt')
// • setService('claude')
//     `)
//   } else if (window.chrome?.runtime) {
//     console.log('🔌 Production mode: Using real Chrome APIs')
//   }
// }

// // Initialize mocks FIRST
// initializeChromeMocks()

// // Then render React
// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <App />
//   </StrictMode>
// )

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
