import { useEffect, useState, useRef, useCallback } from 'react'
import { initSmoothScroll, destroySmoothScroll } from '@/lib/smooth-scroll'
import { TimelineProvider, useTimeline } from '@/lib/TimelineContext'
import { isMobile, getGPUTransform } from '@/utils/mobilePerformance'

// Internal layout component with timeline access
const LayoutContent = ({ children }) => {
  const containerRef = useRef(null)
  const [lenis, setLenis] = useState(null)
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const { 
    currentSection, 
    sectionProgress, 
    isTransitioning, 
    isAutoScrolling,
    scrollToSection, 
    startAutoScroll
  } = useTimeline()
  
  const navbarRef = useRef(null)
  const mainRef = useRef(null)
  const sectionsRef = useRef([
    { id: 'globe', label: 'Intro', index: 0 },
    { id: 'hero', label: 'Hero', index: 1 },
    { id: 'plane', label: 'Morph', index: 2 },
  ])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Initialize smooth scroll with mobile optimization
    const smoothScroll = initSmoothScroll()
    setLenis(smoothScroll)

    return () => {
      destroySmoothScroll(smoothScroll)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const handleNavClick = useCallback((sectionIndex) => {
    if (isTransitioning || isAutoScrolling) return
    scrollToSection(sectionIndex)
  }, [isTransitioning, isAutoScrolling, scrollToSection])

  // GPU-optimized styles
  const gpuStyles = {
    ...getGPUTransform(),
    willChange: isTransitioning ? 'transform, opacity' : 'transform',
  }

  return (
    <div ref={containerRef} className={`layout ${isMobileDevice ? 'mobile' : 'desktop'}`}>
      {/* Cinematic Navigation - GPU Optimized */}
      <nav 
        ref={navbarRef}
        className="cinematic-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)', // Safari support
          opacity: isTransitioning ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
          transform: 'translate3d(0, 0, 0)', // GPU acceleration
          willChange: 'opacity',
        }}
      >
        <div style={{ 
          fontSize: '1rem', 
          fontWeight: 700, 
          color: '#fff',
          letterSpacing: '0.1em',
        }}>
          JESKOJETS
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {sectionsRef.current.map((section) => {
            
            let color = 'rgba(255,255,255,0.5)';
            let fontWeight = 500;

            if (currentSection === section.index) {
                color = '#fff'; 
                fontWeight = 700;
            } else if (currentSection === section.index - 1 && sectionProgress > 0.9) {
                color = `rgba(255, 255, 255, ${sectionProgress})`;
                fontWeight = 700;
            } else if (currentSection === section.index + 1 && sectionProgress < 0.1) {
                color = `rgba(255, 255, 255, ${1 - sectionProgress})`;
                fontWeight = 700;
            }

            return (
              <button
                key={section.id}
                onClick={() => handleNavClick(section.index)}
                disabled={isTransitioning || isAutoScrolling}
                style={{
                  background: 'none',
                  border: 'none',
                  color: color,
                  fontSize: '0.875rem',
                  fontWeight: fontWeight,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: (isTransitioning || isAutoScrolling) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  padding: '0.5rem',
                  transform: 'translate3d(0, 0, 0)', // GPU acceleration for hover states
                }}
              >
                {section.label}
              </button>
            )
          })}

          {/* AUTO-PLAY MISSION BUTTON */}
          <button
            onClick={startAutoScroll}
            disabled={isTransitioning || isAutoScrolling}
            style={{
              background: isAutoScrolling ? 'var(--color-accent)' : 'var(--color-text)',
              color: isAutoScrolling ? '#000' : 'var(--color-bg)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              cursor: (isTransitioning || isAutoScrolling) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: isAutoScrolling ? 1 : 0.9,
              transform: 'translate3d(0, 0, 0)', // GPU acceleration
            }}
          >
            {isAutoScrolling ? 'Autoplaying...' : 'Mission Start'}
          </button>
        </div>

        {/* Progress Indicator */}
        <div 
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {sectionsRef.current.map((_, index) => (
            <div
              key={index}
              style={{
                width: currentSection === index ? '24px' : '8px',
                height: '2px',
                background: currentSection === index ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </nav>

      {/* Main Content - GPU Optimized */}
      <main 
        ref={mainRef}
        className="main-content" 
        style={{ 
          paddingTop: 0,
          transform: 'translate3d(0, 0, 0)', // GPU acceleration
          willChange: isAutoScrolling ? 'transform' : 'auto',
          contain: 'layout paint', // Prevent layout reflow
        }}
      >
        {children}
      </main>

      {/* Section Indicators (Side) - GPU Optimized */}
      <div 
        style={{
          position: 'fixed',
          right: '2rem',
          top: '50%',
          transform: 'translateY(-50%) translate3d(0, 0, 0)', // GPU acceleration
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          willChange: 'transform',
        }}
      >
        {sectionsRef.current.map((section, index) => (
          <button
            key={section.id}
            onClick={() => handleNavClick(index)}
            disabled={isTransitioning || isAutoScrolling}
            style={{
              width: currentSection === index ? '16px' : '12px',
              height: currentSection === index ? '16px' : '12px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              background: currentSection === index ? '#fff' : 'transparent',
              cursor: (isTransitioning || isAutoScrolling) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
              transform: 'translate3d(0, 0, 0)', // GPU acceleration
            }}
            aria-label={`Go to ${section.label} Section`}
          />
        ))}
      </div>
    </div>
  )
}

// Main Layout component wrapped with TimelineProvider
export const Layout = ({ children }) => {
  return (
    <TimelineProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </TimelineProvider>
  )
}

export const useCinematicTimeline = () => {
  return useTimeline()
}

export default Layout
