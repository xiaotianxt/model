import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  CircleMarker,
  Popup,
  Polygon,
  GeoJSON,
  ScaleControl,
  TileLayer,
} from "react-leaflet";
import { CRS } from "leaflet";
import useInterpolation from "../utils/algorithm";
import { geodata } from "../assets";
import { centerMean } from "@turf/turf";

export default function Map() {
  const redOptions = { color: "red" };

  const points = useMemo<[number, number, number][]>(() => {
    return geodata.features.map((item) =>
      item.geometry.coordinates.map((x) => x)
    ) as [number, number, number][];
  }, []);
  const center = useMemo(() => centerMean(geodata), []);
  const polygons = useInterpolation(geodata);

  return (
    <MapContainer
      center={center.geometry.coordinates as [number, number]}
      zoom={14}
      style={{ height: "100vh" }}
      crs={CRS.Simple}
    >
      {polygons.features.map((feature, index) => {
        return (
          <Polygon
            key={index}
            positions={feature.geometry.coordinates as any}
          />
        );
      })}

      {points.map((item, index) => {
        return (
          <CircleMarker
            key={index}
            center={[item[0], item[1]]}
            pathOptions={redOptions}
            radius={2}
          >
            <Popup>{`x: ${item[0]} y: ${item[1]} z: ${item[2]}`}</Popup>
          </CircleMarker>
        );
      })}

      <ScaleControl imperial={false} />
    </MapContainer>
  );
}
