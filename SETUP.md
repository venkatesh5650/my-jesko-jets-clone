# JeskoJets Cinematic Clone - Asset Setup

## ✅ Asset Structure

```
public/assets/
├── video/
│   └── globe.mp4              # Globe intro video (autoplay, muted, loop)
├── heroFrames/
│   ├── hero-0001.jpg          # Window → Clouds sequence
│   ├── hero-0002.jpg
│   └── ... (180 frames total)
└── planeFrames/
    ├── plane-0001.jpg         # Colored plane → Blueprint sequence
    ├── plane-0002.jpg
    └── ... (120 frames total)
```

## 📦 Asset Placement

### 1. Globe Video
**Location:** `public/assets/video/globe.mp4`

**Requirements:**
- Format: MP4 (H.264 codec)
- Resolution: 1920x1080 or higher
- Duration: 5-10 seconds (seamless loop)
- Size: <10MB for mobile performance

**Behavior:**
- ✅ Autoplay on page load
- ✅ Muted (required for autoplay)
- ✅ Infinite loop
- ✅ Mobile optimized (no heavy filters)

---

### 2. Hero Sequence (Window → Clouds)
**Location:** `public/assets/heroFrames/`

**Requirements:**
- Format: JPG or WebP
- Naming: `hero-0001.jpg`, `hero-0002.jpg`, ... `hero-0180.jpg`
- Resolution: Preserve original 8K clarity
- Total: 180 frames
- Size: <500KB per frame recommended

**Behavior:**
- ✅ Slow scroll-driven playback
- ✅ Maintains original frame order
- ✅ Preserves 8K clarity (no canvas downscaling)
- ✅ Lazy loading with initial frame preload
- ✅ requestAnimationFrame sync

---

### 3. Plane Morph (Colored → Blueprint)
**Location:** `public/assets/planeFrames/`

**Requirements:**
- Format: JPG or WebP
- Naming: `plane-0001.jpg`, `plane-0002.jpg`, ... `plane-0120.jpg`
- Resolution: Match source quality
- Total: 120 frames
- Size: <500KB per frame recommended

**Behavior:**
- ✅ Smooth cinematic morph
- ✅ Ease-in-out motion curve
- ✅ No canvas downscaling
- ✅ Scroll-synced playback
- ✅ Lazy loading

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Extract Assets
```bash
# Extract hero frames
unzip hero-sequence.zip -d public/assets/heroFrames/

# Extract plane morph frames
unzip plane-morph.zip -d public/assets/planeFrames/

# Place globe video
mv globe.mp4 public/assets/video/
```

### 3. Verify Frame Naming
```bash
# Hero frames should be:
ls public/assets/heroFrames/
# hero-0001.jpg, hero-0002.jpg, ... hero-0180.jpg

# Plane frames should be:
ls public/assets/planeFrames/
# plane-0001.jpg, plane-0002.jpg, ... plane-0120.jpg
```

### 4. Run Development
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 🎬 Scene Flow

### Section 1: Globe Intro (100vh)
- Video: `globe.mp4`
- Behavior: Autoplay, muted, infinite loop
- Overlay: "JeskoJets" title with cinematic fade

### Section 2: Hero Sequence (350vh scroll)
- Frames: `heroFrames/` (180 frames)
- Behavior: Scroll-synced, window → clouds
- Effects: Blur in/out, scale, smooth spring physics

### Section 3: Plane Morph (250vh scroll)
- Frames: `planeFrames/` (120 frames)
- Behavior: Scroll-synced, colored → blueprint
- Effects: Ease-in-out, smooth transition

---

## ⚡ Performance Features

### Implemented:
- ✅ **Lazy Loading**: Frames load on-demand
- ✅ **Initial Preload**: First 15-20 frames preloaded
- ✅ **requestAnimationFrame**: Smooth scroll sync
- ✅ **Mobile Optimization**: 
  - Reduced effects on mobile
  - Touch targets ≥44px
  - Safe area insets
- ✅ **Quality Preservation**: No canvas downscaling
- ✅ **GPU Acceleration**: transform3d, will-change
- ✅ **Viewport Detection**: Pauses when out of view

### Frame Loading Strategy:
```javascript
// Preload initial frames
preloadFrames: 20  // Hero sequence
preloadFrames: 15  // Plane morph

// Load frames around current position
loadFramesAround(currentFrame, range: 15-20)

// Batch loading to prevent blocking
batchSize: 5 frames per batch
```

---

## 📱 Mobile Optimizations

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Smooth Scroll | Enabled | Auto-disabled on low-end |
| Canvas Quality | High | Auto |
| Blur Effects | Full | Disabled |
| Preload Frames | 20 | 15 |
| FPS Target | 60 | 30-60 |

---

## 🔧 Customization

### Adjust Frame Counts
```jsx
// In App.jsx
<HeroSequence
  totalFrames={180}  // Your frame count
  preloadFrames={20}
/>

<PlaneMorph
  totalFrames={120}  // Your frame count
  preloadFrames={15}
/>
```

### Change Scroll Sensitivity
```jsx
<HeroSequence
  scrollSync={true}
  // Lower stiffness = smoother, more delayed
  // Higher stiffness = more responsive
/>
```

### Modify Colors
```css
/* In src/styles/global.css */
:root {
  --color-bg: #0a0a0a;
  --color-bg-secondary: #1a1a2e;
  --color-text: #ffffff;
  --color-accent: #ff6b35;
}
```

---

## 🐛 Troubleshooting

### Frames Not Loading
1. Check frame naming (zero-padded 4 digits)
2. Verify paths: `public/assets/heroFrames/`, `public/assets/planeFrames/`
3. Check browser console for 404 errors

### Video Not Playing
1. Ensure video is muted (required for autoplay)
2. Check video codec (H.264 recommended)
3. Verify path: `public/assets/video/globe.mp4`

### Performance Issues
1. Reduce frame resolution
2. Lower preloadFrames count
3. Enable mobile detection in Layout.jsx

### Scroll Sync Laggy
1. Reduce totalFrames or use lower resolution
2. Decrease preloadFrames
3. Check browser DevTools Performance tab

---

## 📊 File Structure (Final)

```
jesko-jets/
├── public/
│   └── assets/
│       ├── video/
│       │   └── globe.mp4
│       ├── heroFrames/
│       │   ├── hero-0001.jpg
│       │   ├── hero-0002.jpg
│       │   └── ... (180 frames)
│       └── planeFrames/
│           ├── plane-0001.jpg
│           ├── plane-0002.jpg
│           └── ... (120 frames)
├── src/
│   ├── components/
│   │   ├── animations/
│   │   │   ├── ScrollReveal.jsx
│   │   │   ├── SlowTransition.jsx
│   │   │   └── PlaneMorph.jsx ⭐ NEW
│   │   ├── sequences/
│   │   │   ├── OptimizedSequence.jsx ⭐ NEW
│   │   │   ├── HeroSequence.jsx ⭐ NEW
│   │   │   └── JetCinematic.jsx
│   │   ├── video/
│   │   │   └── GlobeVideo.jsx ⭐ NEW
│   │   └── layout/
│   │       └── Layout.jsx
│   ├── styles/
│   │   └── global.css
│   ├── lib/
│   │   └── smooth-scroll.js
│   ├── utils/
│   │   └── performance.js
│   ├── App.jsx ⭐ UPDATED
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── SETUP.md
```

---

**All scenes connected. Ready for deployment.** 🎬
