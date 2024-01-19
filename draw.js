WHITE_COL = 255;
BLACK_COL = 0;
GREY_COL = 150;
BG_COL = BLACK_COL;
CANVAS_W = 500
CANVAS_H = 500

new p5((p) => {
    x = 0;

    p.setup = () => {
        p.createCanvas(CANVAS_W, CANVAS_H, document.getElementById("draw-area"));
    }

    p.draw = () => {
        p.background(BG_COL);

        p.translate(200, 200);
        mag = p.dist(0, 0, p.mouseX - 200, p.mouseY - 200);
        angle = p.atan2(p.mouseY - 200, p.mouseX - 200);
        drawArrowAndEpicycle(0, 0, mag, angle);
        // drawArrow(0, 0, p.mouseX - 200, p.mouseY - 200);

        // drawEpicycle(0, 0, p.dist(0, 0, p.mouseX - 200, p.mouseY - 200) + 12);
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
        p.rotate(angle);
        p.line(x, y, x + mag, y);

        // TODO use applyMatrix to rotate and translate
        // TODO use adaptive headSize based on arrow length so Smaller arrow have visible heads
        headSize = mag / 10;
        p.translate(x + mag - headSize, y);
        p.noStroke();
        p.fill(WHITE_COL);
        p.triangle(0, headSize / 2, headSize, 0, 0, -headSize / 2);

        p.pop()
    }

    drawEpicycle = (x, y, radius) => {
        p.push();

        p.noFill();
        p.stroke('powderblue');
        p.circle(x, y, 2 * radius);

        p.pop();
    }
});

