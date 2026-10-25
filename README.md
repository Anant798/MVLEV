# MV—LEV / Cinematic Motion Experience

A React + Vite concept website exploring magnetic levitation transport. GSAP and ScrollTrigger choreograph the pinned, reversible scroll scenes. React Three Fiber and Three.js render the procedural pod placeholder and read the same scroll progress refs as the SVG overlays.

## Run locally

```sh
npm install
npm run dev
```

## Model integration

The 3D scenes use an illustrative procedural pod unless `VITE_POD_MODEL_URL` points to the approved model. Place that asset at `public/models/mv-lev-pod.glb` and set `VITE_POD_MODEL_URL=/models/mv-lev-pod.glb` in `.env`. A failed load falls back to the procedural model. The inspector's world-space annotation anchors are currently authored for the placeholder and may need adjustment for the supplied model.

The blueprint, magnetic visualization, diagrams, and component descriptions are conceptual. They do not represent validated engineering specifications or measured field data.
