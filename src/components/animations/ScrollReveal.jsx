import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export const ScrollReveal = ({
  children,
  direction = 'up',
  distance = 100,
  duration = 0.8,
  delay = 0,
  threshold = 0.2,
  className = '',
  once = true,
}) => {
  const ref = useRef(null)
  const { ref: inViewRef, inView } = useInView({
    threshold,
    triggerOnce: once,
  })

  const directions = {
    up: { y: distance, opacity: 0 },
    down: { y: -distance, opacity: 0 },
    left: { x: distance, opacity: 0 },
    right: { x: -distance, opacity: 0 },
    scale: { scale: 0.8, opacity: 0 },
    fade: { opacity: 0 },
  }

  return (
    <motion.div
      ref={(node) => {
        ref.current = node
        inViewRef(node)
      }}
      initial={directions[direction]}
      animate={inView ? { x: 0, y: 0, scale: 1, opacity: 1 } : directions[direction]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const ParallaxSection = ({
  children,
  speed = 0.5,
  className = '',
}) => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, -100 * speed])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })

  return (
    <div ref={ref} className={`parallax-section ${className}`} style={{ overflow: 'hidden' }}>
      <motion.div style={{ y: smoothY }}>
        {children}
      </motion.div>
    </div>
  )
}

export const StickyReveal = ({
  children,
  startOffset = 0,
  endOffset = 0,
  className = '',
}) => {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: [
      `start ${startOffset === 0 ? 'end' : `center+=${startOffset}`}`,
      `end ${endOffset === 0 ? 'start' : `center-=${endOffset}`}`,
    ],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 1.2])

  return (
    <div ref={containerRef} className={`sticky-reveal ${className}`}>
      <motion.div style={{ opacity, scale, position: 'sticky', top: 0 }}>
        {children}
      </motion.div>
    </div>
  )
}

export default ScrollReveal
