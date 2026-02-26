import { useRef, useEffect, useState, useCallback } from 'react'
import { useTimeline } from '@/lib/TimelineContext'
import { isMobile, getQualitySettings } from '@/utils/mobilePerformance'

export const GlobeVideo = ({
  videoPath = '/assets/video/globe.mp4',
  className = '',
  loop = true,
  muted = true,
  preload = 'auto',
  sectionIndex = 0,
}) => {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { currentSection, isTransitioning, isAutoScrolling, registerSection, getFrameState, saveFrameState } = useTimeline()
  
  const isMobileDevice = isMobile()
  const qualitySettings = getQualitySettings()

  const isActive = currentSection === sectionIndex
  
  // Frame state management
  useEffect(() => {
    if (videoRef.current) {
      const handleTimeUpdate = () => {
        if (!isActive && videoRef.current.currentTime > 0) {
          saveFrameState(sectionIndex, videoRef.current.currentTime)
        }
      }
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate)
      return () => videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [isActive, sectionIndex, saveFrameState])

  useEffect(() => {
    if (containerRef.current) {
      registerSection(sectionIndex, containerRef.current)
    }
  }, [sectionIndex, registerSection])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isLoaded) {
      const savedTime = getFrameState(sectionIndex)
      
      if (isActive) {
        video.currentTime = savedTime
        if (loop) {
          video.play().catch(console.error)
        }
      } else if (!isActive && savedTime > 0) {
        video.currentTime = savedTime
      }
    }
    
    // Pause during transitions or autoplay to prevent scroll freeze
    if (isTransitioning || isAutoScrolling) {
      video.pause()
      video.style.opacity = '0.7'
    } else {
      if (isActive && !video.paused) {
        video.play().catch(console.error)
      } else if (!isActive && !video.paused) {
        video.pause()
      }
      video.style.opacity = '1'
    }

  }, [isActive, isTransitioning, isAutoScrolling, isLoaded, sectionIndex, getFrameState, loop])

  // Load handling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsLoaded(true)
    }

    const handleEnded = () => {
      if (loop && !isAutoScrolling) {
        video.currentTime = getFrameState(sectionIndex) || 0 
        video.play().catch(console.error)
      } else if (isAutoScrolling) {
        video.pause() 
      }
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('ended', handleEnded)
    }
  }, [loop, isAutoScrolling, getFrameState, sectionIndex])

  return (
    <div ref={containerRef} className={`globe-video ${className}`}>
      <video
        ref={videoRef}
        src={videoPath}
        autoPlay={false}
        muted={muted}
        loop={loop}
        playsInline
        preload={preload}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'opacity 0.5s ease',
          transform: 'translate3d(0, 0, 0)', // GPU acceleration
          willChange: 'opacity',
          imageRendering: isMobileDevice ? 'auto' : 'crisp-edges',
        }}
      />
      {!isLoaded && (
        <div className="video-loader">Loading Video...</div>
      )}
    </div>
  )
}

export const GlobeVideoWithOverlay = ({
  videoPath,
  children,
  className = '',
  overlayOpacity = 0.3,
  sectionIndex = 0,
}) => {
  return (
    <div className={`globe-video-overlay ${className}`} style={{ position: 'relative' }}>
      <GlobeVideo videoPath={videoPath} sectionIndex={sectionIndex} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0, 0, 0, ${overlayOpacity})`,
          zIndex: 1,
        }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        {children}
      </div>
    </div>
  )
}

export default GlobeVideo
