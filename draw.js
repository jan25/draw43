WHITE_COL = 255;
BLACK_COL = 0;
GREY_COL = 150;
BG_COL = BLACK_COL;
CANVAS_W = 1000
CANVAS_H = 1000
FRAME_RATE = 30 
SLOWNESS_FAC = 10

const Series = {}

Series.parseSvg = () => {
    // TODO
}

Series.getData = () => {
    const y = 450;
    const [x1, x2] = [50, 450];

    // IDEA: cache fourier frequencies between renders.
    data = [];
    for (let x = x1; x <= x2; x += 1) {
        data.push(new Point(x, y));
    }
    return data;
}

const series = Series.getData();
const drawn = [];
const halfNFreq = 5;
const frequencies = Fourier.Transform(series, 2 * halfNFreq);
Log.i('post frequencies calc: ', frequencies);

new p5((p) => {

    angleIncFrac = () => {
        return 2 * Math.PI / (SLOWNESS_FAC * FRAME_RATE);
    }

    advanceTime = () => {
        for (const f in frequencies) {
            frequencies[f] = frequencies[f].mul(new Point({abs: 1, arg: f * angleIncFrac()}))
        }
    }

    p.setup = () => {
        p.frameRate(FRAME_RATE);
        p.createCanvas(CANVAS_W, CANVAS_H, document.getElementById("draw-area"));
    }

    p.draw = () => {
        Log.i('frequencies before draw:', frequencies);

        p.background(BG_COL);
        p.translate(300, 200);

        drawSampleSeries();

        const [centerX, centerY] = [0, 0];
        center = new Point(centerX, centerY);

        drawArrowAndEpicycleWithCenterVector(center, frequencies[0]);
        center = center.add(frequencies[0]);
        Log.i('center', center);

        for (let f = 1; f <= halfNFreq; f += 1) {
            drawArrowAndEpicycleWithCenterVector(center, frequencies[f]);
            center = center.add(frequencies[f])
            Log.i('center', center);

            drawArrowAndEpicycleWithCenterVector(center, frequencies[-f]);
            center = center.add(frequencies[-f])
            Log.i('center', center);
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

    drawSampleSeries = () => {
        p.push()

        p.stroke(WHITE_COL);
        const [start, end] = [series[0], series[series.length - 1]];
        p.line(start.re, start.im, end.re, end.im);

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
        // p.rotate(angle);
        headSize = mag / 10;
        p.translate(mag - headSize, 0);
        p.noStroke();
        p.fill(WHITE_COL);
        p.triangle(0, headSize / 2, headSize, 0, 0, -headSize / 2);

        p.pop()
    }

    drawEpicycle = (x, y, radius) => {
        // Log.i('drawArrow:', x, y, radius);
        p.push();

        p.noFill();
        p.stroke('powderblue');
        p.circle(x, y, 2 * radius);

        p.pop();
    }
});

