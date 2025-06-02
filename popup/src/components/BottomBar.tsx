import { ArrowRightIcon } from '@phosphor-icons/react'
import chatgptLogo from '/chatgpt-logo.png'
import claudeLogo from '/claude-logo.png'

interface BottomBarProps {
  isIdle: boolean
  statusText: string
  statusTextColorClass: string
  tabTitle: string
  serviceLogo: string | null
  onGoToChat: () => void
  onOpenNewChat: (service: 'chatgpt' | 'claude') => void
}

export default function BottomBar({
  isIdle,
  statusText,
  statusTextColorClass,
  tabTitle,
  serviceLogo,
  onGoToChat,
  onOpenNewChat
}: BottomBarProps) {
  if (isIdle) {
    return (
      <div className="flex items-center justify-between px-[10px] py-[8px] bg-black border border-[#6D6B6B]">
        {/* Left: idle text */}
        <span className="text-base text-[#CAC6C6] italic">
          idling like totoro
        </span>

        {/* Right: "Start a new task" + two logos */}
        <div className="flex items-center gap-2">
          <p className="px-1 py-1 text-sm text-white rounded-sm">
            Start a new task
          </p>
          <button onClick={() => onOpenNewChat('chatgpt')} className="">
            <img src={chatgptLogo} alt="ChatGPT" className="w-5 h-5" />
          </button>
          <button onClick={() => onOpenNewChat('claude')} className="">
            <img src={claudeLogo} alt="Claude" className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-[10px] py-[8px] bg-black border border-[#6D6B6B]">
      <div className="flex items-center gap-3">
        {serviceLogo && (
          <img src={serviceLogo} alt={`${tabTitle} icon`} className="w-5 h-5" />
        )}
        <span className="text-base">{tabTitle}</span>
      </div>

      {/* "Go to Chat" */}
      <button
        onClick={onGoToChat}
        aria-label={`Go to chat – status: ${statusText}`}
        className="group flex items-center gap-2 p-1 rounded-sm hover:bg-[#141414]"
      >
        <span className={['text-sm', statusTextColorClass].join(' ')}>
          {statusText}
        </span>
        <ArrowRightIcon
          size={16}
          className="text-white transition-transform duration-150 group-hover:translate-x-1"
        />
      </button>
    </div>
  )
}
