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

const [WIDTH, HEIGHT] = [800, 700];
const MODE = "polygon";

const cliArgs = [
  { name: "mode", alias: "m", type: String, defaultValue: "file" },
  {
    name: "input",
    alias: "i",
    type: String,
    defaultValue: "scripts/bazieroutline_800wx700h.svg",
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

const scalePolylinePoints = (polyline, targetW, targetH, srcW, srcH) => {
  _.forEach(polyline, (pt) => {
    pt.x = scaleDim(pt.x, targetW, srcW);
    pt.y = scaleDim(pt.y, targetH, srcH);
  });
  return polyline;
};

const parseSvg = (path, width, height, mode = "polyline") => {
  const data = readFileSync(path, "utf8").toString();
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

  if (args.mode == "file") {
    writeToFile(scaled, width, height);
    return;
  }

  if (args.mode === "fourier") {
    if (scaled.length > 1) {
      throw new Error("More than one polylines is not supported for fourier");
    }
    toFourier(scaled[0]);
    return;
  }

  throw new Error("Invalid mode: " + args.mode);
};

const toFourier = (polyline) => {
  const plObj = Polyline.fromRawPoints(polyline);
  const origin = plObj.avg();
  const series = plObj.translate(-origin.re, -origin.im).points;
  console.log("applying fourier transform");

  const json = Fourier.transformAndEncode(series, 2 * args.num_freq);
  let data = JSON.stringify(json);

  if (args.encrypt) {
    console.log("encrypting");
    data = Locker.lock(data, Locker.mk(args.key));
  }

  const outPath = args.output;
  writeFileSync(outPath, data);
  console.log(`Written output to ${outPath}`);
};

// TODO get rid of raw point writes to file
const writeToFile = (polylines, width, height) => {
  const outPath = args.output;
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        polylines,
        width,
        height,
      },
      null,
      /*space*/ 2
    )
  );
  console.log(`Written output to ${outPath}`);
};

const elems = (elementsArr, fn = (e) => e.type == "element") => {
  return _.filter(elementsArr, fn);
};

parseSvg(args.input, args.width, args.height, MODE);
