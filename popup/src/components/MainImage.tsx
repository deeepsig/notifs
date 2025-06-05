// components/MainImage.tsx
import { useExtension } from '../contexts/ExtensionContext'

export default function MainImage() {
  const { getStatusText, getImageSrc, isImageHidden } = useExtension()

  if (isImageHidden) {
    return null
  }

  return (
    <div className="relative flex-1 mb-[10px]">
      <img
        src={getImageSrc()}
        alt={`Current status: ${getStatusText()}`}
        className="object-cover w-full h-full transition-opacity duration-200 ease-in-out"
      />
    </div>
  )
}
