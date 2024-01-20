WHITE_COL = 255;
BLACK_COL = 0;
GREY_COL = 150;
DIM_GREY = 75;
BG_COL = BLACK_COL;
CANVAS_W = 1000;
CANVAS_H = 1000;
FRAME_RATE = 30;
SLOWNESS_FAC = 10;

CENTER_X = 300;
CENTER_Y = 250;

let series = Series.getData();
let drawn = [];
let nextSeries = [];
const halfNFreq = 10;
let frequencies = Fourier.Transform(series, 2 * halfNFreq);
Log.i('post frequencies calc: ', frequencies);

new p5((p) => {

    angleIncFrac = () => {
        return 2 * Math.PI / (SLOWNESS_FAC * FRAME_RATE);
    }

    advanceTime = () => {
        for (const f in frequencies) {
            frequencies[f] = frequencies[f].mul(new Point({abs: 1, arg: f * angleIncFrac()}));
        }
    }

    p.setup = () => {
        p.frameRate(FRAME_RATE);
        const canvas = p.createCanvas(CANVAS_W, CANVAS_H, document.getElementById("draw-area"));

        if (Log.DEBUG_MODE) {
            enableMouseDrawingInputs(canvas);
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

    p.draw = () => {
        Log.i('frequencies before draw:', frequencies);

        p.background(BG_COL);
        p.translate(CENTER_X, CENTER_Y);

        drawSampleSeries(series);
        drawSampleSeries(nextSeries);

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

        // mag = p.dist(0, 0, p.mouseX - 200, p.mouseY - 200);
        // angle = p.atan2(p.mouseY - 200, p.mouseX - 200);
        // drawArrowAndEpicycle(0, 0, mag, angle);

        advanceTime();
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

    drawSampleSeries = (series) => {
        p.push()

        Log.i('sample series:', series);
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

