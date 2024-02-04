## Blender

I used blender tool to draw continuous line drawing which is input as svg to drawing program.

How to draw bazier curves?

- Create new empty canvas
- Switch to draw mode and Add > Curves > Bazier
- Draw and adjust with controls
  - E key to extrude curve, G key to modify a curve
  - Cmd + double scroll to zoom
  - Shift + double scroll to move across canvas
  - Note: just double scroll messes up canvas axes in 3D

How to export SVG?

- Select bazier curve object on right panel
- Right click on curve object and Convert > Grease Pencil
- Select Grease Pencil and File > Export > Grease Pencil as SVG

## TODO

- Show % complete on zoom
- Add restart drawing option during/on finish
- make right i more accurate and the left nostril
- github pages deployment
- Make interaction simple. Loop: zoom out -> zoom in -> stop -> zoom out -> resume. zoom out on finish and disable controls. Space for desktop and Tap for mobile.
- Offline support
