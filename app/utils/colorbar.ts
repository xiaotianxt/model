import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

interface UseColorScaleOptions {
  colorRange: string[];
}

function arrayMin(arr: number[]) {
  var len = arr.length,
    min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
}

function arrayMax(arr: number[]) {
  var len = arr.length,
    max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
}

export const useColorScale = (
  values: number[],
  options: UseColorScaleOptions
): string[] => {
  const colorScale = useMemo(() => {
    const { colorRange } = options;
    const min = arrayMin(values);
    const max = arrayMax(values);

    const scaler = scaleLinear<string>()
      .domain([min, max])
      .interpolate(interpolateRgb)
      .range(colorRange);
    return values.map(scaler);
  }, [values, options]);

  return colorScale;
};
