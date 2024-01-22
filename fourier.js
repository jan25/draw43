// Original source: https://gist.github.com/anonymous/129d477ddb1c8025c9ac

// Fourier series helpers.
const Fourier = {};

/**
 * @param  data  list of points representing a time function in 2D.
 * @param  nFreq number of sub frequency functions to split into.
 *                    excluding constant frequency function.
 *
 * @returns [drawEnd, frequencies] Drawing end point and starting positions
 *                                      for each sub function at a frequency.
 */
Fourier.Transform = (data, nFreq) => {
  Log.i("data:", data);
  const N = data.length;
  const frequencies = {};

  const [lowFreq, highFreq] = [
    -Math.round(nFreq / 2),
    nFreq - Math.round(nFreq / 2),
  ];
  Log.i("using frequency range:", lowFreq, highFreq);

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
    frequencies[freq] = point;
  }

  return [drawEnd, frequencies];
};
