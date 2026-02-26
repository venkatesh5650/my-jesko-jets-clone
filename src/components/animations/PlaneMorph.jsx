import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTimeline } from '@/lib/TimelineContext'
import { getMaxFPS, getFrameInterval, getQualitySettings, isMobile } from '@/utils/mobilePerformance'

export const PlaneMorph = ({
  sequencePath = '/assets/planeFrames',
  totalFrames = 120,
  framePrefix = 'plane-',
  fileExtension = '.jpg',
  className = '',
  preloadFrames: overridePreload,
  sectionIndex = 2,
}) => {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imagesRef = useRef([])
  const loadedFramesRef = useRef(new Set())
  const [currentFrame, setCurrentFrame] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const animationRef = useRef(null)
  const lastFrameTimeRef = useRef(0)

  const { currentSection, isTransitioning, isAutoScrolling, sectionProgress, registerSection, getFrameState, saveFrameState } = useTimeline()

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
    threshold: 0.2,
    triggerOnce: false,
  })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const frameFromScroll = useTransform(scrollYProgress, [0, 1], [1, totalFrames])
  const smoothFrame = useSpring(frameFromScroll, { 
    stiffness: isMobileDevice ? 80 : 100, 
    damping: isMobileDevice ? 16 : 20,
    mass: 0.5 
  })

  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.95, 1, 1, 1.05])

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
      img.src = getFramePath(frameIndex)
      img.onload = () => {
        imagesRef.current[frameIndex - 1] = img
        loadedFramesRef.current.add(frameIndex)
        resolve(img)
      }
      img.onerror = () => resolve(null)
    })
  }, [getFramePath])

  const preloadInitialFrames = useCallback(async () => {
    const framesToPreload = Math.min(preloadFrames, totalFrames)
    const promises = []
    
    for (let i = 1; i <= framesToPreload; i++) {
      promises.push(loadFrame(i))
    }
    
    for (let i = totalFrames - 10; i <= totalFrames; i++) {
      if (i > 0) {
        promises.push(loadFrame(i))
      }
    }
    
    await Promise.all(promises)
    setIsLoaded(true)
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

  // FPS-throttled autoplay loop
  useEffect(() => {
    if (!isActive || !isAutoScrolling || !isLoaded) return

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
  }, [isActive, isAutoScrolling, isLoaded, sectionProgress, drawFrame, totalFrames, loadFramesAround, frameInterval, qualitySettings.loadRange])

  // FPS-throttled manual scroll loop
  useEffect(() => {
    if (!isActive || isAutoScrolling || !isLoaded) return

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
  }, [isActive, isAutoScrolling, isLoaded, isTransitioning, smoothFrame, totalFrames, drawFrame, loadFramesAround, frameInterval, qualitySettings.loadRange])

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
      className={`plane-morph ${className}`}
      style={{ 
        height: '250vh',
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
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translate3d(0, 0, 0)', // GPU acceleration
          backfaceVisibility: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
            imageRendering: isMobileDevice ? 'auto' : 'crisp-edges',
          }}
        />
        {!isLoaded && (
          <div className="morph-loader">Loading morph sequence...</div>
        )}
      </motion.div>
    </div>
  )
}

export default PlaneMorph
