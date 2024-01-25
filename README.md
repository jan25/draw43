# draw43

Yet another 14 Feb project. This time it is 2D line drawing with Fourier series.

The input to the program is a svg file, which gets transformed to Fourier series and gets fed to a drawing program. It then simulates functions from the series as epicycles.

See demo at <TODO LINK> with debug param.

## Fourier series resources

<TODO>

## Blender

I used blender tool to draw outline curves which is input as svg to drawing program.

How to draw bazier curves?

- Create new empty canvas
- Switch to draw mode and Add > Curves > Bazier
- Draw and adjust with controls
  - E key to continue drawing curves
  - Cmd + double scroll to zoom
  - Shift + double scroll to move across canvas
  - Note: just double scroll messes up canvas axes in 3D

How to export SVG?

- Select bazier curve object on right panel
- Right click on curve object and Convert > Glosy Pencil (dont remember exact name)
- Select Glosy Pencil and File > Export > Glosy Pencil as SVG (again, check name)

## Relevant topics

Fourier transforms, Bazier curves, Affine transformation, P5js, Blender
