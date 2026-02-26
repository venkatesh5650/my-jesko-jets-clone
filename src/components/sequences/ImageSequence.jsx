import { useRef, useEffect, useState, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'

export const ImageSequence = ({
  sequencePath,
  totalFrames,
  startFrame = 1,
  framePrefix = 'frame-',
  fileExtension = '.jpg',
  autoplay = false,
  loop = false,
  fps = 30,
  className = '',
  alt = '',
  preload = false,
}) => {
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const [currentFrame, setCurrentFrame] = useState(startFrame)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const animationRef = useRef(null)
  const lastFrameTime = useRef(0)

  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: false,
  })

  const getFramePath = useCallback((frame) => {
    const frameNum = String(frame).padStart(4, '0')
    return `${sequencePath}/${framePrefix}${frameNum}${fileExtension}`
  }, [sequencePath, framePrefix, fileExtension])

  const preloadImages = useCallback(async () => {
    const promises = []
    for (let i = startFrame; i <= totalFrames; i++) {
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
  }, [totalFrames, startFrame, getFramePath])

  useEffect(() => {
    if (preload) {
      preloadImages()
    }
  }, [preload, preloadImages])

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const img = imagesRef.current[frameIndex - startFrame]

    if (img) {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
    }
  }, [startFrame])

  const animate = useCallback((timestamp) => {
    if (!isPlaying) return

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
        drawFrame(next)
        lastFrameTime.current = timestamp
        return next
      })
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [isPlaying, fps, totalFrames, loop, startFrame, drawFrame])

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
    if (!inView && isPlaying) {
      setIsPlaying(false)
    }
  }, [inView, autoplay, isPlaying])

  useEffect(() => {
    if (isLoaded && imagesRef.current[currentFrame - startFrame]) {
      drawFrame(currentFrame)
    }
  }, [currentFrame, isLoaded, startFrame, drawFrame])

  return (
    <div ref={ref} className={`image-sequence ${className}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
        alt={alt}
      />
      {!isLoaded && preload && (
        <div className="sequence-loader">Loading sequence...</div>
      )}
    </div>
  )
}

export default ImageSequence
