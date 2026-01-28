"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface SplashScreenProps {
  onPlay: () => void
}

export function SplashScreen({ onPlay }: SplashScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f5e6c8] via-[#e8dcc8] to-[#dccfb8] p-4">
      {/* Decorative corner elements */}
      <div className="fixed top-8 left-8 w-16 h-16 border-l-3 border-t-3 border-[#d4af37]/50" />
      <div className="fixed top-8 right-8 w-16 h-16 border-r-3 border-t-3 border-[#d4af37]/50" />
      <div className="fixed bottom-8 left-8 w-16 h-16 border-l-3 border-b-3 border-[#d4af37]/50" />
      <div className="fixed bottom-8 right-8 w-16 h-16 border-r-3 border-b-3 border-[#d4af37]/50" />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl border-4 border-[#8B6914] golden-glow">
        {/* Art Deco frame */}
        <div className="absolute inset-0 border-2 border-[#d4af37] pointer-events-none z-10 rounded-lg" />

        {/* Splash Image */}
        <div className="relative aspect-square w-full bg-gradient-to-b from-[#87CEEB] to-[#f5e6c8]">
          <Image
            src="/images/splash.png"
            alt="Monopoly: San Francisco Edition"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Play Button Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-8 pt-20 z-20">
          <Button
            onClick={onPlay}
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#c4a030] hover:from-[#c4a030] hover:to-[#b49028] py-6 text-xl font-serif font-bold tracking-[0.15em] text-white shadow-lg transition-all hover:scale-[1.02] border-2 border-[#8B6914]"
          >
            PLAY NOW
          </Button>
        </div>
      </div>

      <p className="mt-6 text-sm font-serif italic text-[#5c4a1f]">
        A San Francisco neighborhood adventure
      </p>
    </div>
  )
}
