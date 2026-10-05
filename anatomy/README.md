# Canonical musculature ledger

`musculature.tsv` is the single anatomical authority. It contains 105 nominal
muscle/subdivision entries, including all muscles requested in Sun F1. It does
not claim an exhaustive atlas of anatomical variants in every human.

Each paired row expands to a left and right activation input. Procerus and
depressor septi nasi are the two unpaired model entries. Some anatomists describe
paired slips of depressor septi; the current nasal-base field is deliberately
midline. Counts refer to this computational partition, not a universal count of
human muscles.

Disposition counts:

| Disposition | Ledger rows | Expanded side inputs |
|---|---:|---:|
| Independent | 52 | 102 |
| Grouped | 5 | 10 |
| Excluded at current fidelity | 48 | 96 |
| Total | 105 | 208 |

Grouped inputs retain their anatomical identity and resolve to shared geometry
actuators: lacrimal orbicularis oculi → upper palpebral field; superior tarsal →
levator; superior/inferior incisivus → matching medial oral sectors; inferior
omohyoid → common-tendon superior-belly actuator. Grouped input contributions
take the maximum of alias and primary activation, rather than accidentally
duplicating one shared field. This cheap grouping is a fidelity limitation.

Excluded entries remain explicit because their geometry is absent: posterior
scalp (1), intrinsic ear cartilage (6), tongue (8), soft palate (4), SCM heads
(2), adjacent upper-neck muscles (19), eyeball rotation muscles (6), middle-ear
muscles (2). Tongue/palate can change an open-mouth view; neck muscles can change
head pose/silhouette. Exclusion means the present external mask lacks those
structures. It does not mean those muscles have no visible effect in a human.
Pharyngeal transit, laryngeal phonation, posterior trunk musculature and full
swallowing dynamics lie beyond the chosen face/upper-neck boundary.

`origin_region` and `insertion_region` describe anatomy. Their corresponding
`*_point` fields are approximate model anchors in millimetres, never measured
attachment coordinates or validated subject anatomy. `influence_radius`
describes a finite tissue envelope. `source` refers to `sources.tsv`; sources
check anatomical roles, not the invented numerical calibration. The ledger
uses ordinary anatomical facts in abbreviated descriptions, not copied atlas
tables. Attachment variation and subdivision terminology need expert review.

`field` chooses a contraction, compression, circumferential, muscle-belly,
skeletal or hyoid mechanism. All point triples and coefficient triples use
semicolon separators. Jaw coefficients are signed approximate drive gains:
opening, anterior translation, and excursion away from the active side. These
are a quasi-static reference mapping, not measured torques. Hyoid coefficients
are superior and anterior drive gains. Positive suprahyoid recruitment opens
the jaw only when inferior support stabilizes the hyoid; otherwise it elevates
the hyoid. Thyroid-related loading is approximated through the hyoid state.

The small eyelid-specific field follows the procedural elliptical lid margin,
with a smooth finite taper (28 mm laterally, at most 20 mm superiorly/inferiorly,
38 mm in depth). This is separate from the larger peri-orbital ellipsoid. Lid
closure retains 4% of the rest gap to avoid flattening thin corner triangles;
an actual eyelid thickness/contact model is the next refinement.

`seed-ledger.mjs` is a preserved one-time F1 construction attempt and refuses to
overwrite the canonical table. Later anatomical edits belong in the TSV.
`facial-mask/muscle-regions.csv` is a historical 44-region/86-input compatibility
catalog, not a second anatomical authority. The original 36 control ordinals
remain unchanged. Its old unsplit medial pterygoid input drives both new heads.
