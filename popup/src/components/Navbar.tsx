// components/Navbar.tsx
import {
  DotsThreeIcon,
  XIcon,
  EyeIcon,
  EyeSlashIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  QuestionIcon,
  XLogoIcon
} from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'
import notifsLogo from '/notifs-logo.png'
import { useExtension } from '../contexts/ExtensionContext'

export default function Navbar() {
  const {
    handleClose,
    isImageHidden,
    isSoundEnabled,
    toggleImageVisibility,
    toggleSoundEnabled
  } = useExtension()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleToggleImageVisibility = () => {
    toggleImageVisibility()
  }

  const handleToggleSoundEnabled = () => {
    toggleSoundEnabled()
  }

  const handleHelpClick = () => {
    window.open('https://github.com/deeepsig/notifs', '_blank')
    setIsDropdownOpen(false)
  }

  const handleFollowDevelopment = () => {
    window.open('https://x.com/deeepsig', '_blank')
    setIsDropdownOpen(false)
  }

  return (
    <div className="flex items-center justify-between mb-[10px]">
      <div className="flex items-center gap-2">
        <img src={notifsLogo} alt="notifs" className="w-5 h-5" />
        <span className="text-base font-normal text-white">notifs</span>
      </div>
      <div className="relative flex items-center gap-2">
        <button
          aria-label={isImageHidden ? 'Show image' : 'Hide image'}
          className="p-1 rounded-sm hover:bg-[#141414]"
          onClick={handleToggleImageVisibility}
        >
          {isImageHidden ? (
            <EyeSlashIcon size={16} className="text-[#CAC6C6]" />
          ) : (
            <EyeIcon size={16} className="text-[#CAC6C6]" />
          )}
        </button>

        <button
          aria-label={isSoundEnabled ? 'Disable sound' : 'Enable sound'}
          className="p-1 rounded-sm hover:bg-[#141414]"
          onClick={handleToggleSoundEnabled}
        >
          {isSoundEnabled ? (
            <SpeakerHighIcon size={16} className="text-[#CAC6C6]" />
          ) : (
            <SpeakerSlashIcon size={16} className="text-[#CAC6C6]" />
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            aria-label="More options"
            className="p-1 rounded-sm hover:bg-[#141414]"
            onClick={handleDropdownToggle}
          >
            <DotsThreeIcon size={16} className="text-[#CAC6C6]" weight="bold" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-8 right-0 w-48 bg-[#1A1A1A] border border-[#6D6B6B] rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] z-50">
              <button
                onClick={handleHelpClick}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#CAC6C6] hover:bg-[#333333] text-left"
              >
                <QuestionIcon size={14} className="text-[#CAC6C6]" />
                Help
              </button>
              <button
                onClick={handleFollowDevelopment}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#CAC6C6] hover:bg-[#333333] text-left"
              >
                <XLogoIcon size={14} className="text-[#CAC6C6]" />
                Follow Development
              </button>
            </div>
          )}
        </div>

        <button
          aria-label="Close extension"
          className="p-1 rounded-sm hover:bg-[#141414]"
          onClick={handleClose}
        >
          <XIcon size={16} className="text-[#CAC6C6]" />
        </button>
      </div>
    </div>
  )
}
