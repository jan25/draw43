import { Log, Point, getInputJSON } from "./utils.js";
import { Fourier } from "./fourier.js";

// colors
const WHITE_COL = 255;
const BLACK_COL = 0;
const GREY_COL = 50;
const DIMGREY_COL = 150;
const DIMDIMGREY_COL = 220;
const BG_COL = WHITE_COL; // TODO use less bright col: e.g. light yellow
const LINE_COL = GREY_COL;
const ARROW_COL = DIMGREY_COL;
const EPICYC_COL = DIMDIMGREY_COL;
const TEXT_COL = BLACK_COL;

// dims and co-ords
let CANVAS_H;
let CANVAS_W;
let CENTER_X;
let CENTER_Y;
let CANVAS_PAD;
const TEXT_SIZE = 13;
const TEXT_PAD = 5;
const TEXT_STROKE = 0.4;

// animation settings
const FRAME_RATE = 30;
const SLOWNESS_FAC = 175;
const ZOOM_SCALE_FAC = 6000;

// metadata
const Z_KEY = 90;
const H_KEY = 72;
const S_KEY = 83;
const DESKTOP_CTRLS = "Press Z to toggle zoom";
// TODO add mobile tap controls
const MOBILE_CTRLS = "Tap to toggle zoom";
let IS_MOBILE = false;

// inputs
let HALF_N_FREQ;

// state
let series;
let drawn = [];
let nextSeries = [];
let frequencies;
let zoomOn = false;
let mouseOn = false;
let showOrigSeries = false;
let stopDrawing = false;
let drawingDone = false;
let currentScale = 1;
let totalTicks;

export default new p5((p) => {
  // helpers
  const h = {};

  // load stuff before anything is drawn. runs once before setup().
  p.preload = async () => {};

  // setup event handlers
  p.keyPressed = () => {
    // TODO smooth zoom in/out
    // toggle zoom.
    if (p.keyCode == Z_KEY) {
      h.toggleZoom();
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
  p.setup = () => {
    const setupDims = () => {
      IS_MOBILE = p.windowWidth < 600;
      CANVAS_PAD = IS_MOBILE ? 0 : 50;
      [CANVAS_H, CANVAS_W] = [p.windowHeight, p.windowWidth];
      [CENTER_X, CENTER_Y] = [CANVAS_W / 2, CANVAS_H / 2];
    };

    const computeFourier = () => {
      [HALF_N_FREQ, frequencies] = Fourier.decode(
        getInputJSON(),
        CANVAS_W - 2 * CANVAS_PAD,
        CANVAS_H - 2 * CANVAS_PAD
      );
      // Append initial drawEnd.
      drawn.push(Fourier.initialEnd(frequencies));
      totalTicks = Fourier.countTicks(
        Fourier.cloneFreqMap(frequencies),
        h.angleIncFrac(),
        HALF_N_FREQ
      );
      Log.i("total frequencies", 1 + 2 * HALF_N_FREQ);
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
      h.enableMouseDrawingInputs(canvas);
    }

    // turn on as default
    // h.toggleZoom();
  };

  // drawing loop
  p.draw = () => {
    p.background(BG_COL);

    let drawEnd = drawn[drawn.length - 1];
    if (!stopDrawing && !drawingDone) {
      h.advanceTime(frequencies);
      drawEnd = h.getDrawEnd(frequencies);
      drawn.push(drawEnd);
    }

    const { centerX, centerY } = zoomOn
      ? h.getScaledOrigin(drawEnd.re + CENTER_X, drawEnd.im + CENTER_Y)
      : {
          centerX: CENTER_X,
          centerY: CENTER_Y,
        };

    // TODO fix messy translates which are confusing all over. Make
    // all rendering functions pure using centerX/Y args.
    p.translate(centerX, centerY);
    p.scale(currentScale);

    // TODO remove support for hide/show original series
    // if (showOrigSeries) {
    //   h.drawSeries(series);
    // }

    // TODO enable for mouse mode
    // h.drawSeries(nextSeries);

    if (!drawingDone) {
      h.animateDrawing(stopDrawing);
      h.showPctAndCtrls(centerX, centerY);
      if (drawn.length > totalTicks) {
        drawingDone = true;
        Log.i("Finished all ticks, stopped drawing.");
      }
    }

    h.drawDrawn();
  };

  // Affine transformation: scaled zoom at a specified centerX/Y.
  // Source: https://stackoverflow.com/a/70888506
  h.getScaledOrigin = (centerX, centerY) => {
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

    return {
      centerX: CENTER_X - originShift.x,
      centerY: CENTER_Y - originShift.y,
    };
  };

  h.getDrawEnd = (frequencies) => {
    let center = new Point(0, 0).add(frequencies.get(0));
    for (let f = 1; f <= HALF_N_FREQ; f += 1) {
      center = center.add(frequencies.get(f)).add(frequencies.get(-f));
    }
    return center;
  };

  h.toggleZoom = () => {
    zoomOn = !zoomOn;
    Log.i(`zoom is ${zoomOn ? "on" : "off"}`);
    if (zoomOn) {
      currentScale = ZOOM_SCALE_FAC / 100;
    } else {
      currentScale = 1;
    }
  };

  h.showPctAndCtrls = (centerX, centerY) => {
    p.push();
    const pct = Math.floor((drawn.length / totalTicks) * 100);
    p.textSize(TEXT_SIZE / currentScale);
    p.textFont("Courier New");
    p.fill(TEXT_COL);
    p.strokeWeight(TEXT_STROKE / currentScale);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(
      `${pct}% complete\n${IS_MOBILE ? MOBILE_CTRLS : DESKTOP_CTRLS}`,
      (CENTER_X - centerX) / currentScale,
      (CANVAS_H - centerY - TEXT_PAD) / currentScale
    );
    p.pop();
  };

  h.animateDrawing = () => {
    let center = new Point(0, 0);

    h.drawArrowAndEpicycleWithCenterVector(center, frequencies.get(0));
    center = center.add(frequencies.get(0));

    // Why alternate freqs? Can these be ordered by magnitude?
    for (let f = 1; f <= HALF_N_FREQ; f += 1) {
      h.drawArrowAndEpicycleWithCenterVector(center, frequencies.get(f));
      center = center.add(frequencies.get(f));

      h.drawArrowAndEpicycleWithCenterVector(center, frequencies.get(-f));
      center = center.add(frequencies.get(-f));
    }
  };

  h.angleIncFrac = () => {
    return (2 * Math.PI) / (SLOWNESS_FAC * FRAME_RATE);
  };

  h.advanceTime = (frequencies) => {
    for (const [f, p] of frequencies) {
      frequencies.set(
        f,
        p.mul(new Point({ abs: 1, arg: f * h.angleIncFrac() }))
      );
    }
  };

  h.enableMouseDrawingInputs = (canvas) => {
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

  h.drawDrawn = () => {
    p.push();

    p.stroke(LINE_COL);
    for (const i in drawn) {
      if (i == 0) continue;
      // TODO use p5 bazier curves
      h.lineScaled(drawn[i - 1].re, drawn[i - 1].im, drawn[i].re, drawn[i].im);
    }

    p.pop();
  };

  h.drawSeries = (series, centerX, centerY) => {
    p.push();

    if (series.length === 0) {
      Log.i("skip drawing empty series");
      return;
    }

    p.translate(-centerX, -centerY);
    p.stroke(LINE_COL);
    for (let i = 1; i < series.length; i++) {
      const [start, end] = [series[i - 1], series[i]];
      h.lineScaled(start.re, start.im, end.re, end.im);
    }

    p.pop();
  };

  h.drawArrowAndEpicycleWithCenterVector = (center, vec) => {
    h.drawArrowAndEpicycle(center.re, center.im, vec.abs(), vec.arg());
  };

  h.drawArrowAndEpicycle = (x, y, mag, angle) => {
    p.push();

    h.drawArrow(x, y, mag, angle);
    h.drawEpicycle(x, y, mag);

    p.pop();
  };

  h.drawArrow = (x, y, mag, angle) => {
    p.push();

    p.stroke(ARROW_COL);
    p.translate(x, y);
    p.rotate(angle);
    h.lineScaled(0, 0, mag, 0);

    // TODO use applyMatrix to rotate and translate
    const headSize = h.getArrowHeadSizeScaled(mag / 10);
    p.translate(mag - headSize, 0);
    p.noStroke();
    p.fill(ARROW_COL);
    h.triangleScaled(headSize);

    p.pop();
  };

  h.drawEpicycle = (x, y, radius) => {
    p.push();

    p.noFill();
    p.stroke(EPICYC_COL);
    h.circleScaled(x, y, radius);

    p.pop();
  };

  h.circleScaled = (x, y, radius) => {
    p.push();
    p.strokeWeight(zoomOn ? 1 / currentScale : 1);
    p.circle(x, y, 2 * radius);
    p.pop();
  };

  h.lineScaled = (x1, y1, x2, y2) => {
    p.push();
    p.strokeWeight(zoomOn ? 2 / currentScale : 2);
    // p.strokeWeight(1);
    p.line(x1, y1, x2, y2);
    p.pop();
  };

  h.triangleScaled = (headSize) => {
    p.push();
    p.triangle(0, headSize / 2, headSize, 0, 0, -headSize / 2);
    p.pop();
  };

  h.getArrowHeadSizeScaled = (headSize) => {
    // TODO adaptive head size based on arrow length
    return headSize;
  };
});
