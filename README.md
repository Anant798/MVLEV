# MV—LEV / Cinematic motion experience

A React + Vite concept experience exploring magnetic levitation transport. GSAP and ScrollTrigger choreograph pinned, reversible scroll sequences; React Three Fiber and Three.js render a procedural pod placeholder and share the same scroll progress values.

## Run locally

```sh
npm install
npm run dev
```

## Model integration

The 3D scene uses a procedural concept placeholder unless `VITE_POD_MODEL_URL` points to the approved model. Place that asset at `public/models/mv-lev-pod.glb` and set `VITE_POD_MODEL_URL=/models/mv-lev-pod.glb` in `.env`. A missing or failed model load falls back to the procedural pod. The placeholder is illustrative and is not a finalized vehicle design.

Engineering diagrams and component copy are explicitly conceptual; no project performance or field measurements are asserted.
