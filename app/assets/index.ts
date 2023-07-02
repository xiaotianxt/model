import vector from "./vector.geojson.json";
import { ElevationPointCollection } from "../utils/algorithm";

vector.features = vector.features.map((feature) => {
  const coord = feature.geometry.coordinates;
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: [coord[0] / 1000, coord[1] / 1000],
    },
  };
});

export const geodata = vector as unknown as ElevationPointCollection;

// export const geodata = toWgs84(vector) as FeatureCollection<Point>;
