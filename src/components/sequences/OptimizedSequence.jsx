import { useRef, useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'

export const OptimizedSequence = ({
  sequencePath,
  totalFrames,
  startFrame = 1,
  framePrefix = 'frame-',
  fileExtension = '.jpg',
  className = '',
  autoplay = false,
  loop = false,
  fps = 30,
  preloadFrames = 10,
  scrollSync = true,
  alt = '',
}) => {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const loadedFramesRef = useRef(new Set())
  const [currentFrame, setCurrentFrame] = useState(startFrame)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const animationRef = useRef(null)
  const lastFrameTime = useRef(0)
  const frameLoadQueueRef = useRef([])
  const isLoadingRef = useRef(false)

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  const getFramePath = useCallback((frame) => {
    const frameNum = String(frame).padStart(4, '0')
    return `${sequencePath}/${framePrefix}${frameNum}${fileExtension}`
  }, [sequencePath, framePrefix, fileExtension])

  const loadFrame = useCallback(async (frameIndex) => {
    if (loadedFramesRef.current.has(frameIndex)) {
      return imagesRef.current[frameIndex - startFrame]
    }

    return new Promise((resolve) => {
      const img = new Image()
      img.src = getFramePath(frameIndex)
      img.onload = () => {
        imagesRef.current[frameIndex - startFrame] = img
        loadedFramesRef.current.add(frameIndex)
        resolve(img)
      }
      img.onerror = () => {
        resolve(null)
      }
    })
  }, [startFrame, getFramePath])

  const preloadInitialFrames = useCallback(async () => {
    const framesToPreload = Math.min(preloadFrames, totalFrames)
    const promises = []
    
    for (let i = startFrame; i <= startFrame + framesToPreload - 1; i++) {
      promises.push(loadFrame(i))
    }
    
    await Promise.all(promises)
    setIsLoaded(true)
  }, [totalFrames, startFrame, preloadFrames, loadFrame])

  const loadFramesAround = useCallback(async (centerFrame, range = 5) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true

    const framesToLoad = []
    for (let i = Math.max(startFrame, centerFrame - range); 
         i <= Math.min(totalFrames, centerFrame + range); 
         i++) {
      if (!loadedFramesRef.current.has(i)) {
        framesToLoad.push(i)
      }
    }

    if (framesToLoad.length > 0) {
      await Promise.all(framesToLoad.map(frame => loadFrame(frame)))
    }

    isLoadingRef.current = false
  }, [totalFrames, startFrame, loadFrame])

  useEffect(() => {
    preloadInitialFrames()
  }, [preloadInitialFrames])

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = imagesRef.current[frameIndex - startFrame]

    if (img) {
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      ctx.drawImage(img, 0, 0)
    }
  }, [startFrame])

  const animate = useCallback((timestamp) => {
    if (!isPlaying || !isLoaded) return

    const frameInterval = 1000 / fps
    if (timestamp - lastFrameTime.current >= frameInterval) {
      setCurrentFrame((prev) => {
        let next = prev + 1
        if (next > totalFrames) {
          if (loop) {
            next = startFrame
          } else {
            setIsPlaying(false)
            return prev
          }
        }
        
        // Load frames ahead
        loadFramesAround(next, 10)
        
        const img = imagesRef.current[next - startFrame]
        if (img) {
          drawFrame(next)
          lastFrameTime.current = timestamp
        }
        return next
      })
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [isPlaying, isLoaded, fps, totalFrames, loop, startFrame, drawFrame, loadFramesAround])

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
    if (inView && autoplay && !isPlaying) {
      setIsPlaying(true)
    }
    if (!inView && isPlaying && !scrollSync) {
      setIsPlaying(false)
    }
  }, [inView, autoplay, isPlaying, scrollSync])

  useEffect(() => {
    if (isLoaded && imagesRef.current[currentFrame - startFrame]) {
      drawFrame(currentFrame)
    }
  }, [currentFrame, isLoaded, startFrame, drawFrame])

  useEffect(() => {
    if (scrollSync && isLoaded) {
      loadFramesAround(currentFrame, 15)
    }
  }, [currentFrame, scrollSync, isLoaded, loadFramesAround])

  return (
    <div ref={ref} className={`optimized-sequence ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          imageRendering: 'auto',
        }}
        alt={alt}
      />
      {!isLoaded && (
        <div className="sequence-loader">Loading sequence...</div>
      )}
    </div>
  )
}

export const ScrollSyncedSequence = ({
  sequencePath,
  totalFrames,
  className = '',
  framePrefix,
  fileExtension,
  preloadFrames = 15,
}) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const loadedFramesRef = useRef(new Set())
  const [isLoaded, setIsLoaded] = useState(false)
  const animationFrameRef = useRef(null)

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
    
    await Promise.all(promises)
    setIsLoaded(true)
  }, [totalFrames, preloadFrames, loadFrame])

  useEffect(() => {
    preloadInitialFrames()
  }, [preloadInitialFrames])

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
      ctx.drawImage(img, 0, 0)
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !isLoaded) return

    const rect = containerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const scrollProgress = Math.max(0, Math.min(1, 
      1 - (rect.bottom - viewportHeight / 2) / (rect.height - viewportHeight / 2)
    ))

    const targetFrame = Math.round(1 + scrollProgress * (totalFrames - 1))
    const clampedFrame = Math.max(1, Math.min(totalFrames, targetFrame))

    if (imagesRef.current[clampedFrame - 1]) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        drawFrame(clampedFrame)
      })
    }
  }, [totalFrames, isLoaded, drawFrame])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [handleScroll])

  return (
    <div ref={containerRef} className={`scroll-synced-sequence ${className}`} style={{ height: '300vh' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
        {!isLoaded && (
          <div className="sequence-loader">Loading sequence...</div>
        )}
      </div>
    </div>
  )
}

export default OptimizedSequence
