import { Layout } from '@components/layout/Layout'
import { CinematicFade } from '@components/animations/SlowTransition'
import GlobeVideo from '@components/video/GlobeVideo'
import HeroSequence from '@components/sequences/HeroSequence'
import PlaneMorph from '@components/animations/PlaneMorph'
import '@styles/global.css'

function App() {
  // Navbar height is ~64px. We set section height to 100vh but must account for scroll range.
  // Since scroll is now section-based (100vh per section), we let the timeline handle the total scroll range.
  const NAV_HEIGHT_OFFSET_STYLE = { 
    paddingTop: '100px', // Adjust for navbar (assuming ~64px + margin)
  }

  return (
    <Layout>
      {/* ========================================
          SECTION 0: GLOBE VIDEO INTRO (100vh)
          ======================================== */}
      <section 
        className="globe-intro" 
        style={{ height: '100vh', position: 'relative', overflow: 'hidden' }}
      >
        <GlobeVideo
          videoPath="/assets/video/globe.mp4"
          autoplay={true}
          loop={true}
          muted={true}
          preload="auto"
          sectionIndex={0}
        />
        
        {/* Title Overlay */}
        <div 
          className="globe-overlay" 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          <CinematicFade delay={0.5} duration={2}>
            <h1 
              style={{
                color: '#fff',
                fontSize: 'clamp(2rem, 8vw, 6rem)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                textShadow: '0 0 40px rgba(0,0,0,0.8)',
                margin: 0,
              }}
            >
              JeskoJets
            </h1>
          </CinematicFade>
        </div>
      </section>

      {/* ========================================
          SECTION 1: HERO SEQUENCE (350vh scroll)
          ======================================== */}
      <section className="hero-section" style={NAV_HEIGHT_OFFSET_STYLE}>
        <HeroSequence
          sequencePath="/assets/heroFrames"
          totalFrames={180}
          framePrefix="hero-"
          fileExtension=".jpg"
          preserveQuality={true}
          sectionIndex={1}
        />
      </section>

      {/* ========================================
          SECTION 2: PLANE MORPH TRANSITION (250vh scroll)
          ======================================== */}
      <section className="plane-morph-section" style={NAV_HEIGHT_OFFSET_STYLE}>
        {/* Intro Text */}
        <div 
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
          }}
        >
          <h2 
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 3rem)',
              fontWeight: 300,
              color: '#fff',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
              margin: 0,
            }}
          >
            From Vision to Precision
          </h2>
          <p 
            style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              fontWeight: 200,
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Watch the transformation unfold
          </p>
        </div>

        {/* Plane Morph Animation */}
        <PlaneMorph
          sequencePath="/assets/planeFrames"
          totalFrames={120}
          framePrefix="plane-"
          fileExtension=".jpg"
          sectionIndex={2}
        />

        {/* Outro Text */}
        <div 
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(0deg, #0a0a0a 0%, #1a1a2e 100%)',
          }}
        >
          <p 
            style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
              fontWeight: 300,
              color: '#fff',
              opacity: 0.8,
              maxWidth: '800px',
              margin: '0 auto',
              lineHeight: 1.8,
            }}
          >
            Every detail engineered to perfection. From concept to reality, 
            the Jesko Jet represents the pinnacle of aerospace design.
          </p>
        </div>
      </section>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer 
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: '#0a0a0a',
          color: '#fff',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <p 
          style={{
            fontSize: '0.875rem',
            opacity: 0.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          © 2024 JeskoJets. All rights reserved.
        </p>
      </footer>
    </Layout>
  )
}

export default App
