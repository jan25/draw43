/**
 * Helper script to convert SVG to 2D path of points.
 */
import { readFileSync, writeFileSync } from "fs";
import pkg from "xml-js";
const { xml2js } = pkg;
import _ from "lodash";

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

  const outPath = path + "-parsed.json";
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        polylines: scaled,
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

parseSvg("scripts/bazieroutline_800wx700h.svg", 800, 700, "polygon");
