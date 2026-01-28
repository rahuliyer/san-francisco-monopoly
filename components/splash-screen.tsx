"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface SplashScreenProps {
  onPlay: () => void
}

export function SplashScreen({ onPlay }: SplashScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5e6c8] p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg shadow-2xl">
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
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-8 pt-16">
          <Button
            onClick={onPlay}
            className="w-full bg-amber-500 py-6 text-xl font-bold tracking-wide text-white shadow-lg transition-all hover:bg-amber-600 hover:scale-[1.02]"
          >
            Play Now
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-stone-600">
        A San Francisco neighborhood adventure
      </p>
    </div>
  )
}
