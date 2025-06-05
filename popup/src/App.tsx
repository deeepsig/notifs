// App.tsx
import Navbar from './components/Navbar'
import MainImage from './components/MainImage'
import BottomBar from './components/BottomBar'
import { ExtensionProvider } from './contexts/ExtensionContext'

export default function App() {
  return (
    <ExtensionProvider>
      <div className="w-[400px] h-full bg-black text-white flex flex-col p-[10px] font-dm-sans border border-[#6D6B6B]">
        <Navbar />
        <MainImage />
        <BottomBar />
      </div>
    </ExtensionProvider>
  )
}
