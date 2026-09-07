# Design — Afterglow Atlas

## Visual thesis

The archive is a night-sky instrument for two people: visited places glow as memory beacons over a sculptural, slow-moving atlas. The interface feels intimate and spatial, never like a dashboard or travel blog.

## World

- Ground: blue-black night with restrained mineral depth, not flat black.
- Light: warm amber marks lived memories; cool cyan marks routes and future places.
- Material: optical glass appears only where a control must float over the 3D field.
- Type: a high-contrast editorial serif for memory language, paired with a precise humanist sans for controls and metadata.
- Geometry: topographic contours, orbit lines, and point beacons. No card grid, blog feed, fake paper, or map-pin clip art.

## First viewport

The interactive atlas is the opening scene. A compact title and memory count sit at the left edge; a focused-state glass drawer occupies the right; the 3D field fills the whole viewport and responds to pointer movement. State pills along the bottom change the active memory without obscuring the field.

## Signature interaction

Selecting a state pulls its beacon into bloom, rotates the atlas toward it, and replaces the memory drawer through a soft depth-and-clip transition. The page then reveals a state-specific story composition below.

## Motion grammar

Slow orbital drift establishes atmosphere. User-triggered movement is decisive and short with exponential ease-out. Reduced-motion mode removes drift and uses immediate state changes. No infinite DOM animation and no animation of backdrop-filter.

## Glass rules

Glass is limited to the top navigation, focused-memory drawer, and audio recorder because each must stay legible over spatial content. Every surface has a translucent blue-black fill, 12–16px desktop blur, 8px mobile blur, solid fallback, and reduced-transparency fallback.

## 3D and postprocessing

React Three Fiber renders a procedural terrain disc, orbital route, and instanced beacon field within Suspense at DPR 1–2. The selected beacon alone receives high emissive intensity above the bloom threshold. One EffectComposer owns the final output, with modest Bloom before ACES tone mapping; no duplicate antialiasing stack.

## Responsive behavior

Desktop keeps the memory drawer on the right. Mobile lowers it into a bottom sheet-like panel, caps blur at 8px, reduces particle count, and preserves immediate state selection with 44px controls. The atlas remains a direct manipulation surface rather than collapsing into a list.

## Accessibility

All state choices are real buttons, the active state is announced, keyboard focus is visible, body text meets 4.5:1, and text never depends on the bloom field for contrast. Reduced motion and reduced transparency are first-class fallbacks.
