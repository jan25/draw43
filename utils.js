LOGGER_ENABLED = false;

const Log = {};

Log.debugMode = () => {
    LOGGER_ENABLED = true;
}

// info
Log.i = (...things) => {
    if (LOGGER_ENABLED) {
        console.log(things);
    }
}

// errs
Log.e = (...things) => {
    console.error(things);
}

if (!Complex) {
    Log.e('Complex library not available');
}

// Point is a vector in 2D space represented as a
// complex number for easier manipulation.
Point = Complex