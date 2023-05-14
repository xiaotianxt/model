import { useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

interface UseColorScaleOptions {
  colorRange?: [string, string];
}

export const useColorScale = (
  values: number[],
  options?: UseColorScaleOptions
): string[] => {
  const { colorRange = ["#265364", "#cbeef3"] } = options || {};

  const colorScale = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);

    return scaleLinear<string>()
      .domain([min, max])
      .interpolate(interpolateRgb)
      .range(colorRange);
  }, [values, colorRange]);

  return values.map(colorScale);
};
