import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTimeline } from '@/lib/TimelineContext'
import { getMaxFPS, getFrameInterval, getQualitySettings, isMobile } from '@/utils/mobilePerformance'

export const HeroSequence = ({
  sequencePath = '/assets/heroFrames',
  totalFrames = 180,
  framePrefix = 'hero-',
  fileExtension = '.jpg',
  className = '',
  preloadFrames: overridePreload,
  preserveQuality = true,
  sectionIndex = 1,
}) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imagesRef = useRef([])
  const loadedFramesRef = useRef(new Set())
  const [currentFrame, setCurrentFrame] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const animationFrameRef = useRef(null)
  const lastFrameTimeRef = useRef(0)

  const { 
    currentSection, 
    isTransitioning, 
    isAutoScrolling,
    sectionProgress, 
    registerSection, 
    getFrameState, 
    saveFrameState 
  } = useTimeline()

  // Mobile performance settings
  const qualitySettings = getQualitySettings()
  const preloadFrames = overridePreload || qualitySettings.preloadFrames
  const isMobileDevice = isMobile()
  const targetFPS = getMaxFPS()
  const frameInterval = getFrameInterval()

  const isActive = currentSection === sectionIndex
  const isApproaching = currentSection === sectionIndex - 1
  const isLeaving = currentSection === sectionIndex + 1

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const frameFromScroll = useTransform(scrollYProgress, [0, 1], [1, totalFrames])
  const smoothFrame = useSpring(frameFromScroll, { 
    stiffness: isMobileDevice ? 60 : 80, 
    damping: isMobileDevice ? 12 : 15,
    mass: 0.3 
  })

  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [1.1, 1, 1, 1.2])
  const blur = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [qualitySettings.enableBlur ? 10 : 0, 0, 0, qualitySettings.enableBlur ? 10 : 0])

  const getFramePath = useCallback((frame) => {
    const frameNum = String(frame).padStart(4, '0')
    return `${sequencePath}/${framePrefix}${frameNum}${fileExtension}`
  }, [sequencePath, framePrefix, fileExtension])

  const loadFrame = useCallback(async (frameIndex) => {
    if (loadedFramesRef.current.has(frameIndex)) {
      return imagesRef.current[frameIndex - 1]
    }

    return new Promise((resolve) => {
      const img = new Image()
      img.decoding = 'async'
      if (preserveQuality) {
        img.loading = 'eager'
      }
      img.src = getFramePath(frameIndex)
      img.onload = () => {
        imagesRef.current[frameIndex - 1] = img
        loadedFramesRef.current.add(frameIndex)
        resolve(img)
      }
      img.onerror = () => resolve(null)
    })
  }, [getFramePath, preserveQuality])

  const preloadInitialFrames = useCallback(async () => {
    setIsLoading(true)
    const framesToPreload = Math.min(preloadFrames, totalFrames)
    const promises = []
    
    for (let i = 1; i <= framesToPreload; i++) {
      promises.push(loadFrame(i))
    }
    
    const middleFrame = Math.floor(totalFrames / 2)
    for (let i = middleFrame - 5; i <= middleFrame + 5 && i <= totalFrames; i++) {
      if (i > 0) {
        promises.push(loadFrame(i))
      }
    }
    
    await Promise.all(promises)
    setIsLoaded(true)
    setIsLoading(false)
  }, [totalFrames, preloadFrames, loadFrame])

  useEffect(() => {
    preloadInitialFrames()
  }, [preloadInitialFrames])

  useEffect(() => {
    if (containerRef.current) {
      registerSection(sectionIndex, containerRef.current)
    }
  }, [sectionIndex, registerSection])

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = imagesRef.current[frameIndex - 1]

    if (img) {
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = qualitySettings.imageSmoothingQuality
      ctx.drawImage(img, 0, 0)
    }
  }, [qualitySettings.imageSmoothingQuality])

  const loadFramesAround = useCallback(async (centerFrame, range) => {
    const framesToLoad = []
    for (let i = Math.max(1, centerFrame - range); 
         i <= Math.min(totalFrames, centerFrame + range); 
         i++) {
      if (!loadedFramesRef.current.has(i)) {
        framesToLoad.push(i)
      }
    }

    if (framesToLoad.length > 0) {
      const batchSize = qualitySettings.batchSize
      for (let i = 0; i < framesToLoad.length; i += batchSize) {
        const batch = framesToLoad.slice(i, i + batchSize)
        await Promise.all(batch.map(frame => loadFrame(frame)))
      }
    }
  }, [totalFrames, loadFrame, qualitySettings.batchSize])
  
  // Frame state management
  useEffect(() => {
    if (isLeaving && isLoaded) {
      saveFrameState(sectionIndex, currentFrame)
    }
  }, [isLeaving, isLoaded, currentFrame, sectionIndex, saveFrameState])

  // FPS-throttled animation loop for autoplay
  useEffect(() => {
    if (!isLoaded || !isActive || !isAutoScrolling) return

    const animateAutoPlay = (currentTime) => {
      // FPS throttling
      if (currentTime - lastFrameTimeRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animateAutoPlay)
        return
      }
      lastFrameTimeRef.current = currentTime

      const frameProgress = sectionProgress
      const targetFrame = Math.round(1 + frameProgress * (totalFrames - 1))
      const clampedFrame = Math.max(1, Math.min(totalFrames, targetFrame))

      if (imagesRef.current[clampedFrame - 1]) {
        drawFrame(clampedFrame)
        setCurrentFrame(clampedFrame)
        loadFramesAround(clampedFrame, qualitySettings.loadRange)
      }

      if (isAutoScrolling) {
        animationFrameRef.current = requestAnimationFrame(animateAutoPlay)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animateAutoPlay)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isLoaded, isActive, isAutoScrolling, sectionProgress, drawFrame, totalFrames, loadFramesAround, frameInterval, qualitySettings.loadRange])

  // FPS-throttled animation loop for manual scroll
  useEffect(() => {
    if (!isLoaded || !isActive || isAutoScrolling) return

    const animateManual = (currentTime) => {
      // FPS throttling
      if (currentTime - lastFrameTimeRef.current < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animateManual)
        return
      }
      lastFrameTimeRef.current = currentTime

      const unsubscribe = smoothFrame.on('change', (latest) => {
        if (isTransitioning) return

        const frame = Math.round(latest)
        const clampedFrame = Math.max(1, Math.min(totalFrames, frame))
        
        if (imagesRef.current[clampedFrame - 1]) {
          drawFrame(clampedFrame)
          setCurrentFrame(clampedFrame)
          loadFramesAround(clampedFrame, qualitySettings.loadRange)
        }
      })

      return unsubscribe
    }

    const cleanup = animateManual(performance.now())

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (typeof cleanup === 'function') {
        cleanup()
      }
    }
  }, [isLoaded, isActive, isAutoScrolling, isTransitioning, smoothFrame, totalFrames, drawFrame, loadFramesAround, frameInterval, qualitySettings.loadRange])

  // Handle section transitions
  useEffect(() => {
    if (!isLoaded) return

    if (isApproaching) {
      loadFramesAround(1, qualitySettings.loadRange * 2)
    } else if (isActive) {
      const savedFrame = getFrameState(sectionIndex)
      const frameToDraw = Math.max(1, Math.min(totalFrames, savedFrame))

      if (imagesRef.current[frameToDraw - 1]) {
        drawFrame(frameToDraw)
        setCurrentFrame(frameToDraw)
      } else {
        drawFrame(1)
        setCurrentFrame(1)
      }
    }
  }, [isApproaching, isActive, isLoaded, loadFramesAround, drawFrame, getFrameState, sectionIndex, qualitySettings.loadRange])

  return (
    <div 
      ref={(node) => {
        containerRef.current = node
        ref(node)
      }} 
      className={`hero-sequence ${className}`}
      style={{ 
        height: '350vh',
        opacity: isTransitioning ? 0.8 : 1,
        transition: 'opacity 0.5s ease',
        transform: 'translate3d(0, 0, 0)', // GPU acceleration
        willChange: 'opacity',
      }}
    >
      <motion.div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          opacity,
          scale,
          filter: useTransform(blur, (b) => `blur(${b}px)`),
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          transform: 'translate3d(0, 0, 0)', // GPU acceleration
          backfaceVisibility: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            imageRendering: isMobileDevice ? 'auto' : 'crisp-edges',
          }}
        />
        {isLoading && (
          <div className="hero-loader">
            <div className="hero-loader-spinner" />
            <span>Loading hero sequence...</span>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export const HeroReveal = ({
  sequencePath,
  totalFrames,
  children,
  className = '',
  sectionIndex = 1,
}) => {
  return (
    <div className={`hero-reveal ${className}`} style={{ position: 'relative' }}>
      <HeroSequence
        sequencePath={sequencePath}
        totalFrames={totalFrames}
        sectionIndex={sectionIndex}
      />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        textAlign: 'center',
        color: '#fff',
        pointerEvents: 'none',
      }}>
        {children}
      </div>
    </div>
  )
}

export default HeroSequence
