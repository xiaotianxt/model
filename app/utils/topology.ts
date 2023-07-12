import {
  FeatureCollection,
  LineString,
  Polygon,
  Position,
  bbox,
  featureCollection,
  lineString,
  polygonize,
} from "@turf/turf";
import { ElevationPolygonCollection } from "./algorithm";
import { ContourLineCollections } from "./contour";
import { useConfigStore } from "../store/config";
import { geodata } from "../assets";

const boundingBox = bbox(geodata);

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.floor(Math.random() * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
};

const getSegments = (
  polygons: ElevationPolygonCollection,
  contours: ContourLineCollections
) => {
  const segments: Position[][] = [];

  segments.splice(
    segments.length,
    0,
    ...contours.features.flatMap((item) => item.geometry.coordinates)
  );

  console.log({ segments, boundingBox });

  const xCenter = (boundingBox[0] + boundingBox[2]) / 2;
  const yCenter = (boundingBox[1] + boundingBox[3]) / 2;

  segments.splice(
    segments.length,
    0,
    // x 方向二分线
    [
      [boundingBox[0], yCenter],
      [boundingBox[2], yCenter],
    ],

    // y 方向二分线
    [
      [xCenter, boundingBox[1]],
      [xCenter, boundingBox[3]],
    ],

    // 左下右上对角线
    [
      [boundingBox[0], boundingBox[1]],
      [boundingBox[2], boundingBox[3]],
    ],

    // 左上右下对角线
    [
      [boundingBox[0], boundingBox[3]],
      [boundingBox[2], boundingBox[1]],
    ],

    // 四个边界
    [
      [boundingBox[0], boundingBox[1]],
      [boundingBox[0], boundingBox[3]],
    ],

    [
      [boundingBox[2], boundingBox[1]],
      [boundingBox[2], boundingBox[3]],
    ],

    [
      [boundingBox[0], boundingBox[1]],
      [boundingBox[2], boundingBox[1]],
    ],

    [
      [boundingBox[0], boundingBox[3]],
      [boundingBox[2], boundingBox[3]],
    ]
  );

  return featureCollection(segments.map((item) => lineString(item)));
};

type TopologyResult = {
  polygon: FeatureCollection<Polygon, { color: string }>;
  segments: FeatureCollection<LineString>;
};
const useTopology: (
  polygons: ElevationPolygonCollection,
  contours: ContourLineCollections
) => TopologyResult = (polygons, contours) => {
  const { displayMode } = useConfigStore();
  // if (displayMode === EDisplayMode.INTERPOLATION) return featureCollection([]);
  const segments = getSegments(polygons, contours);

  console.log("feature collections", segments);

  const result = polygonize(segments);

  console.log({ result });
  result.features.forEach((item) => {
    item.properties = {
      color: getRandomColor(),
    };
  });

  result.features.splice(result.features.length - 1, 1);

  return {
    polygon: result as FeatureCollection<Polygon, { color: string }>,
    segments: segments,
  };
};

export default useTopology;
