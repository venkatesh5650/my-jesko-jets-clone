import { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

export const SlowTransition = ({
  children,
  fromScene,
  toScene,
  duration = 2,
  ease = [0.25, 0.1, 0.25, 1],
  className = '',
  triggerOffset = 0.5,
}) => {
  const containerRef = useRef(null)
  const { ref, inView } = useInView({
    threshold: triggerOffset,
    triggerOnce: false,
  })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  const opacityFrom = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const opacityTo = useTransform(scrollYProgress, [0.5, 1], [0, 1])
  const scaleFrom = useTransform(scrollYProgress, [0, 0.5], [1, 1.1])
  const scaleTo = useTransform(scrollYProgress, [0.5, 1], [0.9, 1])
  const blur = useTransform(scrollYProgress, [0.4, 0.5, 0.6], [0, 10, 0])

  const smoothOpacityFrom = useSpring(opacityFrom, { stiffness: 100, damping: 30 })
  const smoothOpacityTo = useSpring(opacityTo, { stiffness: 100, damping: 30 })

  return (
    <div ref={(node) => {
      containerRef.current = node
      ref(node)
    }} className={`slow-transition ${className}`}>
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        {/* From Scene */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: smoothOpacityFrom,
            scale: scaleFrom,
            filter: useTransform(blur, (b) => `blur(${b}px)`),
            zIndex: 1,
          }}
        >
          {fromScene}
        </motion.div>

        {/* To Scene */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: smoothOpacityTo,
            scale: scaleTo,
            filter: useTransform(blur, (b) => `blur(${b}px)`),
            zIndex: 2,
          }}
        >
          {toScene}
        </motion.div>
      </div>
    </div>
  )
}

export const CinematicFade = ({
  children,
  delay = 0,
  duration = 1.5,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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

export const MorphTransition = ({
  fromChildren,
  toChildren,
  progress,
  className = '',
}) => {
  return (
    <div className={`morph-transition ${className}`} style={{ position: 'relative' }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 1 - progress,
        }}
      >
        {fromChildren}
      </motion.div>
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: progress,
        }}
      >
        {toChildren}
      </motion.div>
    </div>
  )
}

export const SceneChange = ({
  scenes,
  currentScene,
  transitionDuration = 1,
  className = '',
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScene}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: transitionDuration,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className={className}
      >
        {scenes[currentScene]}
      </motion.div>
    </AnimatePresence>
  )
}

export default SlowTransition
