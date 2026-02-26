import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import GSAP from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

GSAP.registerPlugin(ScrollTrigger)

export const JetCinematic = ({
  sequencePath = '/assets/frames/jet',
  totalFrames = 180,
  framePrefix = 'jet-',
  fileExtension = '.jpg',
  className = '',
  autoplay = false,
  loop = false,
  fps = 60,
  scrollTrigger = true,
}) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imagesRef = useRef([])
  const [currentFrame, setCurrentFrame] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const animationRef = useRef(null)
  const lastFrameTime = useRef(0)

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  const frameFromScroll = useTransform(scrollYProgress, [0, 1], [1, totalFrames])
  const smoothFrame = useSpring(frameFromScroll, { stiffness: 150, damping: 25 })

  const getFramePath = useCallback((frame) => {
    const frameNum = String(frame).padStart(4, '0')
    return `${sequencePath}/${framePrefix}${frameNum}${fileExtension}`
  }, [sequencePath, framePrefix, fileExtension])

  const preloadImages = useCallback(async () => {
    const batchSize = 10
    for (let i = 1; i <= totalFrames; i += batchSize) {
      const batch = []
      for (let j = 0; j < batchSize && (i + j) <= totalFrames; j++) {
        batch.push(
          new Promise((resolve) => {
            const img = new Image()
            img.src = getFramePath(i + j)
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
          })
        )
      }
      const loaded = await Promise.all(batch)
      imagesRef.current.push(...loaded)
    }
    setIsLoaded(true)
  }, [totalFrames, getFramePath])

  useEffect(() => {
    preloadImages()
  }, [preloadImages])

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = imagesRef.current[frameIndex - 1]

    if (img) {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
    }
  }, [])

  const animate = useCallback((timestamp) => {
    if (!isPlaying || !isLoaded) return

    const frameInterval = 1000 / fps
    if (timestamp - lastFrameTime.current >= frameInterval) {
      setCurrentFrame((prev) => {
        let next = prev + 1
        if (next > totalFrames) {
          if (loop) {
            next = 1
          } else {
            setIsPlaying(false)
            return prev
          }
        }
        drawFrame(next)
        lastFrameTime.current = timestamp
        return next
      })
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [isPlaying, isLoaded, fps, totalFrames, loop, drawFrame])

  useEffect(() => {
    if (isPlaying && isLoaded) {
      animationRef.current = requestAnimationFrame(animate)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, isLoaded, animate])

  useEffect(() => {
    if (scrollTrigger && isLoaded) {
      smoothFrame.on('change', (latest) => {
        const frame = Math.round(latest)
        if (frame >= 1 && frame <= totalFrames && imagesRef.current[frame - 1]) {
          drawFrame(frame)
          setCurrentFrame(frame)
        }
      })
    }
  }, [scrollTrigger, isLoaded, smoothFrame, totalFrames, drawFrame])

  useEffect(() => {
    if (inView && autoplay && !isPlaying) {
      setIsPlaying(true)
    }
    if (!inView && isPlaying && !scrollTrigger) {
      setIsPlaying(false)
    }
  }, [inView, autoplay, isPlaying, scrollTrigger])

  useEffect(() => {
    if (isLoaded && imagesRef.current[currentFrame - 1]) {
      drawFrame(currentFrame)
    }
  }, [currentFrame, isLoaded, drawFrame])

  useGSAP(() => {
    if (!scrollTrigger) return

    const ctx = GSAP.context(() => {
      GSAP.fromTo(canvasRef.current,
        {
          scale: 0.8,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 1.5,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 1,
          },
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={(node) => {
      containerRef.current = node
      ref(node)
    }} className={`jet-cinematic ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
      {!isLoaded && (
        <div className="jet-loader">Loading jet sequence...</div>
      )}
    </div>
  )
}

export const JetReveal = ({
  sequencePath,
  totalFrames,
  className = '',
}) => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 1.1])
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [100, 0, 0, -100])

  return (
    <div ref={containerRef} className={`jet-reveal ${className}`} style={{ height: '200vh' }}>
      <motion.div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          opacity,
          scale,
          y,
          overflow: 'hidden',
        }}
      >
        <JetCinematic
          sequencePath={sequencePath}
          totalFrames={totalFrames}
          scrollTrigger={true}
        />
      </motion.div>
    </div>
  )
}

export const JetHero = ({
  sequencePath,
  totalFrames,
  className = '',
}) => {
  const containerRef = useRef(null)

  useGSAP(() => {
    const ctx = GSAP.context(() => {
      const tl = GSAP.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })

      tl.to('.jet-hero-text', {
        y: -150,
        opacity: 0,
        duration: 1,
        ease: 'power2.inOut',
      })
        .to('.jet-hero-canvas', {
          scale: 1.2,
          duration: 1,
          ease: 'power2.inOut',
        }, 0)
    }, containerRef)

    return () => ctx.revert()
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={`jet-hero ${className}`}>
      <div className="jet-hero-text">
        {/* Hero text content */}
      </div>
      <div className="jet-hero-canvas">
        <JetCinematic
          sequencePath={sequencePath}
          totalFrames={totalFrames}
          scrollTrigger={true}
        />
      </div>
    </div>
  )
}

export default JetCinematic
