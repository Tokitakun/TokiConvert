"use client";





export default function Navbar() {
  return (
    <nav className="w-full border-b border-[#D8D0C4] bg-[#F7F4EE] h-16">
      <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4">
        <div className="text-2xl font-bold" style={{ color: '#34483D' }}>
          toki <span style={{ color: '#302E29' }}>convert</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/about" className="text-sm text-[#625C53] hover:text-[#302E29] focus:outline-none focus:ring-2 focus:ring-[#A9573F]">About</a>
          <a href="https://github.com/Tokitakun/TokiConvert" className="flex items-center space-x-1 text-sm text-[#625C53] hover:text-[#302E29] focus:outline-none focus:ring-2 focus:ring-[#A9573F]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.39 7.86 10.92.58.1.79-.25.79-.56 0-.28-.01-1.02-.01-2-3.19.69-3.86-1.54-3.86-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.07-.73.08-.71.08-.71 1.19.08 1.82 1.22 1.82 1.22 1.05 1.8 2.76 1.28 3.44.98.1-.77.41-1.28.75-1.57-2.55-.29-5.23-1.28-5.23-5.71 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.51.11-3.14 0 0 .98-.31 3.2 1.18a11.12 11.12 0 012.92-.39c.99.01 2 .13 2.92.39 2.22-1.5 3.2-1.18 3.2-1.18.64 1.63.24 2.84.12 3.14.75.81 1.2 1.84 1.2 3.1 0 4.44-2.69 5.42-5.25 5.71.42.36.8 1.07.8 2.16 0 1.56-.01 2.82-.01 3.2 0 .31.21.67.8.55C20.71 21.38 24 17.09 24 12 24 5.73 18.27.5 12 .5z"/></svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

