# Cinematic Front-End Experience

Production-ready React + Vite setup for world-class motion design and smooth scroll animations.

## Quick Start

```bash
npm install
npm run dev
```

## Tech Stack

- **React 18** + **Vite** - Blazing fast dev & build
- **Framer Motion** - Declarative animations
- **GSAP + ScrollTrigger** - Professional scroll animations
- **Lenis** - Smooth scrolling (mobile optimized)
- **React Intersection Observer** - Performance-friendly viewport detection

## Project Structure

```
cinematic-experience/
├── public/
│   └── sequences/          # Image sequence frames
├── src/
│   ├── components/
│   │   ├── animations/     # ScrollReveal, GSAP components
│   │   ├── sequences/      # ImageSequence renderer
│   │   ├── layout/         # Layout, MobileOptimizedContainer
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── assets/
│   │   ├── images/
│   │   ├── sequences/      # Source sequence images
│   │   ├── fonts/
│   │   └── videos/
│   ├── styles/
│   │   └── global.css      # Mobile-first styles
│   ├── utils/
│   │   └── performance.js  # Device detection & optimization
│   ├── lib/
│   │   └── smooth-scroll.js # Lenis initialization
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Key Features

### ✅ Smooth Scroll (Lenis)
- Enabled by default in `Layout.jsx`
- Auto-disabled on low-end mobile devices
- Respects `prefers-reduced-motion`

### ✅ Image Sequence Rendering
- Canvas-based for performance
- Viewport-aware (pauses when out of view)
- Optional preloading

### ✅ Mobile Optimizations
- Touch targets ≥44px
- Safe area insets for notched devices
- Reduced animations on low-end devices
- GPU-accelerated transforms

### ✅ Animation Components

```jsx
// Scroll-triggered reveal
<ScrollReveal direction="up" distance={100}>
  <Content />
</ScrollReveal>

// Parallax section
<ParallaxSection speed={0.5}>
  <Content />
</ParallaxSection>

// Image sequence
<ImageSequence
  sequencePath="/sequences/product"
  totalFrames={60}
  fps={30}
  autoplay
  loop
/>

// GSAP horizontal scroll
<HorizontalScroll>
  <Panel>1</Panel>
  <Panel>2</Panel>
</HorizontalScroll>
```

## Performance Tips

1. **Image Sequences**: Keep under 60 frames, use WebP/JPG
2. **Animations**: Use `will-change` sparingly
3. **Scroll**: Lenis disabled on low-end devices automatically
4. **Loading**: Lazy load heavy components with `React.lazy()`

## Build for Production

```bash
npm run build
npm run preview
```

Build includes:
- Code splitting (vendor, animations, scroll)
- Terser minification
- Console removal
- Asset inlining (<4KB)

---

Ready for deployment. 🎬
