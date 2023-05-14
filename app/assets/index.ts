import { FeatureCollection, Point, bbox, center, toWgs84 } from "@turf/turf";
import vector from "./vector.geojson.json";

// const centerCord = center(vector as FeatureCollection<Point>);
// const box = bbox(vector as FeatureCollection<Point>);
// const [x1, y1] = box;

// const [x, y] = centerCord.geometry.coordinates;
// vector.features = vector.features.map((feature) => {
//   const coord = feature.geometry.coordinates;
//   return {
//     ...feature,
//     geometry: {
//       ...feature.geometry,
//       coordinates: [(coord[0] - x1) / 10, (coord[1] - y1) / 10],
//     },
//   };
// });

export const geodata = toWgs84(vector) as FeatureCollection<Point>;
