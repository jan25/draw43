// colors
const WHITE_COL = 255;
const BLACK_COL = 0;
const GREY_COL = 150;
const DIMGREY_COL = 50;
const BG_COL = BLACK_COL;

// dims and co-ords
// TODO full screen
const CANVAS_W = 800;
const CANVAS_H = 800;
const CENTER_X = CANVAS_W / 2;
const CENTER_Y = CANVAS_H / 2;

// animation settings
const FRAME_RATE = 30;
const SLOWNESS_FAC = 50;
const ZOOM_SCALE_FAC = 1000;

// metadata
const Z_KEY = 90;

// inputs
const HALF_N_FREQ = 10;
const SVG_JSON_PATH = "scripts/bazieroutline_staticcopy.svg-parsed.json";

// state
let series = Series.getData();
let drawn = [];
let nextSeries = [];
let [drawEnd, frequencies] = Fourier.Transform(series, 2 * HALF_N_FREQ);
let zoomOn = false;
let currentScale = 1;

let polylines;

new p5((p) => {
  p.preload = () => {
    fetch(SVG_JSON_PATH)
      .then((resp) => resp.json())
      .then((json) => {
        const polylines = json.polylines;
        Log.i(`loaded ${polylines.length} polylines`);
      });
  };

  p.setup = () => {
    p.frameRate(FRAME_RATE);
    const canvas = p.createCanvas(
      CANVAS_W,
      CANVAS_H,
      document.getElementById("draw-area")
    );

    if (Log.DEBUG_MODE) {
      enableMouseDrawingInputs(canvas);
    }
  };

  p.keyPressed = () => {
    // toggle zoom.
    if (p.keyCode == Z_KEY) {
      zoomOn = !zoomOn;
      Log.i(`zoom is ${zoomOn ? "on" : "off"}`);
      if (zoomOn) {
        currentScale = ZOOM_SCALE_FAC / 100;
      } else {
        currentScale = 1;
      }
    }
  };

  p.draw = () => {
    p.background(BG_COL);
    const [centerX, centerY] = zoomOn
      ? getScaledOrigin(drawEnd.re + CENTER_X, drawEnd.im + CENTER_Y)
      : [CENTER_X, CENTER_Y];
    p.translate(centerX, centerY);
    p.scale(currentScale);

    if (zoomOn) {
      // p.translate(drawEnd.re, drawEnd.im);
      p.scale(ZOOM_SCALE_FAC / 100);
      // p.translate(CENTER_X, CENTER_Y);
    }

    drawSeries(series);
    drawSeries(nextSeries);

    center = new Point(0, 0);

    drawArrowAndEpicycleWithCenterVector(center, frequencies[0]);
    center = center.add(frequencies[0]);

    // Why alternate freqs? Can these be ordered by magnitude?
    for (let f = 1; f <= HALF_N_FREQ; f += 1) {
      drawArrowAndEpicycleWithCenterVector(center, frequencies[f]);
      center = center.add(frequencies[f]);

      drawArrowAndEpicycleWithCenterVector(center, frequencies[-f]);
      center = center.add(frequencies[-f]);
    }
    drawEnd = center;
    // TODO prune
    drawn.push(drawEnd);
    drawDrawn();

    advanceTime();
  };

  // Affine transformation: scaled zoom at a specified centerX/Y.
  // Source: https://stackoverflow.com/a/70888506
  getScaledOrigin = (centerX, centerY) => {
    // the center position relative to the scaled/shifted scene
    let viewCenterPos = {
      x: centerX - CENTER_X,
      y: centerY - CENTER_Y,
    };

    currentScale = 1;
    newScale = ZOOM_SCALE_FAC / 100;

    // determine the new origin
    let originShift = {
      x: (viewCenterPos.x / currentScale) * (newScale - currentScale),
      y: (viewCenterPos.y / currentScale) * (newScale - currentScale),
    };

    return [CENTER_X - originShift.x, CENTER_Y - originShift.y];
  };

  angleIncFrac = () => {
    return (2 * Math.PI) / (SLOWNESS_FAC * FRAME_RATE);
  };

  advanceTime = () => {
    for (const f in frequencies) {
      frequencies[f] = frequencies[f].mul(
        new Point({ abs: 1, arg: f * angleIncFrac() })
      );
    }
  };

  enableMouseDrawingInputs = (canvas) => {
    canvas.mousePressed(() => {
      nextSeries = [];
    });
    canvas.mouseMoved(() => {
      if (p.mouseIsPressed) {
        nextSeries.push(new Point(p.mouseX - CENTER_X, p.mouseY - CENTER_Y));
      }
    });
    canvas.mouseReleased(() => {
      series = nextSeries;
      nextSeries = [];
      drawn = [];
      [drawEnd, frequencies] = Fourier.Transform(series, 2 * HALF_N_FREQ);
    });
  };

  drawDrawn = () => {
    p.push();

    p.stroke("red");
    for (const i in drawn) {
      if (i == 0) continue;
      // TODO use p5 bazier curves
      lineScaled(drawn[i - 1].re, drawn[i - 1].im, drawn[i].re, drawn[i].im);
    }

    p.pop();
  };

  drawSeries = (series) => {
    p.push();

    if (series.length === 0) {
      Log.i("skip drawing empty series");
      return;
    }

    p.stroke(WHITE_COL);
    for (let i = 1; i < series.length; i++) {
      const [start, end] = [series[i - 1], series[i]];
      lineScaled(start.re, start.im, end.re, end.im);
    }

    p.pop();
  };

  drawArrowAndEpicycleWithCenterVector = (center, vec) => {
    drawArrowAndEpicycle(center.re, center.im, vec.abs(), vec.arg());
  };

  drawArrowAndEpicycle = (x, y, mag, angle) => {
    p.push();

    drawArrow(x, y, mag, angle);
    drawEpicycle(x, y, mag);

    p.pop();
  };

  drawArrow = (x, y, mag, angle) => {
    p.push();

    p.stroke(WHITE_COL);
    p.translate(x, y);
    p.rotate(angle);
    lineScaled(0, 0, mag, 0);

    // TODO use applyMatrix to rotate and translate
    // TODO use adaptive headSize based on arrow length - make smaller arrow heads visible
    headSize = getArrowHeadSizeScaled(mag / 10);
    p.translate(mag - headSize, 0);
    triangleScaled(headSize);

    p.pop();
  };

  drawEpicycle = (x, y, radius) => {
    p.push();

    p.noFill();
    p.stroke(DIMGREY_COL);
    circleScaled(x, y, radius);

    p.pop();
  };

  circleScaled = (x, y, radius) => {
    p.push();
    p.strokeWeight(zoomOn ? 1 / (currentScale * 10) : 1);
    p.circle(x, y, 2 * radius);
    p.pop();
  };

  lineScaled = (x1, y1, x2, y2) => {
    p.push();
    p.strokeWeight(zoomOn ? 1 / (currentScale * 10) : 1);
    p.line(x1, y1, x2, y2);
    p.pop();
  };

  triangleScaled = (headSize) => {
    p.push();
    p.noStroke();
    p.fill(WHITE_COL);
    p.triangle(0, headSize / 2, headSize, 0, 0, -headSize / 2);
    p.pop();
  };

  getArrowHeadSizeScaled = (headSize) => {
    return zoomOn ? headSize / currentScale : headSize;
  };
});
