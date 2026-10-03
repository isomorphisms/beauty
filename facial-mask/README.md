# Facial mask

A numerical face model for expression work.

The model is deliberately split into four layers:

1. **Neutral mask** — a subject-specific neutral head/face surface, derived from neutral references rather than an already-expressive face.
2. **Anatomical actuators** — muscle regions with independently addressable left/right activation where useful.
3. **Expression vector** — a compact 36-control interface for the first APK. These controls drive the anatomical layer; they are not the anatomy itself.
4. **Rendering** — light, line, tone, and other cartoon/painterly choices. Rendering must not be baked into the geometry or expression state.

The intended pipeline is:

```
neutral geometry
    ↓
muscle activation q
    ↓
soft-tissue deformation
    ↓
posed facial surface
    ↓
cartoon / painterly lighting
```

## State

Let

- `V0` be the neutral surface vertices;
- `q ∈ [0,1]^N` be anatomical muscle-region activations;
- `c ∈ [0,1]^36` be the user-facing control vector;
- `M(c)` map the 36 controls to anatomical activation;
- `D(V0, q, θ)` deform the surface using subject parameters `θ`;
- `L(...)` render the resulting geometry.

Then

```
q = M(c)
V = D(V0, q, θ)
image = L(V, camera, lights, style)
```

`M` and `D` are expected to be nonlinear. A visible expression can be produced by several different muscle states, and the same activation can look different on different faces.

## Anatomical discretization

`muscle-regions.csv` defines 44 computational muscle regions expanding to **86 independently addressable actuators** after laterality is applied. Some anatomical muscles are split into regions because a single scalar is not enough for useful facial deformation.

This is a computational partition, not a claim that every row is a separately named anatomical muscle.

Included:

- brow and forehead;
- eyelid closure and opening;
- nose and nostril motion;
- upper/lower lip, mouth corner, cheek, chin, and buccal motion;
- platysma;
- jaw opening, closing, protrusion, and lateral excursion;
- auricular muscles.

Not yet modeled:

- subject-specific origins, insertions, fiber paths, fascia, fat pads, ligaments, skin thickness, and bone geometry;
- eyeball gaze / extraocular muscles;
- tongue deformation;
- measured force-length and force-velocity parameters.

Those belong in later geometry and tissue files rather than being guessed here.

## First control surface

`controls.csv` fixes the order of the first **36 numerical controls**. The first APK should expose these as sliders and support at least:

- reset to neutral;
- save/load expression vectors;
- export the 36-vector;
- independent left/right editing where specified.

The 36 controls are a practical interface into the 86-actuator layer. They should remain replaceable; scientific anatomy is below them.

## Geometry convention

For a neutral head:

- +X: subject's left;
- +Y: superior;
- +Z: anterior;
- units: millimetres;
- origin: midpoint between left and right tragion unless a later mesh format specifies a stronger convention.

Every future attachment/fiber record should carry:

```
subject
muscle_region
side
origin/attachment coordinates
fiber direction or path
surface/tissue influence field
activation
source/provenance
uncertainty
```

Do not infer muscle attachment coordinates from a stylized drawing. Fit anatomy to neutral references first, then fit the rendered pilot or other character to the resulting subject model.

## Separation from art style

Expression should be reproducible from numerical state before toon/painterly light is applied. This lets us ask separately:

- What did the face physically do?
- What did the chosen lighting/style make that geometry look like?
- Which different actuator vectors produce nearly the same visible expression?

That separation is the point of this branch.
