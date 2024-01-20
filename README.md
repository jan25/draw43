# draw43

Yet another 14feb project. This time i used a recent learning - Fourier series and usage in 2D curve drawing.

The input to the program is a svg file, which gets convered to Fourier series and gets fed to a drawing program. It then simulates functions from the series.

See demo at <TODO LINK>.

## Fourier series resources

## How I used Blender

I used blender tool to draw outline curves which is input as svg to drawing program.

How to draw bazier curves?

- Create new empty canvas
- Switch to draw mode and Add > Curves > Bazier
- Draw and adjust with controls
  - E key to continue drawing curves
  - Cmd + double scroll to zoom
  - Shift + double scroll to move across canvas
  - Note: just double scroll messes up canvas in 3D

How to export SVG?

- Select bazier curve object on right panel
- Right click on curve object and Convert > Glosy Pencil (dont remember exact name)
- Select Glosy Pencil and File > Export > Glosy Pencil as SVG (again, check name)
