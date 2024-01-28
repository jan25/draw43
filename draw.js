// colors
const WHITE_COL = 255;
const BLACK_COL = 0;
const GREY_COL = 150;
const DIMGREY_COL = 50;
const BG_COL = BLACK_COL;

// dims and co-ords
let CANVAS_H;
let CANVAS_W;
let CENTER_X;
let CENTER_Y;

// animation settings
const FRAME_RATE = 30;
const SLOWNESS_FAC = 175;
const ZOOM_SCALE_FAC = 6000;

// metadata
const Z_KEY = 90;
const H_KEY = 72;
const S_KEY = 83;
const DESKTOP_CTRLS = "press Z to zoom";
// TODO add mobile tap controls
const MOBILE_CTRLS = "tap to zoom";
let IS_MOBILE = false;

// inputs
const HALF_N_FREQ = 125;
const SVG_JSON_PATH = "scripts/bazieroutline_800wx700h.svg-parsed.json";

// state
let series = Series.getSampleData();
let drawn = [];
let nextSeries = [];
let [drawEnd, frequencies] = Fourier.transform(series, 2 * HALF_N_FREQ);
let zoomOn = false;
let mouseOn = false;
let showOrigSeries = false;
let stopDrawing = false;
let drawingDone = false;
let currentScale = 1;
let totalTicks;

new p5((p) => {
  // load stuff before anything is drawn. runs once before setup().
  p.preload = async () => {};

  // setup event handlers
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
    // toggle original series.
    if (p.keyCode == H_KEY && Log.DEBUG_MODE) {
      showOrigSeries = !showOrigSeries;
      Log.i(`showOrigSeries is ${showOrigSeries ? "on" : "off"}`);
    }
    // toggle drawing animation.
    if (p.keyCode == S_KEY) {
      stopDrawing = !stopDrawing;
      Log.i(`stopDrawing is ${stopDrawing ? "on" : "off"}`);
    }
  };

  // setup drawing area before drawing can begin. runs once.
  p.setup = async () => {
    const setupDims = () => {
      IS_MOBILE = p.windowWidth < 600;
      [CANVAS_H, CANVAS_W] = [p.windowHeight, p.windowWidth];
      [CENTER_X, CENTER_Y] = [CANVAS_W / 2, CANVAS_H / 2];
    };

    const computeFourier = async () => {
      // TODO Precompute and store fourier coeffs
      const plProvider = await PolylinesProvider.from(SVG_JSON_PATH);
      Log.i("total polylines", plProvider.polylines.length);
      const pl = plProvider.merge();
      const origin = pl.avg();
      // TODO scale to fit on mobile screens
      series = pl.translate(-origin.re, -origin.im).points;
      Log.i("total points", series.length);
      [drawEnd, frequencies] = Fourier.transform(series, 2 * HALF_N_FREQ);
      totalTicks = Fourier.countTicks(
        Fourier.cloneFreqMap(frequencies),
        angleIncFrac(),
        HALF_N_FREQ
      );
      Log.i("total ticks", totalTicks);
    };

    setupDims();
    computeFourier();
    p.frameRate(FRAME_RATE);
    // Setup canvas
    const canvas = p.createCanvas(
      CANVAS_W,
      CANVAS_H,
      document.getElementById("draw-area")
    );
    if (Log.DEBUG_MODE && mouseOn) {
      enableMouseDrawingInputs(canvas);
    }
  };

  // drawing loop
  p.draw = () => {
    p.background(BG_COL);
    const [centerX, centerY] = zoomOn
      ? getScaledOrigin(drawEnd.re + CENTER_X, drawEnd.im + CENTER_Y)
      : [CENTER_X, CENTER_Y];
    // TODO fix messy translates which are confusing all over. Make
    // all rendering functions pure using centerX/Y args.
    p.translate(centerX, centerY);
    p.scale(currentScale);

    if (showOrigSeries) {
      drawSeries(series);
    }

    // TODO enable for mouse mode
    // drawSeries(nextSeries);

    if (!drawingDone) {
      if (!stopDrawing) {
        animateDrawing();
      }
      showPctAndCtrls(centerX, centerY);
      if (drawn.length > totalTicks) {
        drawingDone = true;
        Log.i("Finished all ticks, stopped drawing.");
      }
    }

    drawDrawn();
  };

  showPctAndCtrls = (centerX, centerY) => {
    p.push();
    const pad = 5;
    const pct = Math.floor((drawn.length / totalTicks) * 100);
    p.textSize(12);
    p.textFont("Courier New");
    p.fill(WHITE_COL);
    p.strokeWeight(0.3);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(
      `${pct}% complete\n${IS_MOBILE ? MOBILE_CTRLS : DESKTOP_CTRLS}`,
      0,
      CANVAS_H - centerY - pad
    );
    p.pop();
  };

  animateDrawing = () => {
    let center = new Point(0, 0);

    drawArrowAndEpicycleWithCenterVector(center, frequencies.get(0));
    center = center.add(frequencies.get(0));

    // Why alternate freqs? Can these be ordered by magnitude?
    for (let f = 1; f <= HALF_N_FREQ; f += 1) {
      drawArrowAndEpicycleWithCenterVector(center, frequencies.get(f));
      center = center.add(frequencies.get(f));

      drawArrowAndEpicycleWithCenterVector(center, frequencies.get(-f));
      center = center.add(frequencies.get(-f));
    }
    drawEnd = center;
    // TODO prune
    drawn.push(drawEnd);

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

    const currentScale = 1;
    const newScale = ZOOM_SCALE_FAC / 100;

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
    for (const [f, p] of frequencies) {
      frequencies.set(f, p.mul(new Point({ abs: 1, arg: f * angleIncFrac() })));
    }
  };

  ticksToCompletion = () => {};

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
      [drawEnd, frequencies] = Fourier.transform(series, 2 * HALF_N_FREQ);
    });
  };

  drawDrawn = () => {
    p.push();

    p.stroke(WHITE_COL);
    for (const i in drawn) {
      if (i == 0) continue;
      // TODO use p5 bazier curves
      lineScaled(drawn[i - 1].re, drawn[i - 1].im, drawn[i].re, drawn[i].im);
    }

    p.pop();
  };

  drawSeries = (series, centerX, centerY) => {
    p.push();

    if (series.length === 0) {
      Log.i("skip drawing empty series");
      return;
    }

    p.translate(-centerX, -centerY);
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
    headSize = getArrowHeadSizeScaled(mag / 10);
    p.translate(mag - headSize, 0);
    p.noStroke();
    p.fill(WHITE_COL);
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
    p.strokeWeight(zoomOn ? 1 / currentScale : 1);
    p.circle(x, y, 2 * radius);
    p.pop();
  };

  lineScaled = (x1, y1, x2, y2) => {
    p.push();
    p.strokeWeight(zoomOn ? 1 / currentScale : 1);
    p.line(x1, y1, x2, y2);
    p.pop();
  };

  triangleScaled = (headSize) => {
    p.push();
    p.triangle(0, headSize / 2, headSize, 0, 0, -headSize / 2);
    p.pop();
  };

  getArrowHeadSizeScaled = (headSize) => {
    // TODO adaptive head size based on arrow length
    return headSize;
  };
});
