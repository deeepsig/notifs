import { useEffect, useState } from 'react'
import notifsLogo from '/notifs-logo.png'
import chatgptLogo from '/chatgpt-logo.png'
import claudeLogo from '/claude-logo.png'
import totoroInProgress from '/totoro-in-progress.png'
import totoroDone from '/totoro-done.png'
import { ArrowRightIcon, DotsThreeIcon, XIcon } from '@phosphor-icons/react'

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

  const handleGoToChat = () => {
    if (statusData.trackedTabId) {
      chrome.tabs.update(statusData.trackedTabId, { active: true })
      window.close()
    }
  }

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

  return (
    <div className="w-[320px] h-[240px] bg-black text-white flex flex-col p-4">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src={notifsLogo} alt="notifs" className="w-6 h-6 rounded-full" />
          <span className="text-sm font-semibold">notifs</span>
        </div>
        <div className="flex items-center gap-2">
          <DotsThreeIcon size={20} className="text-gray-400 cursor-pointer" />
          <XIcon size={20} className="text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 mb-4">
        <img
          src={statusData.status === 'done' ? totoroDone : totoroInProgress}
          alt="Status"
          className="object-cover w-full h-full rounded-lg"
        />
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          {getServiceLogo() && (
            <img src={getServiceLogo()!} alt="Service" className="w-5 h-5" />
          )}
          <span className="text-xs">{getTabTitle()}</span>
        </div>

        <button
          onClick={handleGoToChat}
          disabled={statusData.status === 'idle'}
          className="flex items-center gap-2"
        >
          <span className="text-[10px] text-gray-400">{getStatusText()}</span>
          {statusData.status !== 'idle' && <ArrowRightIcon size={16} />}
        </button>
      </div>
    </div>
  )
}
