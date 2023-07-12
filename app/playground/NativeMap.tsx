import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { centerMean } from "@turf/turf";
import { geodata } from "../assets";
import { useConfigStore } from "../store/config";
import useAlgorithm, { ElevationPolygon, useContour } from "../utils/algorithm";
import { useColorScale } from "../utils/colorbar";
import { timeDiff } from "../utils/debug";

const POINT_PROPERTIES = geodata.features.map((item) => item?.properties?.z);
const POINT_COLOR_SCALE = { colorRange: ["#490000", "#F2BFC2"] };
const CONTOUR_COLOR_SCALE = { colorRange: ["#a7f3c9", "#064e34"] };

const VectorInfoIndicator: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    hoveredPolygon?: ElevationPolygon;
  }
> = ({ hoveredPolygon, ...rest }) => {
  return <div {...rest}>{JSON.stringify(hoveredPolygon?.properties)}</div>;
};

const useCalculations = () => {
  const {
    config: { algorithm, parameter, smoothContour, showContour },
  } = useConfigStore();

  const center = useMemo(() => centerMean(geodata), []);
  const pointColors = useColorScale(POINT_PROPERTIES, POINT_COLOR_SCALE);

  const algorithmOption = useMemo(
    () => ({
      property: "z",
      algorithm,
      parameter,
    }),
    [algorithm, parameter]
  );
  const { polygons } = useAlgorithm(geodata, algorithmOption);
  const polygonProperties = useMemo(
    () =>
      polygons.features.map(
        (item) => item?.properties?.z ?? item?.properties?.a
      ),
    [polygons]
  );
  const polygonColors = useColorScale(polygonProperties);

  const contours = useContour(polygons, smoothContour ?? false, showContour);
  const contourProperties = useMemo(
    () => contours.features.map((item) => item.properties?.z ?? 0),
    [contours]
  );
  const contoursColors = useColorScale(contourProperties, CONTOUR_COLOR_SCALE);

  return {
    center,
    pointColors,
    polygons,
    polygonColors,
    contours,
    contoursColors,
  };
};

const Map: React.FC = () => {
  const {
    config: { showContour },
  } = useConfigStore();
  const [hoveredPolygon, setHoveredPolygon] = useState<ElevationPolygon>();

  // 各类运算
  const {
    center,
    pointColors,
    polygons,
    polygonColors,
    contours,
    contoursColors,
  } = useCalculations();

  // 地图绘制
  const mapRef = useRef<L.Map | null>(null);
  const pointLayerRef = useRef<L.FeatureGroup | null>(null);
  const polygonLayerRef = useRef<L.Layer | null>(null);

  const renderMap = useCallback(async () => {
    const diff = timeDiff();
    console.log("[Rerender] start", diff());
    setHoveredPolygon(undefined);

    /** 创建渲染 Map */
    let map: LeafletMap;
    if (mapRef.current) {
      // 非首次渲染，直接使用 ref.current
      map = mapRef.current;
    } else {
      // 创建地图实例
      map = L.map("map", {
        center: center.geometry.coordinates as any,
        zoom: 7,
        crs: L.CRS.Simple,
        renderer: L.canvas(),
      });
      mapRef.current = map;

      // 循环遍历所有的 points 并创建 circleMarker
      const pointFeatures = geodata.features.map((feature, index) => {
        const marker = L.circleMarker(
          feature.geometry.coordinates as [number, number],
          {
            color: pointColors[index],
            opacity: 1,
            radius: 2,
          }
        ).bindTooltip(`${(feature.properties as any).z}`);
        return marker;
      });

      // 创建 LayerGroup, 添加到地图上
      const pointsLayer = L.featureGroup(pointFeatures);
      pointsLayer.addTo(map);
      pointLayerRef.current = pointsLayer;
    }

    // 渲染 polygons
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
    }
    const polygonLayers = polygons.features.map((feature, index) => {
      const color = polygonColors[index];
      const polygonLayer = L.polygon(feature.geometry.coordinates as any, {
        color,
        fillColor: color,
        fillOpacity: 0.8,
        stroke: false,
      })
        .addEventListener("mouseover", (e) => {
          e.target.setStyle({ fillOpacity: 1 });
          setHoveredPolygon(feature);
        })
        .addEventListener("mouseout", (e) => {
          e.target.setStyle({ fillOpacity: 0.8 });
        });
      return polygonLayer;
    });

    const polygonFeatureGroup = L.featureGroup(polygonLayers).addTo(map);
    polygonLayerRef.current = polygonFeatureGroup;

    if (showContour) {
      console.log("[renderMap] showContour", contours);
      L.featureGroup(
        contours.features.map((contour, i) => {
          return L.polyline(contour.geometry.coordinates as any, {
            color: contoursColors[i],
          }).bindTooltip(`${contour.properties?.z}`);
        })
      )?.addTo(map);
    }

    // 将 pointsLayer 移动到最上层
    pointLayerRef.current?.bringToFront();

    console.log("[Rerender] end", diff());
  }, [
    center.geometry.coordinates,
    pointColors,
    polygons,
    polygonColors,
    showContour,
    contours,
    contoursColors,
  ]);

  useEffect(() => {
    renderMap();

    // 在组件卸载时，移除地图和所有的 markers
    return () => {
      const map = mapRef.current;
      map?.remove();
      mapRef.current = null;
    };
  }, [polygons, polygonColors, center, renderMap]);

  return (
    <div className="relative flex h-full">
      <div id="map" style={{ height: "100%", width: "100%" }} />
      <VectorInfoIndicator
        hoveredPolygon={hoveredPolygon}
        className="absolute bottom-0 p-2 bg-white"
      />
    </div>
  );
};

export default Map;
