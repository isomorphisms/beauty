# Sun F1: facial musculature → moving face

Result: the reference facial deformation path is executable and verified.
This completes F1 at the documented procedural-mask fidelity. It does not
claim a validated medical simulator, measured human fit, native build or APK.

## Exact source identities

- Refreshed main: `284043fb43f1113a7be1164623be5678a8c50a85`.
- Actual implementation starting head, `facial-mask`:
  `b510c4f22b8751537b65b042dca1ac86b0c2a648`.
- Implemented and structurally verified source:
  `a7f115473d69c8c362ea7e1636ebffb216452d50`.
- Evidence-only receipt commit: `5d1879e6f666e1d53033de21d642f160c1d14468`.
- Duplicate-copy cleanup commit: `e022b882bc6c3fd2cdf5ccc244d7b0fda67c5c6a`.
  Neither changes anatomy, runtime or demo code. Subsequent receipt edits only
  correct the changed-file manifest and record these exact identities; the live
  final branch head is available from the associated PR/commit history.
- Canonical ledger SHA-256:
  `8841ed0342c6fae5849300ec841aad8950970678f9a3e79cd14e50e782fd6f8b`.
- Self-contained demo SHA-256:
  `49e3893ada9e160de9b2638fc7476bd8a43ee406a398d076c54c1b531f96d8fe`.

## What now executes

The unchanged 36 control ordinals recruit a larger anatomical activation vector.
Independent left/right recruitment resolves jaw opening/elevation, protrusion,
retrusion, and both excursions, with a separate hyoid-support state. A rigid
mandible moves its skeleton landmarks and propagates through a finite attachment
transition into chin, lips, cheeks and the submandibular surface.

Skin deformation follows approximate anchors and finite tissue fields. Orbicular
fields contract circumferentially; buccinator compresses cheek tissue; mentalis
raises and protrudes the chin/lower lip. Masseter/temporalis belly fields shorten
longitudinally and expand transversely with an isochoric local tensor. Separate
temporalis fans and pterygoid heads have distinct skeletal contributions.
The modiolus combines corner-muscle, oral-sphincter and buccinator loading before
distributing one shared corner displacement. Expressions never select canned
mesh morphs.

The procedural mask has 2229 connected vertices, 4184 triangles, eye/mouth
apertures, a separate mandibular structure and visible hyoid/debug landmarks.
The anatomy view identifies the selected actuator, anchors and influence field.

## Anatomical accounting

| Category | Canonical rows | Expanded side inputs |
|---|---:|---:|
| Independent | 52 | 102 |
| Grouped | 5 | 10 |
| Deliberately excluded | 48 | 96 |
| Total | 105 | 208 |

All explicitly requested muscles/subdivisions are accounted for. Grouped entries
are lacrimal orbicularis oculi, superior tarsal, both incisivus muscles, and the
inferior omohyoid belly. Exclusions cover absent posterior scalp (1), intrinsic
ear-cartilage topology (6), tongue (8), soft palate (4), SCM heads (2), adjacent
upper-neck muscles (19), independent eyeball rotation (6), and middle ear (2).
Each excluded entry retains its mechanical role and visibility decision in the
canonical TSV. No swallowing simulator was added. Counts follow the current
nominal partition and are not a claim to enumerate every anatomical variant.

## Verification

PASS: `test.mjs`, 25 structural/behavior tests, including every independent
actuator, all required anatomical entries, all historical 86 inputs, all 36
controls, grouping, laterality, neutral identity, connected mesh, contraction
direction/locality, jaw rigidity and closing against opening recruitment,
hyoid fixation, posterior temporalis action, unilateral pterygoid excursion,
masseter ramus bulging, circumferential lips, lid closure versus squint, mentalis,
shared modiolus loading, projected landmark directions, all representative
expressions, maximal co-recruitment and 24 deterministic mixed recruitment sets.
No tested fixture had NaNs, inverted triangles or disconnected components.
The stored terminal result is `structural-tests.txt`.

PASS: `make-demo.mjs --check`: bundled HTML exactly matches canonical ledger,
controls and runtime source. Stored result: `demo-bundle-check.txt`.

PASS: `render-test.mjs`, 23 CPU Canvas fixtures, including neutral. Non-neutral
fixtures change real rendered face pixels. Separate numerical receipts and
images live under `canvas/`.

PASS: `browser-test.mjs`, actual bundled HTML executed in Chromium; 21 expression
and jaw-motion fixtures changed real face pixels. Also verified independent
versus bilateral activation, animation, exact neutral-pixel reset, camera drag,
front-view reset, zero browser runtime errors, and no horizontal overflow at
576 × 1152. Browser receipts/screenshots live under `browser/`, including the
phone-width screenshot. This is viewport acceptance on a container, not execution
on the user's phone.

Host runtime: Node 24.19.0 and Chromium 153.0.8010.0 from the pinned
`@sparticuz/chromium@153.0.0` test-host package. Chromium binary SHA-256:
`53a15d6c3a3d27dfb54c4ba60278b1683136f70cf1e67e989da7dfbd3d451ef0`.
The default Playwright browser download failed; the packaged binary was unpacked
without restoring archive owners, and then actual browser execution passed.

Idriç: BLOCKED on this execution host: `idric --version` exited 127 because no
compiler executable was installed. The source attempt, exact inspected Idriç
revision, type sketch and justified reference fallback are preserved in
`examples/autogenerated/moving-face/`. Node/browser evidence is not Idriç,
Ick, Android, native compilation or physical-device evidence.

The added workflow checks the exact PR head's structural tests and demo freshness.
Hosted run status must be taken from live GitHub, not inferred from these local
results. Browser/Canvas runs above are local evidence; they are not hosted CI.

## Demonstration and changed files

Open `demo/moving-face.html` directly in a browser. Source modules, test programs
and the preserved Idriç attempt live under `examples/autogenerated/moving-face/`.
`anatomy/musculature.tsv` is the canonical machine-readable anatomy; provenance
and disposition explanations sit beside it. `README.md` and `facial-mask/README.md`
now point to the executable path. A structural GitHub workflow was added.
`changed-files.txt` lists every path changed from the starting `facial-mask` SHA.

## Reconciliation

Live inspection found only main and facial-mask, with zero open or closed PRs.
No AGENTS.md, STYLE.md, geometry, executable controls, rendering engine, tests,
image/RMS machinery or hidden uncommitted work existed in this checkout.

The existing facial-mask specification, 44-region catalog and 36-control vector
are retained in ancestry. All original activation inputs remain addressable;
the old unsplit medial-pterygoid input resolves to the two new heads. The old
region catalog is explicitly a compatibility view, and the TSV is now the sole
anatomical authority. The implementation extends the existing facial-mask branch
rather than publishing another competing model. No existing PR needed closing,
no branch was deleted, and main was not merged or rewritten.

## Limits and next useful refinement

Attachments, force gains, soft-tissue parameters and the neutral face are
approximate. The jaw is a quasi-static hinge/glide reference rather than a TMJ
contact solver; thyroid loading is approximated through hyoid state. Grouping is
cheap and intentionally loses some local function. Belly tensors preserve local
volume before finite-envelope blending; whole-skin volume is not proven exact.
The triangle-strain guard can attenuate strong combinations (bilateral smile
uses a 0.5 tissue scale). Blink retains 4% of the rest gap to protect thin
lid-corner triangles. No independent head pose, tongue, palate or intrinsic ear
cartilage geometry is claimed.

Next smallest material fidelity improvement: replace the coarse perioral and
eyelid aperture rings with a better neutral mask whose lip/lid topology and
attachment weights support full contraction and contact without global tissue
attenuation. Keep the same anatomy/control interface and add seam/contact and
regional-volume acceptance fixtures before refining TMJ dynamics.
