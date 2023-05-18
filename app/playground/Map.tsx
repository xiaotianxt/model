import { useEffect, useMemo, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { centerMean } from "@turf/turf";
import {
  MapContainer,
  CircleMarker,
  Popup,
  Polygon,
  ScaleControl,
  ZoomControl,
  LayerGroup,
} from "react-leaflet";
import { CRS } from "leaflet";
import useAlgorithm, { useContour } from "../utils/algorithm";
import { geodata } from "../assets";
import { useColorScale } from "../utils/colorbar";
import { useConfigStore } from "../store/config";

export default function Map() {
  const {
    config: { algorithm, parameter, showContour, showGrid, smoothContour },
  } = useConfigStore();

  const option = useMemo(
    () => ({
      property: "z",
      algorithm,
      parameter,
    }),
    [algorithm, parameter]
  );

  const polygons = useAlgorithm(geodata, option);
  const contours = useContour(polygons, smoothContour ?? false);
  const center = useMemo(() => centerMean(geodata), []);
  const colors = useColorScale(
    polygons.features.map((item) => item?.properties?.z ?? item?.properties?.a)
  );
  const pointColors = useColorScale(
    geodata.features.map((item) => item?.properties?.z),
    { colorRange: ["#490000", "#F2BFC2"] }
  );

  // 确保点保持在最上层
  const ref = useRef<any>(null);
  useEffect(() => {
    Object.keys(ref.current?._layers ?? {}).forEach((layerKey) => {
      ref.current?._layers?.[layerKey]?.bringToFront();
    });
  }, [polygons, contours]);

  return (
    <MapContainer
      center={center.geometry.coordinates as [number, number]}
      zoom={7}
      className="h-[100%]"
      crs={CRS.Simple}
      attributionControl={false}
      zoomControl={false}
    >
      <LayerGroup>
        {polygons.features.map((feature, index) => {
          const z = feature.properties?.z || 0;
          let closeTimeout: NodeJS.Timeout;
          return (
            <Polygon
              key={`${z}-${index}`}
              positions={feature.geometry.coordinates as any}
              stroke={false}
              fillColor={colors[index]}
              fillOpacity={0.8}
              eventHandlers={{
                mouseover: (e) => {
                  clearTimeout(closeTimeout);
                  e.target.openPopup();
                  e.target.setStyle({ fillColor: "darkblue" });
                },
                mouseout: (e) => {
                  e.target.setStyle({ fillColor: colors[index] });
                  if (
                    (
                      e.originalEvent.relatedTarget as HTMLElement
                    ).classList?.[0]?.includes("popup")
                  ) {
                    return;
                  }
                  closeTimeout = setTimeout(() => {
                    e.target.closePopup(); // Only close the popup if mouse does not return in time
                  }, 200); // 200 ms delay
                },
              }}
            >
              <Popup>{JSON.stringify(feature?.properties)}</Popup>
            </Polygon>
          );
        })}
      </LayerGroup>
      <LayerGroup ref={ref}>
        {geodata?.features.map((feature, index) => {
          const item = feature.geometry.coordinates as [number, number];
          return (
            <CircleMarker
              key={index}
              center={[item[0], item[1]]}
              pathOptions={{ color: pointColors[index], opacity: 1 }}
              radius={2}
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
      </LayerGroup>

      <ScaleControl imperial={false} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
