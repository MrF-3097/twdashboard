'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface LoginAnimationProps {
  onComplete: () => void
}

export const LoginAnimation = ({ onComplete }: LoginAnimationProps) => {
  const [phase, setPhase] = useState<'initial' | 'moving' | 'merged' | 'text' | 'fade' | 'complete'>('initial')

  useEffect(() => {
    // Start the animation sequence - total duration: ~2 seconds
    const timer1 = setTimeout(() => {
      setPhase('moving')
    }, 50) // Very small delay before starting movement

    const timer2 = setTimeout(() => {
      setPhase('merged')
    }, 600) // Time for rectangles to come together (50ms delay + 550ms animation)

    const timer3 = setTimeout(() => {
      setPhase('text')
    }, 1000) // Show text after logo appears

    const timer4 = setTimeout(() => {
      setPhase('fade')
    }, 1800) // Start fade out

    const timer5 = setTimeout(() => {
      setPhase('complete')
      setTimeout(() => {
        onComplete()
      }, 300) // Complete fade before calling onComplete
    }, 2100) // Total animation duration

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [onComplete])

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#0F172A] flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        phase === 'fade' || phase === 'complete' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Logo Container */}
        <div className={`relative transition-all duration-700 ease-out ${
          phase === 'merged' || phase === 'text' || phase === 'fade' || phase === 'complete'
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`}>
          {/* Final merged image */}
          {(phase === 'merged' || phase === 'text' || phase === 'fade' || phase === 'complete') && (
            <div className="relative z-10">
              <Image
                src="/Group 186.png"
                alt="Logo"
                width={400}
                height={400}
                className="object-contain w-[200px] h-[200px] md:w-[400px] md:h-[400px]"
                priority
              />
            </div>
          )}

          {/* Three rectangles - animated to come together */}
          {phase !== 'merged' && phase !== 'text' && phase !== 'fade' && phase !== 'complete' && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Rectangle 1150 - Top Left */}
              <div
                className={`absolute transition-all duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                  phase === 'moving' 
                    ? 'translate-x-0 translate-y-0 scale-100 opacity-100' 
                    : 'translate-x-[-120px] md:translate-x-[-250px] translate-y-[-80px] md:translate-y-[-150px] scale-85 opacity-70'
                }`}
                style={{
                  zIndex: phase === 'moving' ? 3 : 1,
                  transformOrigin: 'center center',
                }}
              >
                <Image
                  src="/Rectangle 1150.png"
                  alt="Rectangle 1"
                  width={250}
                  height={250}
                  className="object-contain w-[120px] h-[120px] md:w-[250px] md:h-[250px]"
                  priority
                />
              </div>

              {/* Rectangle 1152 - Top Right */}
              <div
                className={`absolute transition-all duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                  phase === 'moving' 
                    ? 'translate-x-0 translate-y-0 scale-100 opacity-100' 
                    : 'translate-x-[120px] md:translate-x-[250px] translate-y-[-80px] md:translate-y-[-150px] scale-85 opacity-70'
                }`}
                style={{
                  zIndex: phase === 'moving' ? 2 : 1,
                  transformOrigin: 'center center',
                }}
              >
                <Image
                  src="/Rectangle 1152.png"
                  alt="Rectangle 2"
                  width={250}
                  height={250}
                  className="object-contain w-[120px] h-[120px] md:w-[250px] md:h-[250px]"
                  priority
                />
              </div>

              {/* Rectangle 1146 - Bottom Center */}
              <div
                className={`absolute transition-all duration-[550ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                  phase === 'moving' 
                    ? 'translate-x-0 translate-y-0 scale-100 opacity-100' 
                    : 'translate-x-0 translate-y-[100px] md:translate-y-[200px] scale-85 opacity-70'
                }`}
                style={{
                  zIndex: phase === 'moving' ? 1 : 1,
                  transformOrigin: 'center center',
                }}
              >
                <Image
                  src="/Rectangle 1146.png"
                  alt="Rectangle 3"
                  width={250}
                  height={250}
                  className="object-contain w-[120px] h-[120px] md:w-[250px] md:h-[250px]"
                  priority
                />
              </div>
            </div>
          )}
        </div>

        {/* myTower text - appears after logo */}
        {(phase === 'text' || phase === 'fade' || phase === 'complete') && (
          <div 
            className="relative mt-8 md:mt-12"
            style={{
              animation: phase === 'text' ? 'textAppear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : phase === 'fade' || phase === 'complete' ? 'textFadeOut 0.3s ease-out forwards' : 'none',
            }}
          >
            {/* Subtle glow under text */}
            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-400/50 via-blue-500/50 to-blue-400/50 -z-10"></div>
            <h1 className="relative text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent animate-gradient-text" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
              myTower
            </h1>
          </div>
        )}
      </div>
    </div>
  )
}

