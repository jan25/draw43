
if (typeof Complex === 'undefined') {
    Log.e('Complex library not available');
}

// Point is a vector in 2D space represented as a
// complex number for easier manipulation.
Point = Complex

// Logger utilities.
const Log = {};

Log.DEBUG_MODE = false;

// info
Log.i = (...things) => {
    if (Log.DEBUG_MODE) {
        console.log(...things);
    }
}

// errs
Log.e = (...things) => {
    console.error(...things);
}

// Input time function utilities.
const Series = {}

Series.parseSvg = () => {
    // TODO
}

Series.getData = () => {
    const y = 100;
    const [x1, x2] = [-200, 200];

    // IDEA: cache fourier frequencies between renders.
    data = [];
    for (let x = x1; x <= x2; x += 0.3) {
        data.push(new Point(x, y));
    }
    return data;
}