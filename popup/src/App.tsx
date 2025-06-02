import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import MainImage from './components/MainImage'
import BottomBar from './components/BottomBar'
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

export default function App() {
  const [statusData, setStatusData] = useState<StatusData>({
    trackedTabId: null,
    status: 'idle',
    trackedUrl: ''
  })

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'get-status' },
      (response: StatusData) => {
        if (response) setStatusData(response)
      }
    )
  }, [])

  // Common utility functions
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

  return (
    <div className="w-[400px] h-full bg-black text-white flex flex-col p-[10px] mt-2 mr-2 font-dm-sans border border-[#6D6B6B]">
      <Navbar onClose={handleClose} />

      <MainImage statusText={getStatusText()} imageSrc={getImageSrc()} />

      <BottomBar
        isIdle={statusData.status === 'idle'}
        statusText={getStatusText()}
        statusTextColorClass={getStatusTextColorClass()}
        tabTitle={getTabTitle()}
        serviceLogo={getServiceLogo()}
        onGoToChat={handleGoToChat}
        onOpenNewChat={handleOpenNewChat}
      />
    </div>
  )
}
