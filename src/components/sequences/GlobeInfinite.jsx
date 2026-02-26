import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export const GlobeInfinite = ({
  sequencePath = '/assets/frames/globe',
  totalFrames = 120,
  framePrefix = 'globe-',
  fileExtension = '.jpg',
  className = '',
  autoplay = true,
  loop = true,
  fps = 60,
}) => {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const [currentFrame, setCurrentFrame] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const animationRef = useRef(null)
  const lastFrameTime = useRef(0)
  const rotationSpeed = useRef(1)

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const getFramePath = useCallback((frame) => {
    const frameNum = String(frame).padStart(4, '0')
    return `${sequencePath}/${framePrefix}${frameNum}${fileExtension}`
  }, [sequencePath, framePrefix, fileExtension])

  const preloadImages = useCallback(async () => {
    const promises = []
    for (let i = 1; i <= totalFrames; i++) {
      promises.push(
        new Promise((resolve) => {
          const img = new Image()
          img.src = getFramePath(i)
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
        })
      )
    }
    imagesRef.current = await Promise.all(promises)
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

    const frameInterval = 1000 / (fps * rotationSpeed.current)
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
    if (inView && !isPlaying && loop) {
      setIsPlaying(true)
    }
  }, [inView, isPlaying, loop])

  useEffect(() => {
    if (isLoaded && imagesRef.current[currentFrame - 1]) {
      drawFrame(currentFrame)
    }
  }, [currentFrame, isLoaded, drawFrame])

  return (
    <div ref={ref} className={`globe-infinite ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      {!isLoaded && (
        <div className="globe-loader">Loading globe...</div>
      )}
    </div>
  )
}

export const GlobeWithScroll = ({
  sequencePath,
  totalFrames,
  className = '',
}) => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const frame = useTransform(scrollYProgress, [0, 1], [1, totalFrames])

  return (
    <div ref={containerRef} className={`globe-scroll ${className}`} style={{ height: '300vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <GlobeInfinite
          sequencePath={sequencePath}
          totalFrames={totalFrames}
          autoplay={false}
          loop={false}
        />
      </div>
    </div>
  )
}

export default GlobeInfinite
