if (typeof Complex === "undefined") {
  Log.e("Complex library not available");
}

// Point is a vector in 2D space represented as a
// complex number for easier manipulation.
const Point = Complex;

// Logger utilities.
const Log = {};

Log.DEBUG_MODE = false;

// info
Log.i = (...things) => {
  if (Log.DEBUG_MODE) {
    console.log(...things);
  }
};

// errs
Log.e = (...things) => {
  console.error(...things);
};

// Input time function utilities.
const Series = {};

Series.getSampleData = () => {
  const y = 100;
  const [x1, x2] = [-200, 200];

  // IDEA: cache fourier frequencies between renders.
  data = [];
  for (let x = x1; x <= x2; x += 0.3) {
    data.push(new Point(x, y));
  }
  return data;
};

// Svg/Polyline utilities.
class PolylinesProvider {
  constructor(polylines, baseW, baseH) {
    this.polylines = polylines;
    this.baseW = baseW;
    this.baseH = baseH;
  }

  static from = async (jsonPath) => {
    return await fetch(jsonPath)
      .then((resp) => resp.json())
      .then((json) => {
        const { polylines, width, height } = json;
        Log.i(`loaded ${polylines.length} polylines`);
        const typedPolylines = [];
        for (const pl of polylines) {
          typedPolylines.push(Polyline.fromRawPoints(pl));
        }
        return new PolylinesProvider(typedPolylines, width, height);
      });
  };

  scale = (targetW, targetH) => {
    const scaled = [];
    const scaleAmt = Math.min(targetH / this.baseH, targetW / this.baseW);
    for (const pl of this.polylines) {
      scaled.push(pl.scale(scaleAmt));
    }
    return new PolylinesProvider(scaled, targetW, targetH);
  };

  merge = () => {
    let m = new Polyline([]);
    for (const pl of this.polylines) {
      m = m.merge(pl);
    }
    return m;
  };
}

class Polyline {
  constructor(points) {
    this.points = points;
  }

  static fromRawPoints = (rawPoints) => {
    const points = [];
    for (const p of rawPoints) {
      points.push(new Point(p.x, p.y));
    }
    return new Polyline(points);
  };

  scale = (factor) => {
    const points = [];
    for (const p of this.points) {
      points.push(p.mul(factor));
    }
    return new Polyline(points);
  };

  translate = (x, y) => {
    const t = new Point(x, y);
    const points = [];
    for (const p of this.points) {
      points.push(p.add(t));
    }
    return new Polyline(points);
  };

  merge = (otherPl) => {
    this.points = this.points.concat(otherPl.points);
    return this;
  };

  // compute center.
  avg = () => {
    let [reMin, reMax, imMin, imMax] = [100000, 0, 100000, 0];
    for (const p of this.points) {
      reMin = Math.min(reMin, p.re);
      imMin = Math.min(imMin, p.im);
      reMax = Math.max(reMax, p.re);
      imMax = Math.max(imMax, p.im);
    }
    return new Point((reMin + reMax) / 2, (imMin, imMax) / 2);
  };
}
