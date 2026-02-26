// Performance utilities for mobile optimization

export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isLowEndDevice = () => {
  return navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
}

export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const getDevicePixelRatio = () => {
  return window.devicePixelRatio || 1
}

export const optimizeForMobile = (config) => {
  const mobile = isMobile()
  const lowEnd = isLowEndDevice()
  
  return {
    ...config,
    fps: mobile ? Math.min(config.fps, 30) : config.fps,
    preload: lowEnd ? false : config.preload,
    smoothScroll: mobile && lowEnd ? false : config.smoothScroll,
    imageQuality: lowEnd ? 0.7 : 1,
  }
}

export const lazyLoadComponent = (importFunc) => {
  return React.lazy(importFunc)
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
