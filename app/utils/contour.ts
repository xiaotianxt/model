import {
  Feature,
  FeatureCollection,
  LineString,
  Position,
  Properties,
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

function approximate(position: Position): string {
  const precision = 5; // 根据实际需求设定精度
  return JSON.stringify(
    position.map(
      (coord) =>
        Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision)
    )
  );
}

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
      return min + ((max - min) / (n + 1)) * (i + 1);
    });
  return breaks;
};

/** 找到与 interval 相交的线段 */
const calculateIntersectingSegment: (
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

/** 将所有相交的线段组合成折线 */
const reorderSegments: (segments: Position[][]) => Position[][] = (
  segments
) => {
  if (segments.length === 0) {
    return [];
  }

  // 创建一个映射，用于存储每个点的邻居点
  const pointToNeighborMap: Map<string, Set<string>> = new Map();

  // 创建一个映射，用于存储approximate字符串和原始点之间的映射关系
  const pointStringToOriginal: Map<string, Position> = new Map();

  for (let segment of segments) {
    const start = segment[0];
    const end = segment[1];

    const startString = approximate(start);
    const endString = approximate(end);

    pointStringToOriginal.set(startString, start);
    pointStringToOriginal.set(endString, end);

    if (!pointToNeighborMap.has(startString)) {
      pointToNeighborMap.set(startString, new Set());
    }

    if (!pointToNeighborMap.has(endString)) {
      pointToNeighborMap.set(endString, new Set());
    }

    pointToNeighborMap.get(startString)?.add(endString);
    pointToNeighborMap.get(endString)?.add(startString);
  }

  // 查找具有一个邻居（即连接点最少）的点作为起始点
  let startPoints = Array.from(pointToNeighborMap.entries()).filter(
    ([_, neighbors]) => neighbors.size === 1
  );
  if (!startPoints.length) return [];

  const polylines = [];

  for (const startPoint of startPoints) {
    let [currentPointString, _] = startPoint;
    const polyline: Position[] = [
      pointStringToOriginal.get(currentPointString) as Position,
    ];

    while (pointToNeighborMap.size > 0) {
      const neighbors = pointToNeighborMap.get(currentPointString);
      if (!neighbors || neighbors.size === 0) {
        break;
      }

      // 选择一个邻居点
      const nextPointString = neighbors.values().next().value;

      // 添加到折线中
      polyline.push(pointStringToOriginal.get(nextPointString) as Position);

      // 移除当前点与邻居点之间的连接
      pointToNeighborMap.get(currentPointString)?.delete(nextPointString);
      pointToNeighborMap.get(nextPointString)?.delete(currentPointString);

      // 如果当前点没有其他邻居，从映射中删除该点
      if (pointToNeighborMap.get(currentPointString)?.size === 0) {
        pointToNeighborMap.delete(currentPointString);
      }

      // 更新当前点为下一个点
      currentPointString = nextPointString;
    }
    polylines.push(polyline);
  }

  return polylines;
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
  const contours: Feature<LineString>[] = [];

  for (const interval of breaks) {
    const segments = [];
    // 遍历每个三角形拿到交线
    for (const triangle of polygon.features) {
      const segment = calculateIntersectingSegment(triangle, interval);
      if (segment === null || segment.length === 0) continue;
      segments.push(segment);
    }
    // 拼装交线
    const lineStrings = reorderSegments(segments);

    const lines = lineStrings.map((lineString) =>
      feature<LineString>(
        {
          type: "LineString",
          coordinates: lineString,
        },
        {
          z: interval,
        }
      )
    );

    contours.splice(contours.length, 0, ...lines);
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
      const result = (
        points.features.length
          ? isolines(points, breaks, { zProperty: "z" })
          : featureCollection([])
      ) as FeatureCollection<LineString>;
      return smooth ? smoothContourLines(result) : result;
    }
    case EAlgorithm.IRREGULAR_TRIANGLES:
    default: {
      const result = generateContourFromTIN(polygon, n);
      return smooth ? smoothContourLines(result) : result;
    }
  }
};
function smoothContourLines(result: FeatureCollection<LineString, Properties>) {
  const smoothLine = (positions: Position[]) => {
    const windowSize = 2;

    const smoothedPoints = [positions[0]];
    const halfWindowSize = Math.floor(windowSize / 2);

    // 将每个点的值设置为其在窗口内的所有点的平均值
    for (let i = 1; i < positions.length - 1; i++) {
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      // 计算在窗口范围内的所有点的值
      for (
        let j = Math.max(0, i - halfWindowSize);
        j <= Math.min(positions.length - 1, i + halfWindowSize);
        j++
      ) {
        sumX += positions[j][0];
        sumY += positions[j][1];
        count++;
      }

      // 计算平均值，并将其添加到新的点列表中
      smoothedPoints.push([sumX / count, sumY / count]);
    }
    smoothedPoints.push(positions[positions.length - 1]);

    return smoothedPoints;
  };
  return featureCollection(
    result.features.map((item) => {
      const { geometry, properties } = item;
      const newGeometry = {
        ...geometry,
        coordinates: smoothLine(geometry.coordinates),
      };
      return feature<LineString>(newGeometry, properties);
    })
  );
}
