import { useEffect, useState } from 'react'
import notifsLogo from '/notifs-logo.png'
import chatgptLogo from '/chatgpt-logo.png'
import claudeLogo from '/claude-logo.png'
import totoroInProgress from '/totoro-in-progress.png'
import totoroDone from '/totoro-done.png'
import totoroIdle from '/totoro-idle.png'
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

  const handleOpenNewChat = (service: 'chatgpt' | 'claude') => {
    const url =
      service === 'chatgpt' ? 'https://chat.openai.com' : 'https://claude.ai'
    window.open(url, '_blank')
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

  // Status text colors:
  // Done = #D77655, In-progress = #6F635F, Idle = #CAC6C6
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

        <div className="flex items-center gap-2">
          <button
            aria-label="More options"
            className="p-1 rounded-sm hover:bg-[#141414] "
          >
            <DotsThreeIcon size={16} className="text-[#CAC6C6]" weight="bold" />
          </button>
          <button
            aria-label="Close extension"
            className="p-1 rounded-sm hover:bg-[#141414] "
            onClick={() => window.close()}
          >
            <XIcon size={16} className="text-[#CAC6C6]" />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="relative flex-1 mb-[10px]">
        <img
          key={statusData.status}
          src={isIdle ? totoroIdle : isDone ? totoroDone : totoroInProgress}
          alt={`Current status: ${getStatusText()}`}
          className="object-cover w-full h-full transition-opacity duration-200 ease-in-out"
        />
      </div>

      {/* Bottom Bar */}
      {isIdle ? (
        <div className="flex items-center justify-between px-[10px] py-[8px] bg-black border border-[#6D6B6B]">
          {/* Left: idle text */}
          <span className="text-sm text-[#CAC6C6] italic">
            idling like totoro
          </span>

          {/* Right: "Start a new task" + two logos */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {}}
              className="text-sm text-white hover:bg-[#141414] px-1 py-1 rounded-sm "
            >
              Start a new task
            </button>
            <button onClick={() => handleOpenNewChat('chatgpt')} className="">
              <img src={chatgptLogo} alt="ChatGPT" className="w-5 h-5" />
            </button>
            <button onClick={() => handleOpenNewChat('claude')} className="">
              <img src={claudeLogo} alt="Claude" className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-[10px] py-[8px] bg-black border border-[#6D6B6B]">
          <div className="flex items-center gap-3">
            {getServiceLogo() && (
              <img
                src={getServiceLogo()!}
                alt={`${getTabTitle()} icon`}
                className="w-5 h-5"
              />
            )}
            <span className="text-base">{getTabTitle()}</span>
          </div>

          {/* "Go to Chat" */}
          <button
            onClick={handleGoToChat}
            aria-label={`Go to chat – status: ${getStatusText()}`}
            className="group flex items-center gap-2 p-1 rounded-sm hover:bg-[#141414] "
          >
            <span className={['text-sm', statusTextColorClass].join(' ')}>
              {getStatusText()}
            </span>
            <ArrowRightIcon
              size={16}
              className="text-white transition-transform duration-150 group-hover:translate-x-1"
            />
          </button>
        </div>
      )}
    </div>
  )
}
