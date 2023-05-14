import { Feature, FeatureCollection, Point, Polygon, bbox } from "@turf/turf";
import { useMemo } from "react";

export interface InterpolationOptions {
  property: string;
}

function inverseDistanceWeighting(
  points: FeatureCollection<Point>,
  x: number,
  y: number,
  p: number,
  { property }: InterpolationOptions
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

function interpolateGrid(
  points: FeatureCollection<Point>,
  cellSize: number,
  options: InterpolationOptions
): FeatureCollection<Polygon> {
  const polygons: Feature<Polygon, { [property: string]: number }>[] = [];

  // Define the area that the grid will cover (adjust to fit your data)
  const [xStart, yStart, xEnd, yEnd] = bbox(points);

  // Create the grid
  for (let x = xStart; x < xEnd; x += cellSize) {
    for (let y = yStart; y < yEnd; y += cellSize) {
      // Calculate the centroid of the current cell
      const centroidX = x + cellSize / 2;
      const centroidY = y + cellSize / 2;

      // Interpolate a value for the centroid
      const value = inverseDistanceWeighting(
        points,
        centroidX,
        centroidY,
        2,
        options
      );

      // Create a polygon that represents the current cell
      const polygon: Feature<Polygon, { [property: string]: number }> = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [x, y],
              [x + cellSize, y],
              [x + cellSize, y + cellSize],
              [x, y + cellSize],
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

export const useInterpolation = (
  points: FeatureCollection<Point>,
  cellSize = 0.01,
  option: InterpolationOptions = {
    property: "z",
  }
) => {
  const another = useMemo(() => {
    return interpolateGrid(points, cellSize, option);
  }, [points, cellSize, option]);

  return another;
};

export default useInterpolation;
