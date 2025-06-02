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
    if (statusData.trackedTabId !== null) {
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

  const isDone = statusData.status === 'done'
  const isInProgress = statusData.status === 'in-progress'
  const isIdle = statusData.status === 'idle'

  // Text color: Done = #D77655, In‐progress = #6F635F, Idle = #CAC6C6
  const statusTextColorClass = isDone
    ? 'text-[#D77655]'
    : isInProgress
      ? 'text-[#6F635F]'
      : 'text-[#CAC6C6]'

  return (
    <div className="w-[400px] h-full bg-black text-white flex flex-col p-[10px] mt-2 mr-2 font-dm-sans border border-[#6D6B6B]">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-[10px]">
        <div className="flex items-center gap-2">
          <img src={notifsLogo} alt="notifs" className="w-4 h-4" />
          <span className="text-base font-normal bg-gradient-to-b from-[#D97757] to-[#FFFFFF] bg-clip-text text-transparent">
            notifs
          </span>
        </div>
        <div className="flex items-center gap-3">
          <DotsThreeIcon
            size={16}
            className="text-[#CAC6C6] cursor-pointer"
            weight="bold"
          />
          <XIcon size={16} className="text-[#CAC6C6] cursor-pointer" />
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 mb-[10px]">
        <img
          src={statusData.status === 'done' ? totoroDone : totoroInProgress}
          alt="Status"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between p-[10px] bg-black border border-[#6D6B6B]">
        <div className="flex items-center gap-3">
          {getServiceLogo() && (
            <img src={getServiceLogo()!} alt="Service" className="w-4 h-4" />
          )}
          <span className="text-base">{getTabTitle()}</span>
        </div>

        <button
          onClick={handleGoToChat}
          disabled={isIdle}
          className="flex items-center gap-2"
        >
          <span className={['text-sm', statusTextColorClass].join(' ')}>
            {getStatusText()}
          </span>

          {!isIdle && <ArrowRightIcon size={16} className="text-white" />}
        </button>
      </div>
    </div>
  )
}
