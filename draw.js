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
        drawArrow(0, 0, p.mouseX - 200, p.mouseY - 200);

        drawEpicycle(0, 0, p.dist(0, 0, p.mouseX - 200, p.mouseY - 200) + 12);
    }

    drawArrow = (x1, y1, x2, y2) => {
        p.push();
        p.stroke(WHITE_COL);
        p.line(x1, y1, x2, y2);

        p.translate(x2, y2);
        angle = p.atan2(y2 - y1, x2 - x1);
        p.rotate(angle);
        p.noStroke();
        p.fill(WHITE_COL);
        p.triangle(0, 6, 12, 0, 0, -6);
        p.pop()
    }

    drawEpicycle = (x1, y1, radius) => {
        p.push();
        p.noFill();
        p.stroke('powderblue');
        p.circle(x1, y1, 2 * radius);

        p.pop();
    }
});

