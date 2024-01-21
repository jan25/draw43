WHITE_COL = 255;
BLACK_COL = 0;
GREY_COL = 150;
DIM_GREY = 75;
BG_COL = BLACK_COL;
CANVAS_W = 1000;
CANVAS_H = 1000;
FRAME_RATE = 30;
SLOWNESS_FAC = 10;
ZOOM_SCALE_FAC = 300;
Z_KEY = 90;

CENTER_X = 300;
CENTER_Y = 250;

let series = Series.getData();
let drawn = [];
let nextSeries = [];
const halfNFreq = 15;
let frequencies = Fourier.Transform(series, 2 * halfNFreq);
Log.i('post frequencies calc: ', frequencies);
let zoomOn = false;

new p5((p) => {


    p.setup = () => {
        p.frameRate(FRAME_RATE);
        const canvas = p.createCanvas(CANVAS_W, CANVAS_H, document.getElementById("draw-area"));

        if (Log.DEBUG_MODE) {
            enableMouseDrawingInputs(canvas);
        }
    }

    p.keyPressed = () => {
        // toggle zoom.
        if (p.keyCode == Z_KEY) {
            zoomOn = !zoomOn;
            Log.i(`zoom is ${zoomOn ? 'on' : 'off'}`);
        }
    }

    p.draw = () => {
        p.background(BG_COL);
        p.translate(CENTER_X, CENTER_Y);

        if (zoomOn) {
            let [zoomX, zoomY] = [frequencies[0].re, frequencies[0].im];
            for (let f = 1; f <= halfNFreq; f += 1) {
                zoomX += frequencies[f].re + frequencies[-f].re;
                zoomY += frequencies[f].im + frequencies[-f].re;
            }
            p.translate(zoomX, zoomY);
            p.scale(ZOOM_SCALE_FAC / 100);
            p.translate(CENTER_X, CENTER_Y);
        }

        drawSeries(series);
        drawSeries(nextSeries);

        const [centerX, centerY] = [0, 0];
        center = new Point(centerX, centerY);

        drawArrowAndEpicycleWithCenterVector(center, frequencies[0]);
        center = center.add(frequencies[0]);

        for (let f = 1; f <= halfNFreq; f += 1) {
            drawArrowAndEpicycleWithCenterVector(center, frequencies[f]);
            center = center.add(frequencies[f])

            drawArrowAndEpicycleWithCenterVector(center, frequencies[-f]);
            center = center.add(frequencies[-f])
        }
        // TODO prune
        drawn.push(center);
        drawDrawn();

        advanceTime();
    }

    angleIncFrac = () => {
        return 2 * Math.PI / (SLOWNESS_FAC * FRAME_RATE);
    }

    advanceTime = () => {
        for (const f in frequencies) {
            frequencies[f] = frequencies[f].mul(new Point({abs: 1, arg: f * angleIncFrac()}));
        }
    }

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
            frequencies = Fourier.Transform(series, 2 * halfNFreq);
        });
    }

    drawDrawn = () => {
        p.push()

        p.stroke('red');
        p.strokeWeight(2);
        for (const i in drawn) {
            if (i == 0) continue;
            // TODO use p5 bazier curves
            p.line(drawn[i - 1].re, drawn[i - 1].im, drawn[i].re, drawn[i].im);
        }

        p.pop()
    }

    drawSeries = (series) => {
        p.push()

        if (series.length === 0) {
            Log.i('skip drawing empty series');
            return;
        }

        p.stroke(WHITE_COL);
        for (let i = 1; i < series.length; i++) {
            const [start, end] = [series[i - 1], series[i]];
            p.line(start.re, start.im, end.re, end.im);
        }

        p.pop()
    }

    drawArrowAndEpicycleWithCenterVector = (center, vec) => {
        drawArrowAndEpicycle(center.re, center.im, vec.abs(), vec.arg());
    }

    drawArrowAndEpicycle = (x, y, mag, angle) => {
        p.push()

        drawArrow(x, y, mag, angle);
        drawEpicycle(x, y, mag); 

        p.pop()
    }

    drawArrow = (x, y, mag, angle) => {
        p.push();

        p.stroke(WHITE_COL);
        p.translate(x, y);
        p.rotate(angle);
        p.line(0, 0, mag, 0);

        // TODO use applyMatrix to rotate and translate
        // TODO use adaptive headSize based on arrow length so Smaller arrow have visible heads
        headSize = mag / 10;
        p.translate(mag - headSize, 0);
        p.noStroke();
        p.fill(WHITE_COL);
        p.triangle(0, headSize / 2, headSize, 0, 0, -headSize / 2);

        p.pop()
    }

    drawEpicycle = (x, y, radius) => {
        p.push();

        p.noFill();
        p.stroke(DIM_GREY);
        p.circle(x, y, 2 * radius);

        p.pop();
    }
});

