// contexts/ExtensionContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from 'react'
import chatgptLogo from '/chatgpt-logo.png'
import claudeLogo from '/claude-logo.png'
import totoroInProgress from '/totoro-in-progress.png'
import totoroDone from '/totoro-done.png'
import totoroIdle from '/totoro-idle.png'

interface StatusData {
  trackedTabId: number | null
  status: 'idle' | 'in-progress' | 'done'
  trackedUrl: string
}

interface ExtensionContextType {
  statusData: StatusData
  isImageHidden: boolean
  getServiceLogo: () => string | null
  getTabTitle: () => string
  getStatusText: () => string
  getImageSrc: () => string
  getStatusTextColorClass: () => string
  handleGoToChat: () => void
  handleOpenNewChat: (service: 'chatgpt' | 'claude') => void
  handleClose: () => void
  toggleImageVisibility: () => void
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(
  undefined
)

export const useExtension = () => {
  const context = useContext(ExtensionContext)
  if (context === undefined) {
    throw new Error('useExtension must be used within an ExtensionProvider')
  }
  return context
}

interface ExtensionProviderProps {
  children: ReactNode
}

export const ExtensionProvider = ({ children }: ExtensionProviderProps) => {
  const [statusData, setStatusData] = useState<StatusData>({
    trackedTabId: null,
    status: 'idle',
    trackedUrl: ''
  })
  const [isImageHidden, setIsImageHidden] = useState(false)

  // Load image visibility preference from storage
  useEffect(() => {
    chrome.storage.local.get(['imageHidden'], (result) => {
      if (result.imageHidden !== undefined) {
        setIsImageHidden(result.imageHidden)
      }
    })
  }, [])

  // Fetch initial status
  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'get-status' },
      (response: StatusData) => {
        if (response) {
          console.log('Initial status:', response)
          setStatusData(response)
        }
      }
    )
  }, [])

  // Listen for status changes in real-time
  useEffect(() => {
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange
    }) => {
      console.log('Storage changed:', changes)

      // Handle image visibility changes
      if (changes.imageHidden) {
        setIsImageHidden(changes.imageHidden.newValue)
      }

      // If any of our tracked values changed, update the state
      if (changes.status || changes.trackedTabId || changes.trackedUrl) {
        chrome.runtime.sendMessage(
          { type: 'get-status' },
          (response: StatusData) => {
            if (response) {
              console.log('Updated status:', response)
              setStatusData(response)
            }
          }
        )
      }
    }

    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange)

    // Also poll for status updates every 2 seconds to ensure UI stays in sync
    const pollInterval = setInterval(() => {
      chrome.runtime.sendMessage(
        { type: 'get-status' },
        (response: StatusData) => {
          if (response) {
            setStatusData((prevData) => {
              // Only update if something actually changed to avoid unnecessary re-renders
              if (JSON.stringify(prevData) !== JSON.stringify(response)) {
                console.log('Status poll update:', response)
                return response
              }
              return prevData
            })
          }
        }
      )
    }, 2000)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
      clearInterval(pollInterval)
    }
  }, [])

  // Utility functions
  const getServiceLogo = () => {
    if (statusData.trackedUrl.includes('chat.openai.com')) return chatgptLogo
    if (statusData.trackedUrl.includes('claude.ai')) return claudeLogo
    return null
  }

  const getTabTitle = () => {
    if (statusData.trackedUrl.includes('chat.openai.com')) return 'ChatGPT'
    if (statusData.trackedUrl.includes('claude.ai')) return 'Claude'
    return 'Chat'
  }

  const getStatusText = () => {
    if (statusData.status === 'in-progress') return 'In progress'
    if (statusData.status === 'done') return 'Done'
    return 'Idle'
  }

  const getImageSrc = () => {
    if (statusData.status === 'idle') return totoroIdle
    if (statusData.status === 'done') return totoroDone
    return totoroInProgress
  }

  const getStatusTextColorClass = () => {
    const isDone = statusData.status === 'done'
    const isInProgress = statusData.status === 'in-progress'
    // Status text colors: Done = #D77655, In-progress = #6F635F, Idle = #CAC6C6
    return isDone
      ? 'text-[#D77655]'
      : isInProgress
        ? 'text-[#6F635F]'
        : 'text-[#CAC6C6]'
  }

  // Event handlers
  const handleGoToChat = () => {
    if (statusData.trackedTabId !== null) {
      chrome.tabs.update(statusData.trackedTabId, { active: true })
      window.close()
    }
  }

  const handleOpenNewChat = (service: 'chatgpt' | 'claude') => {
    const url =
      service === 'chatgpt' ? 'https://chat.openai.com' : 'https://claude.ai'
    window.open(url, '_blank')
  }

  const handleClose = () => {
    window.close()
  }

  const toggleImageVisibility = () => {
    const newVisibility = !isImageHidden
    setIsImageHidden(newVisibility)
    // Save preference to storage
    chrome.storage.local.set({ imageHidden: newVisibility })
  }

  const value: ExtensionContextType = {
    statusData,
    isImageHidden,
    getServiceLogo,
    getTabTitle,
    getStatusText,
    getImageSrc,
    getStatusTextColorClass,
    handleGoToChat,
    handleOpenNewChat,
    handleClose,
    toggleImageVisibility
  }

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  )
}
