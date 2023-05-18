import { Feature, FeatureCollection, Point, Polygon, Properties, bbox, tin } from "@turf/turf";
import { useEffect, useState } from "react";
import { ControlFormValue } from "../playground/ControlPanel";
import { EAlgorithm } from "../types/enum";

export type AlgorithmOptions = Pick<ControlFormValue, 'algorithm' | 'parameter'> & {
  property: string;
}

/**
 * 反距离加权法
 */
function inverseDistanceWeighting(
  points: FeatureCollection<Point>,
  x: number,
  y: number,
  p: number,
  { property }: AlgorithmOptions
): number {
  let numerator = 0;
  let denominator = 0;

  for (const feature of points.features) {
    const point = feature.geometry.coordinates;
    const dist = Math.sqrt((point[0] - x) ** 2 + (point[1] - y) ** 2);
    if (dist === 0) {
      return feature?.properties?.[property] ?? 0; // if the point is at the exact location, return its value
    }
    let weight = 1.0 / dist ** p;
    numerator += feature?.properties?.[property] * weight;
    denominator += weight;
  }

  if (denominator === 0) {
    return 0; // avoid division by zero
  } else {
    return numerator / denominator;
  }
}

/**
 * 方位取点加权法
 */
function directionalWeightedAverage(
  points: FeatureCollection<Point>,
  x: number,
  y: number,
  n: number,
  { property }: AlgorithmOptions
): number {
  const sectors = Array(4 * n).fill(null).map(() => ({ dist: Infinity, value: 0 }));
  const angleStep = 360 / (4 * n);

  for (const feature of points.features) {
    const point = feature.geometry.coordinates;
    const dx = point[0] - x;
    const dy = point[1] - y;
    const dist = dx ** 2 + dy ** 2;
    const angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 360) % 360;
    const sectorIndex = Math.floor(angle / angleStep);

    if (dist < sectors[sectorIndex].dist) {
      sectors[sectorIndex].dist = dist;
      sectors[sectorIndex].value = feature?.properties?.[property] ?? 0;
    }
  }

  const validSectors = sectors.filter(({ dist }) => dist !== Infinity && dist !== 0);
  const fullProducts = validSectors.reduce((acc, { dist }) => acc * dist, 1);
  const products = validSectors.map(({ dist }) => fullProducts / dist);
  const sumProducts = products.reduce((acc, product) => acc + product, 0);

  let zA = 0;
  for (let i = 0; i < validSectors.length; i++) {
    const ci = products[i] / (sumProducts);
    zA += ci * validSectors[i].value;
  }

  return zA;
}

function interpolateGrid(
  points: FeatureCollection<Point>,
  options: AlgorithmOptions
): FeatureCollection<Polygon> {
  const polygons: Feature<Polygon, { [property: string]: number }>[] = [];

  // Define the area that the grid will cover (adjust to fit your data)
  const [xStart, yStart, xEnd, yEnd] = bbox(points);

  // Define the cell size
  const { parameter: {horizontalDensity, verticalDensity} } = options;

  // Create the grid
  for (let x = xStart; x < xEnd; x += horizontalDensity) {
    for (let y = yStart; y < yEnd; y += verticalDensity) {
      // Calculate the centroid of the current cell
      const centroidX = x + horizontalDensity / 2;
      const centroidY = y + verticalDensity / 2;

      // Interpolate a value for the centroid
      const value = options.algorithm === EAlgorithm.INVERSE_SQUARE_DISTANCE ? inverseDistanceWeighting(
        points,
        centroidX,
        centroidY,
        2,
        options
      ) : directionalWeightedAverage(
        points, centroidX, centroidY, 2, options
      )

      // Create a polygon that represents the current cell
      const polygon: Feature<Polygon, { [property: string]: number }> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [x, y],
              [x + horizontalDensity, y],
              [x + horizontalDensity, y + verticalDensity],
              [x, y + verticalDensity],
              [x, y], // Close the polygon
            ],
          ],
        },
        properties: {
          [options.property]: value,
        },
      };

      polygons.push(polygon);
    }
  }

  return { type: "FeatureCollection", features: polygons };
}

function TIN(points: FeatureCollection<Point>, options: AlgorithmOptions): FeatureCollection<Polygon> {
  return tin(points, 'z');
}

export const useAlgorithm = (
  points: FeatureCollection<Point>,
  option: AlgorithmOptions
) => {
  const [polygons, setPolygons] = useState<FeatureCollection<Polygon>>();

  useEffect(() => {
    const calculateInterpolation = async () => {
      if (option.algorithm === EAlgorithm.INVERSE_SQUARE_DISTANCE || option.algorithm === EAlgorithm.WEIGHTED_AVERAGE_BY_ORIENTATION) {
        setPolygons(await interpolateGrid(points, option));
      } else {
        setPolygons(await TIN(points, option));
      }
    }
    calculateInterpolation();
  }, [option, points]);

  console.log(polygons);

  return polygons ?? {
    features: [],
    type: "FeatureCollection",
  };
};

export const useContour = (polygon: FeatureCollection<Polygon, Properties>, smooth: boolean) => {
  return [];
}
export default useAlgorithm;
