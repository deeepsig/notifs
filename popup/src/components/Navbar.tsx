import { DotsThreeIcon, XIcon } from '@phosphor-icons/react'
import notifsLogo from '/notifs-logo.png'

interface NavbarProps {
  onClose: () => void
}

export default function Navbar({ onClose }: NavbarProps) {
  return (
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
          className="p-1 rounded-sm hover:bg-[#141414]"
        >
          <DotsThreeIcon size={16} className="text-[#CAC6C6]" weight="bold" />
        </button>
        <button
          aria-label="Close extension"
          className="p-1 rounded-sm hover:bg-[#141414]"
          onClick={onClose}
        >
          <XIcon size={16} className="text-[#CAC6C6]" />
        </button>
      </div>
    </div>
  )
}
