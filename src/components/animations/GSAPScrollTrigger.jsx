import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

export const GSAPHeroAnimation = ({ className = '' }) => {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const imageRef = useRef(null)

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })

      tl.to(textRef.current, {
        y: -200,
        opacity: 0,
        duration: 1,
        ease: 'power2.inOut',
      })
        .to(
          imageRef.current,
          {
            scale: 1.5,
            duration: 1,
            ease: 'power2.inOut',
          },
          0
        )
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={`gsap-hero ${className}`}>
      <div ref={textRef} className="hero-text">
        {/* Hero content */}
      </div>
      <div ref={imageRef} className="hero-image">
        {/* Hero image */}
      </div>
    </div>
  )
}

export const TextScramble = ({ text, className = '' }) => {
  const elementRef = useRef(null)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let iteration = 0
    const interval = setInterval(() => {
      element.innerText = text
        .split('')
        .map((letter, index) => {
          if (index < iteration) {
            return text[index]
          }
          return letters[Math.floor(Math.random() * 26)]
        })
        .join('')

      if (iteration >= text.length) {
        clearInterval(interval)
      }

      iteration += 1 / 3
    }, 30)

    return () => clearInterval(interval)
  }, [text])

  return (
    <span ref={elementRef} className={`text-scramble ${className}`}>
      {text}
    </span>
  )
}

export const HorizontalScroll = ({ children, className = '' }) => {
  const containerRef = useRef(null)
  const sectionsRef = useRef(null)

  useGSAP(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray(sectionsRef.current.children)

      gsap.to(sections, {
        xPercent: -100 * (sections.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (sections.length - 1),
          end: () => '+=' + containerRef.current.offsetWidth * sections.length,
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={`horizontal-scroll ${className}`}>
      <div ref={sectionsRef} className="horizontal-sections" style={{ display: 'flex' }}>
        {children}
      </div>
    </div>
  )
}

export default GSAPHeroAnimation
