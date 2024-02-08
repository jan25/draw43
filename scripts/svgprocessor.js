/**
 * Helper script to convert SVG to 2D path of points and apply fourier transform.
 */
import { readFileSync, writeFileSync } from "fs";
import commandLineArgs from "command-line-args";
import pkg from "xml-js";
const { xml2js } = pkg;
import _ from "lodash";
import { Locker, Log, Polyline } from "../utils.js";
import { Fourier } from "../fourier.js";

Log.DEBUG_MODE = true;

const [WIDTH, HEIGHT] = [800, 700];
const MODE = "polygon";

const cliArgs = [
  {
    name: "input",
    alias: "i",
    type: String,
    defaultValue: "scripts/img.svg",
  },
  {
    name: "width",
    alias: "w",
    type: Number,
    defaultValue: WIDTH,
  },
  {
    name: "height",
    alias: "h",
    type: Number,
    defaultValue: HEIGHT,
  },
  {
    name: "output",
    alias: "o",
    type: String,
    defaultValue: "scripts/some.out",
  },
  { name: "num_freq", alias: "f", type: Number, defaultValue: 100 },
  {
    name: "encrypt",
    alias: "e",
    type: Boolean,
    defaultValue: false,
  },
  {
    name: "key",
    alias: "k",
    type: String,
    defaultValue: "deadbeef",
  },
];
const args = commandLineArgs(cliArgs);

const point = (x, y) => {
  return {
    x,
    y,
  };
};

const parsePolyline = (polylineElem) => {
  const pointStrs = _.split(polylineElem.attributes.points, " ");
  const points = _.map(pointStrs, (ps) => {
    const [x, y] = _.map(_.split(ps, ","), parseFloat);
    return point(x, y);
  });
  return points;
};

const scaleDim = (val, target, src) => {
  return (val * target) / src;
};

// TODO preserve aspect ratio
const scalePolylinePoints = (polyline, targetW, targetH, srcW, srcH) => {
  _.forEach(polyline, (pt) => {
    pt.x = scaleDim(pt.x, targetW, srcW);
    pt.y = scaleDim(pt.y, targetH, srcH);
  });
  return polyline;
};

const parseSvg = (filePath, width, height, mode = "polyline") => {
  const data = readFileSync(filePath, "utf8").toString();
  const xml = xml2js(data);

  const svg = elems(xml.elements, (e) => e.name == "svg")[0];

  const [svgW, svgH] = [
    parseInt(svg.attributes.width),
    parseInt(svg.attributes.height),
  ];
  // recurse into nested <g> tags
  const polylines = elems(
    elems(elems(elems(svg.elements)[0].elements)[0].elements)[0].elements,
    (e) => e.name == mode
  );

  const parsed = _.map(polylines, parsePolyline);
  const scaled = _.map(parsed, (pl) =>
    scalePolylinePoints(pl, width, height, svgW, svgH)
  );

  if (scaled.length > 1) {
    throw new Error("More than one polylines is not supported for fourier");
  }
  toFourier(scaled[0], width, height);
};

const toFourier = (polyline, width, height) => {
  const plObj = Polyline.fromRawPoints(polyline);
  const origin = plObj.avg();
  const series = plObj.translate(-origin.re, -origin.im).points;
  Log.i("applying fourier transform");

  const json = Fourier.transformAndEncode(
    series,
    2 * args.num_freq,
    width,
    height
  );
  let data = JSON.stringify(json);

  if (args.encrypt) {
    Log.i("encrypting");
    data = Locker.lock(data, Locker.mk(args.key));
  }

  const outPath = args.output;
  writeFileSync(outPath, data);
  Log.i(`Written output to ${outPath}`);
};

const elems = (elementsArr, fn = (e) => e.type == "element") => {
  return _.filter(elementsArr, fn);
};

parseSvg(args.input, args.width, args.height, MODE);
