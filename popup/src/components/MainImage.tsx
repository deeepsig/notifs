interface MainImageProps {
  statusText: string
  imageSrc: string
}

export default function MainImage({ statusText, imageSrc }: MainImageProps) {
  return (
    <div className="relative flex-1 mb-[10px]">
      <img
        src={imageSrc}
        alt={`Current status: ${statusText}`}
        className="object-cover w-full h-full transition-opacity duration-200 ease-in-out"
      />
    </div>
  )
}
