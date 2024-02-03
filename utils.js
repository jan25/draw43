import { default as Complex } from "./lib/complex.min.js";
import { default as aesjs } from "./lib/aes.js";
import { PRIV, PUBL } from "./input.js";

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

// Point is a vector in 2D space represented as a
// complex number for easier manipulation.
const Point = Complex;

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

class Locker {
  static lock = (dataStr, key) => {
    const keyArr = new TextEncoder().encode(key);
    var textBytes = aesjs.utils.utf8.toBytes(dataStr);
    const cnt = keyArr.reduce((a, b) => a + b, 0);
    var aesCtr = new aesjs.ModeOfOperation.ctr(keyArr, new aesjs.Counter(cnt));
    var encryptedBytes = aesCtr.encrypt(textBytes);
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  };

  static unlock = (garbage, key) => {
    const keyArr = new TextEncoder().encode(key);
    const cnt = keyArr.reduce((a, b) => a + b, 0);
    const bytes = aesjs.utils.hex.toBytes(garbage);
    const aesCtr = new aesjs.ModeOfOperation.ctr(
      keyArr,
      new aesjs.Counter(cnt)
    );
    const decryptedBytes = aesCtr.decrypt(bytes);
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  };

  static mk = (key) => {
    let small = "";
    while (small.length < 16) {
      small += key;
    }
    return small.slice(0, 16);
  };
}

// Cache within a session
class Storage {
  static set = (k, v) => {
    sessionStorage.setItem(`key:${k}`, v);
  };

  static get = (k, defaultVal = undefined) => {
    return sessionStorage.getItem(`key:${k}`) || defaultVal;
  };

  static rm = (k) => {
    sessionStorage.removeItem(`key:${k}`);
  };
}

const err = () => {
  window.location.href = "https://www.google.com/search?q=sorry";
};

const param = (k, defaultFn = () => err()) => {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has(k) ? searchParams.get(k) : defaultFn();
};

// Resolve a input JSON based on URL params
const getInputJSON = () => {
  const kind = param("k", () => "three");
  Log.i("kind", kind);

  if (kind in PRIV) {
    const key = Storage.get(kind) || prompt("Enter key");
    try {
      Storage.set(kind, key);
      return JSON.parse(Locker.unlock(PRIV[kind], Locker.mk(key)));
    } catch (e) {
      Storage.rm(kind);
      Log.e(e);
      err();
    }
  } else if (kind in PUBL) {
    return JSON.parse(PUBL[kind]);
  } else {
    // TODO show rose URL
    err();
  }
};

export { Point, Log, Polyline, Locker, getInputJSON };
