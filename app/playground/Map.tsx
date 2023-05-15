import { useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  CircleMarker,
  Popup,
  Polygon,
  ScaleControl,
  ZoomControl,
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
  const polygons = useInterpolation(geodata);
  const center = useMemo(() => centerMean(polygons), [polygons]);
  const colors = useColorScale(
    polygons.features.map((item) => item?.properties?.z)
  );

  return (
    <MapContainer
      center={center.geometry.coordinates as [number, number]}
      zoom={7}
      className="h-[100%]"
      crs={CRS.Simple}
      attributionControl={false}
      zoomControl={false}
    >
      {polygons.features.map((feature, index) => {
        return (
          <Polygon
            key={index}
            positions={feature.geometry.coordinates as any}
            stroke={false}
            fillColor={colors[index]}
            fillOpacity={0.8}
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
            eventHandlers={{
              mouseover: (e) => {
                e.target.openPopup();
              },
              mouseout: (e) => {
                e.target.closePopup();
              },
            }}
          >
            <Popup>{`z: ${item[1]}`}</Popup>
          </CircleMarker>
        );
      })}

      <ScaleControl imperial={false} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
