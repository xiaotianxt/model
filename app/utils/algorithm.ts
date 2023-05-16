import { Feature, FeatureCollection, Point, Polygon, Properties, bbox } from "@turf/turf";
import { useMemo } from "react";
import { ControlFormValue } from "../playground/ControlPanel";
import { EAlgorithm } from "../types/enum";

export type InterpolationOptions = Pick<ControlFormValue, 'algorithm' | 'parameter'> & {
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

function directionalWeightedAverage(
  points: FeatureCollection<Point>,
  x: number,
  y: number,
  p: number,
  { property, parameter: { preferredDirection } }: InterpolationOptions
): number {
  let numerator = 0;
  let denominator = 0;
  preferredDirection = preferredDirection ?? 0;

  for (const feature of points.features) {
    const point = feature.geometry.coordinates;
    const dx = point[0] - x;
    const dy = point[1] - y;
    const dist = Math.sqrt(dx ** 2 + dy ** 2);
    let direction = Math.atan2(dy, dx) * (180 / Math.PI); // direction in degrees
    if (direction < 0) direction += 360; // normalize to [0, 360)

    const angularDifference = Math.min((direction - preferredDirection + 360) % 360, (preferredDirection - direction + 360) % 360);
    let directionalWeight = 1 - angularDifference / 180; // diminishes from 1 to 0 as difference increases from 0 to 180

    if (dist === 0) {
      return feature?.properties?.[property] ?? 0; // if the point is at the exact location, return its value
    }
    let weight = (1.0 / dist ** p) * directionalWeight;
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
  options: InterpolationOptions
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

export const useInterpolation = (
  points: FeatureCollection<Point>,
  option: InterpolationOptions
) => {

  const res = useMemo(() => {
    return interpolateGrid(points, option);
  }, [points, option]);

  return res;
};

export const useContour = (polygon: FeatureCollection<Polygon, Properties>, smooth: boolean) => {
  return [];
}
export default useInterpolation;
