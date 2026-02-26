// Mobile Performance Utilities
// Detects device capabilities and provides optimized settings

let isMobileCache = null
let isLowEndCache = null
let maxFPS = null

export const isMobile = () => {
  if (isMobileCache !== null) return isMobileCache
  isMobileCache = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768
  return isMobileCache
}

export const isLowEndDevice = () => {
  if (isLowEndCache !== null) return isLowEndCache
  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4
  const deviceMemory = navigator.deviceMemory || 4 // GB
  
  isLowEndCache = cores <= 4 || deviceMemory <= 4
  return isLowEndCache
}

export const getMaxFPS = () => {
  if (maxFPS !== null) return maxFPS
  
  const mobile = isMobile()
  const lowEnd = isLowEndDevice()
  
  if (lowEnd) {
    maxFPS = 24 // Very conservative for low-end devices
  } else if (mobile) {
    maxFPS = 30 // Standard mobile optimization
  } else {
    maxFPS = 60 // Desktop full quality
  }
  
  return maxFPS
}

export const getFrameInterval = () => {
  return 1000 / getMaxFPS()
}

// Throttled requestAnimationFrame for mobile
export const createThrottledRAF = (callback, targetFPS = null) => {
  const fps = targetFPS || getMaxFPS()
  const interval = 1000 / fps
  let lastTime = 0
  let rafId = null
  
  const throttledRAF = (currentTime) => {
    if (currentTime - lastTime >= interval) {
      callback(currentTime)
      lastTime = currentTime
    }
    rafId = requestAnimationFrame(throttledRAF)
  }
  
  rafId = requestAnimationFrame(throttledRAF)
  
  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
  }
}

// GPU acceleration helper
export const getGPUTransform = () => ({
  transform: 'translate3d(0, 0, 0)',
  willChange: 'transform',
  backfaceVisibility: 'hidden',
  perspective: '1000px',
})

// Quality settings based on device
export const getQualitySettings = () => {
  const mobile = isMobile()
  const lowEnd = isLowEndDevice()
  
  return {
    preloadFrames: lowEnd ? 10 : mobile ? 15 : 20,
    loadRange: lowEnd ? 8 : mobile ? 12 : 20,
    batchSize: lowEnd ? 3 : mobile ? 5 : 5,
    imageSmoothingQuality: lowEnd ? 'low' : 'medium',
    preserveQuality: !lowEnd,
    enableBlur: !mobile,
    enableParallax: !lowEnd,
  }
}

// Detect if user prefers reduced motion
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Initialize performance settings on mount
export const initPerformanceSettings = () => {
  // Warm up caches
  isMobile()
  isLowEndDevice()
  getMaxFPS()
  
  return getQualitySettings()
}
