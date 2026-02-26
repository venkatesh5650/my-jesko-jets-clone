import { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import { useScroll, useTransform, useSpring } from 'framer-motion'

const TimelineContext = createContext(null)

export const useTimeline = () => {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error('useTimeline must be used within TimelineProvider')
  }
  return context
}

export const TimelineProvider = ({ children }) => {
  const containerRef = useRef(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [navbarClickPending, setNavbarClickPending] = useState(false)
  const [sectionProgress, setSectionProgress] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false) // <-- NEW: Auto-play state
  
  const sectionRefs = useRef([])
  const frameStateRef = useRef({}) 
  const scrollAnimationRef = useRef(null)
  const lastScrollTimeRef = useRef(0)
  const animationFrameRef = useRef(null)

  const totalSections = 3 
  const sectionHeight = typeof window !== 'undefined' ? window.innerHeight : 1000

  // Register section refs
  const registerSection = useCallback((index, ref) => {
    sectionRefs.current[index] = ref
  }, [])

  // Preserve frame state for section
  const saveFrameState = useCallback((sectionIndex, frame) => {
    frameStateRef.current[sectionIndex] = frame
  }, [])

  // Get preserved frame state
  const getFrameState = useCallback((sectionIndex) => {
    return frameStateRef.current[sectionIndex] || 1
  }, [])

  // Transform-based smooth scroll (TO A SPECIFIC POSITION)
  const scrollToSection = useCallback((sectionIndex) => {
    if (sectionIndex < 0 || sectionIndex >= totalSections) return
    if (isTransitioning) return

    const targetPosition = sectionIndex * sectionHeight

    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current)
    }

    const startPosition = window.scrollY
    const distance = targetPosition - startPosition
    const startTime = performance.now()
    const duration = 1200 // 1.2s smooth scroll

    const easeInOutQuart = (t) => {
      return t < 0.5
        ? 8 * t * t * t * t
        : 1 - 8 * --t * t * t * t
    }

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = easeInOutQuart(progress)

      window.scrollTo({
        top: startPosition + (distance * eased),
        behavior: 'auto',
      })

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animateScroll)
      } else {
        setIsTransitioning(false)
        setNavbarClickPending(false)
        setCurrentSection(sectionIndex)
        scrollAnimationRef.current = null
      }
    }

    scrollAnimationRef.current = requestAnimationFrame(animateScroll)
  }, [isTransitioning, totalSections, sectionHeight])
  
  // Auto-Scroll Mission (Start to End)
  const startAutoScroll = useCallback(() => {
    if (isTransitioning || isAutoScrolling) return
    
    setIsAutoScrolling(true)
    setIsTransitioning(true)
    setNavbarClickPending(true)
    
    const targetPosition = totalSections * sectionHeight // Scroll past the last section
    
    const startPosition = window.scrollY
    const distance = targetPosition - startPosition
    const startTime = performance.now()
    const duration = 15000 // 15 seconds total duration for cinematic pace

    const easeInOutQuart = (t) => {
      return t < 0.5
        ? 8 * t * t * t * t
        : 1 - 8 * --t * t * t * t
    }

    const animateAutoScroll = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = easeInOutQuart(progress)

      window.scrollTo({
        top: startPosition + (distance * eased),
        behavior: 'auto',
      })

      if (progress < 1) {
        scrollAnimationRef.current = requestAnimationFrame(animateAutoScroll)
      } else {
        // Animation complete
        setIsAutoScrolling(false)
        setIsTransitioning(false)
        setNavbarClickPending(false)
        setCurrentSection(totalSections - 1)
        scrollAnimationRef.current = null
      }
    }
    
    scrollAnimationRef.current = requestAnimationFrame(animateAutoScroll)
  }, [isTransitioning, isAutoScrolling, totalSections, sectionHeight])

  // Get section progress (0-1 within current section)
  const getSectionProgress = useCallback(() => {
    if (!containerRef.current) return { absolute: 0, current: 0, progress: 0 }

    const viewportHeight = window.innerHeight
    const scrollTop = window.scrollY

    const absoluteProgress = scrollTop / viewportHeight
    const currentSectionIndex = Math.min(
      totalSections - 1,
      Math.floor(absoluteProgress)
    )

    const sectionProgressValue = (absoluteProgress % 1)
    const smoothedProgress = Math.max(0, Math.min(1, sectionProgressValue))

    return {
      absolute: absoluteProgress,
      current: currentSectionIndex,
      progress: smoothedProgress,
    }
  }, [totalSections])

  // Update current section based on scroll
  useEffect(() => {
    const handleScroll = () => {
      const now = performance.now()
      
      // Pause autoplay if user scrolls manually during auto-scroll
      if (isAutoScrolling && (now - lastScrollTimeRef.current > 100)) {
          setIsAutoScrolling(false)
          if (scrollAnimationRef.current) {
             cancelAnimationFrame(scrollAnimationRef.current)
             scrollAnimationRef.current = null
          }
      }
      lastScrollTimeRef.current = now


      // Throttle updates for performance
      if (now - lastScrollTimeRef.current < 16) return
      lastScrollTimeRef.current = now

      const { current, progress } = getSectionProgress()
      
      if (current !== currentSection && !navbarClickPending) {
        setCurrentSection(current)
      }

      setSectionProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [currentSection, navbarClickPending, getSectionProgress, isAutoScrolling])

  // RequestAnimationFrame sync for smooth playback (for sequence drawing)
  const syncProgress = useCallback((sectionIndex, callback) => {
    const animate = () => {
      const { progress, current } = getSectionProgress()
      
      if (current === sectionIndex) {
        callback(progress, current)
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    animationFrameRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [getSectionProgress])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const value = {
    containerRef,
    currentSection,
    isTransitioning,
    isAutoScrolling, // EXPOSED
    totalSections,
    sectionProgress,
    registerSection,
    scrollToSection,
    startAutoScroll, // EXPOSED
    getSectionProgress,
    syncProgress,
    saveFrameState,
    getFrameState,
  }

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  )
}

export default TimelineContext
