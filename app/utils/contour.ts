import {
  LineString,
  Position,
  center,
  feature,
  featureCollection,
  isolines,
} from "@turf/turf";
import { EAlgorithm } from "../types/enum";
import {
  ElevationPoint,
  ElevationPointCollection,
  ElevationPolygon,
  ElevationPolygonCollection,
} from "./algorithm";

const getBreaks = (
  points: ElevationPointCollection,
  n: number,
  propertyName: string,
  method: "equal_interval"
) => {
  const values = points.features.map((item) => item.properties[propertyName]);

  const min = Math.min(...values);
  const max = Math.max(...values);

  const breaks = Array(n)
    .fill(null)
    .map((_, i) => {
      return min + ((max - min) / n) * i;
    });

  return breaks;
};

/** 找到与 interval 相交的边 */
const calculateContourOfTriangle: (
  triangle: ElevationPolygon,
  interval: number
) => Position[] | null = (triangle: ElevationPolygon, interval: number) => {
  // findEdgesIntersectingContour
  const edges = triangle.geometry.coordinates[0]
    .map((val, i) => triangle.geometry.coordinates[0].slice(i, i + 2))
    .filter((val) => val.length === 2);
  const elevations = ["a", "b", "c"].map((name) => triangle.properties[name]);

  // 找到与等值线相交的两条边
  const intersectingEdgePair = edges
    .map((edge, i) => {
      const min = Math.min(elevations[i], elevations[(i + 1) % 3]);
      const max = Math.max(elevations[i], elevations[(i + 1) % 3]);

      return interval >= min && interval <= max
        ? [edge, [elevations[i], elevations[(i + 1) % 3]]]
        : null;
    })
    .filter((val) => val !== null) as [Position[], number[]][];

  if (edges.length === 0) {
    return null;
  }

  // 将两条边的两个交点找出来
  return intersectingEdgePair.map(([edges, elevations]) => {
    const [a, b] = edges;
    const [elevationA, elevationB] = elevations;

    const t = (interval - elevationA) / (elevationB - elevationA);

    const x = a[0] + t * (b[0] - a[0]);
    const y = a[1] + t * (b[1] - a[1]);

    return [x, y];
  });
};

const interpolatePoint = (edge: Position[], interval: number) => {};

const createLineSegment = (points: Position[]) => {
  return [];
};

const linkLineSegments = (segments: Position[][]) => {
  return [];
};

const generateContourFromTIN = (
  polygon: ElevationPolygonCollection,
  n: number
) => {
  const propertyNames = ["a", "b", "c"];
  const points = featureCollection(
    polygon.features.flatMap((feature) => {
      return feature.geometry.coordinates[0].slice(0, 3).map((coord, i) => {
        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coord,
          },
          properties: { z: feature.properties[propertyNames[i]] },
        };
      });
    }) as ElevationPoint[]
  );
  const breaks = getBreaks(points, n, "z", "equal_interval");
  const contours = [];

  for (const interval of breaks) {
    for (const triangle of polygon.features) {
      const edges = calculateContourOfTriangle(triangle, interval);
      if (edges === null) continue;
      const line = feature<LineString>(
        {
          type: "LineString",
          coordinates: edges,
        },
        {
          elevation: interval,
        }
      );

      contours.push(line);
    }
  }

  return featureCollection(contours);
};

export const generateContour = (
  polygon: ElevationPolygonCollection,
  smooth: boolean,
  algorithm: EAlgorithm,
  n = 5
) => {
  switch (algorithm) {
    case EAlgorithm.INVERSE_SQUARE_DISTANCE:
    case EAlgorithm.WEIGHTED_AVERAGE_BY_ORIENTATION: {
      const points = featureCollection(
        polygon.features.map((item) => {
          const point = center(item);
          point.properties = item.properties;
          return point;
        })
      ) as ElevationPointCollection;
      const breaks = getBreaks(points, n, "z", "equal_interval");
      return points.features.length
        ? isolines(points, breaks, { zProperty: "z" })
        : featureCollection([]);
    }
    case EAlgorithm.IRREGULAR_TRIANGLES:
    default: {
      return generateContourFromTIN(polygon, n);
    }
  }
};
