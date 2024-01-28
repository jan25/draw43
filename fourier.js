// Original source: https://gist.github.com/anonymous/129d477ddb1c8025c9ac

// Fourier series helpers.
const Fourier = {};

/**
 * @param  data  list of points representing a time function in 2D.
 * @param  nFreq number of sub frequency functions to split into.
 *                    excluding constant frequency function.
 * @returns [drawEnd, frequencies] Drawing end point and starting positions
 *                                      for each sub function at a frequency.
 */
Fourier.transform = (data, nFreq) => {
  const N = data.length;
  const frequencies = new Map();

  const [lowFreq, highFreq] = [
    -Math.round(nFreq / 2),
    nFreq - Math.round(nFreq / 2),
  ];
  Log.i("Fourier using frequency range:", lowFreq, highFreq);

  // drawing point
  let drawEnd = new Point(0, 0);

  // for every frequency...
  for (let freq = lowFreq; freq <= highFreq; freq++) {
    let point = new Point();

    // for every point in time...
    for (let t = 0; t < N; t++) {
      // Spin the signal _backwards_ at each frequency (as radians/s, not Hertz)
      const rate = -1 * (2 * Math.PI) * freq;

      // How far around the circle have we gone at time=t?
      const time = t / N;
      const distance = rate * time;

      // add this data point's contribution
      point = point.add(
        data[t].mul(new Point(Math.cos(distance), Math.sin(distance)))
      );
    }

    // Average contribution at this frequency
    point = point.div(N);

    drawEnd = drawEnd.add(point);
    frequencies.set(freq, point);
  }

  return [drawEnd, frequencies];
};

// Deep clones freq->point map.
Fourier.cloneFreqMap = (map) => {
  const c = new Map();
  for (const [f, p] of map) {
    c.set(f, p.clone());
  }
  return c;
};

/**
 * Counts ticks required to finish a closed 2D line drawing.
 * Used to identify terminal condition for drawing.
 * Warning: Approximation algorithm based on first 10 point overlap.
 * @param frequencies frequencies map of rotating vectors.
 * @param angleInc angle increment per tick.
 * @param halfFreqN half the count of arrows.
 */
Fourier.countTicks = (frequencies, angleInc, halfFreqN) => {
  let ticks = 0;

  const points = [];
  const advance = () => {
    let center = new Point(0, 0).add(frequencies.get(0));
    for (let f = 1; f <= halfFreqN; f += 1) {
      center = center.add(frequencies.get(f)).add(frequencies.get(-f));
    }
    points.push(center);
    for (const [f, p] of frequencies) {
      frequencies.set(f, p.mul(new Point({ abs: 1, arg: f * angleInc })));
    }
  };

  const [N, minN, maxN] = [10, 50, 10000];
  const err = 3;
  const shouldEnd = () => {
    if (points.length < minN) return false;
    if (points.length > maxN) return true;
    for (let i = 0; i < N; i++) {
      const [a, b] = [points[i], points[points.length - N + i]];
      if (a.sub(b).abs() > err) return false;
    }
    return true;
  };

  while (!shouldEnd()) {
    advance();
    ticks++;
  }
  return ticks;
};
