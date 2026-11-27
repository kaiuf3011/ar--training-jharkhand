# Blender → Unity asset pipeline — status: FOLDER STRUCTURE ONLY, NO ASSETS

No 3D assets have been modeled — there is no Blender available in this
environment, and building believable low-poly industrial assets (fire
extinguisher, electrical panel, PPE, machinery, signage) is real 3D-artist
work that a text-generation pass can't substitute for without producing
something worse than nothing. What exists is the folder layout from the
brief, ready for an artist to drop `.blend` sources into, plus the export
conventions the AR/Unity side already assumes.

```
blender/
├── Source/            .blend working files, one per asset or asset set
├── IndustrialAssets/  generic structural pieces (racks, panels, signage)
├── SafetyEquipment/   extinguishers, PPE, alarms, barriers
├── Machinery/         for the future Machinery Safety module
├── FireAssets/        fire/smoke-specific props (fire point rig, panel)
├── GasAssets/         gas cloud, confined-space entry, PPE station
├── PPE/               helmet, respirator, gloves, boots, eye protection
└── Export/            optimized FBX/glTF, this is what Unity imports
```

## What the browser prototype already defines, for reference

`prototype/core.js` draws the fire and gas scenes as flat SVG (`sceneFire`,
`sceneGas`, `sceneAssembly`) — not 3D, but it is a precise, already-agreed
spec for what each scene contains and where things sit relative to each
other (MCC-3 panel position, exit locations, PPE station layout, gas
source, confined-space entry). An asset pass should treat those functions
as the layout reference, not start from nothing.

## Export conventions for whoever builds these

- **Format:** FBX or glTF 2.0 — both import cleanly via Unity's built-in
  pipeline, no plugin required.
- **Poly budget:** keep hero interactables (extinguisher, panel, PPE
  items) under ~2k triangles; background/structural pieces under ~500.
  Mid-range Android (brief section 22) has no budget for anything higher.
- **LODs:** at minimum LOD0 (full) + LOD1 (~40%) for anything that can
  appear more than once in a scene (racks, barriers, signage).
- **Textures:** baked, power-of-two, texture-atlas shared interactables
  where possible to cut draw calls; target mobile-friendly formats
  (ASTC/ETC2 once imported into Unity, not something to bake in Blender
  itself).
- **Pivots & scale:** real-world scale (meters), pivot at the object's
  natural grab/interaction point (e.g. extinguisher pivot at the handle,
  not the geometric center) — AR placement and any procedural
  hand-tracking work later depend on this being consistent.
- **Colliders:** simple primitives (box/capsule) authored alongside the
  mesh, not physics-baked from the render mesh — mobile AR has no budget
  for mesh colliders on every prop.

## Minimal asset list for the two live scenarios

Fire & Explosion: fire source rig, smoke (particle-friendly, not a solid
mesh), electrical panel (MCC-3), CO₂/water/foam/dry-powder extinguishers,
exit signage × 2, hazard-boundary marker, assembly-point marker.

Gas & Confined Space: gas source/cloud rig, confined-space entry frame,
restricted-zone signage, PPE station (helmet, SCBA/respirator, gloves,
boots, eye protection laid out for a selection interaction), buddy-position
marker, alarm beacon.
