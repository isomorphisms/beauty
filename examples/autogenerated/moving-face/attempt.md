# Moving face: executable anatomy path

## Domain and type sketch

`Activation` is a finite value in [0,1]; `Side` is left, right, or unpaired.
`Muscle` retains anatomical identity and disposition independently of controls.
`Point` is a position in millimetres; `Direction` is a dimensionless unit vector.
`Surface` is indexed connected triangles with named landmarks and jaw weights.
`JawPose` contains opening angle, anterior translation and lateral excursion.
`HyoidPose` contains superior/anterior translation with a stabilization value.

Central operations:

- resolve expression controls → anatomical activation vector;
- solve jaw and hyoid from activation → skeletal pose;
- deform neutral surface with activation and pose → posed surface;
- project posed surface with camera → visible landmarks and triangles.

Neutral must be the identity. All paired actuators are independently addressable.
Contraction fields have finite support. Attachment coordinates are approximate
model parameters, not measured human anatomy. Skeleton transforms precede skin
fields and carry mandibular attachments along with the jaw. The modiolus combines
forces once before distributing them into nearby tissue.

## Idriç attempt

Read the canonical STYLE and railway/http intent examples in the verified
isomorphisms/Idric checkout before writing `FaceField.idric`. The small source
preserves an exact signed-millimetre contraction slice, not the full renderer.
The inspected Idriç source was `51e3892d4de59943e42e65c60a9814aba792c5d4`.
On this disposable x86-64 container, `idric --version` exited 127:
`idric: command not found`. No compiler invocation or Idriç execution passed.
An existing source checkout is not an installed compiler. No compiler build,
generated-C, RefC, Java or Gradle path was substituted.

## Narrow runtime fallback

The executable reference uses ECMAScript modules and Canvas in a standalone
browser demonstration. Node runs the same geometry module in the test suite;
the browser adds projection and inspection only. This is an explicit reference
fallback because this execution target lacks an Idriç executable and a verified
browser-graphics backend/bridge. It is not Idriç, Ick, Android or APK acceptance.
No native build occurs. The generated programs and preserved attempt live here.
`prepare-browser.mjs` only unpacks a pinned test-host browser dependency; its
Node stream/Brotli/tar interfaces are another explicit foreign-runtime boundary.
The standalone demonstration contains none of those dependencies.

## First language work

First unblock a materializable Idriç compiler artifact for the build host and
check this exact source. Then port the finite influence field with explicit
Float32 millimetres and a typed browser buffer bridge. Acceptance must compare
the field's neutral and contraction coordinates against this reference before
replacing the browser fallback; mere type-checking is insufficient.
