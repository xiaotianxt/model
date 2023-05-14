import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  CircleMarker,
  Popup,
  Polygon,
  ScaleControl,
} from "react-leaflet";
import { CRS } from "leaflet";
import useInterpolation from "../utils/algorithm";
import { geodata } from "../assets";
import { centerMean } from "@turf/turf";
import { useColorScale } from "../utils/colorbar";

export default function Map() {
  const points = useMemo<[number, number, number][]>(() => {
    return geodata.features.map((item) =>
      item.geometry.coordinates.map((x) => x)
    ) as [number, number, number][];
  }, []);
  const center = useMemo(() => centerMean(geodata), []);
  const polygons = useInterpolation(geodata);
  const colors = useColorScale(
    polygons.features.map((item) => item?.properties?.z)
  );

  return (
    <MapContainer
      center={center.geometry.coordinates as [number, number]}
      zoom={8}
      className="h-[calc(100vh-2.5rem)]"
      crs={CRS.Simple}
    >
      {polygons.features.map((feature, index) => {
        return (
          <Polygon
            key={index}
            positions={feature.geometry.coordinates as any}
            stroke={false}
            fillColor={colors[index]}
            fillOpacity={.8}
          />
        );
      })}
      {points.map((item, index) => {
        return (
          <CircleMarker
            key={index}
            center={[item[0], item[1]]}
            pathOptions={{ color: "#DD2D4A" }}
            radius={2}
            opacity={1}
          >
            <Popup>{`z: ${item[1]}`}</Popup>
          </CircleMarker>
        );
      })}

      <ScaleControl imperial={false} />
    </MapContainer>
  );
}
