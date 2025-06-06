// components/BottomBar.tsx
import { ArrowRightIcon } from '@phosphor-icons/react'
import claudeLogo from '/claude-logo.png'
import { useExtension } from '../contexts/ExtensionContext'

export default function BottomBar() {
  const {
    statusData,
    getStatusText,
    getStatusTextColorClass,
    getTabTitle,
    getServiceLogo,
    handleGoToChat,
    handleOpenNewChat
  } = useExtension()

  const isIdle = statusData.status === 'idle'
  const statusText = getStatusText()
  const statusTextColorClass = getStatusTextColorClass()
  const tabTitle = getTabTitle()
  const serviceLogo = getServiceLogo()

  if (isIdle) {
    return (
      <div className="flex items-center justify-between px-[10px] py-[8px] bg-black border border-[#555555]">
        {/* Left: idle text */}
        <span className="text-base text-[#CAC6C6]">idling like totoro</span>
        {/* Right: "Start a new task" + two logos */}
        <div className="flex items-center gap-2">
          <p className="px-1 py-1 text-sm text-[#CAC6C6] rounded-sm">
            Start a new task
          </p>
          {/* <button onClick={() => handleOpenNewChat('chatgpt')} className="">
            <img src={chatgptLogo} alt="ChatGPT" className="w-5 h-5" />
          </button> */}
          <button onClick={() => handleOpenNewChat('claude')} className="">
            <img src={claudeLogo} alt="Claude" className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between px-[10px] py-[8px] bg-black border border-[#555555]">
      <div className="flex items-center gap-3">
        {serviceLogo && (
          <img src={serviceLogo} alt={`${tabTitle} icon`} className="w-5 h-5" />
        )}
        <span className="text-base text-[#CAC6C6] ">{tabTitle}</span>
      </div>
      {/* "Go to Chat" */}
      <button
        onClick={handleGoToChat}
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
