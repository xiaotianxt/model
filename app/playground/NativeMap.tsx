import { FC, useCallback, useEffect, useMemo, useRef } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { centerMean } from "@turf/turf";
import { geodata } from "../assets";
import { useConfigStore } from "../store/config";
import useAlgorithm, { useContour } from "../utils/algorithm";
import { useColorScale } from "../utils/colorbar";
import { timeDiff } from "../utils/debug";

const Map: FC<{ configCollapsed: boolean }> = ({ configCollapsed }) => {
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

  // 计算得到的 polygons
  const { polygons, computing } = useAlgorithm(geodata, option);
  const contours = useContour(polygons, smoothContour ?? false);
  const center = useMemo(() => centerMean(geodata), []);
  const colors = useColorScale(
    polygons.features.map((item) => item?.properties?.z ?? item?.properties?.a)
  );
  const pointColors = useColorScale(
    geodata.features.map((item) => item?.properties?.z),
    { colorRange: ["#490000", "#F2BFC2"] }
  );
  const mapRef = useRef<L.Map | null>(null);
  const pointLayerRef = useRef<L.FeatureGroup | null>(null);
  const polygonLayerRef = useRef<L.Layer | null>(null);

  const renderMap = useCallback(async () => {
    const diff = timeDiff();
    console.log("[RenderMap] start", diff());
    let map: LeafletMap;
    if (mapRef.current) {
      console.log("[RenderMap] not first render", diff());
      // 非首次渲染，直接使用 ref.current
      map = mapRef.current;
    } else {
      console.log("[RenderMap] first render", diff());
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
        );

        return marker;
      });

      // 创建 LayerGroup, 添加到地图上
      const pointsLayer = L.featureGroup(pointFeatures);
      pointsLayer.addTo(map);
      pointLayerRef.current = pointsLayer;
    }
    console.log("[RenderMap] map created", diff());

    // 渲染 polygons
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      console.log("[RenderMap] remove old polygons", diff());
    }
    const polygonLayers = polygons.features.map((feature, index) => {
      const color = colors[index];
      const polygonLayer = L.polygon(feature.geometry.coordinates as any, {
        color,
        fillColor: color,
        fillOpacity: 0.8,
        stroke: false,
      });
      return polygonLayer;
    });

    console.log("[RenderMap] polygons created", diff());

    const polygonFeatureGroup = L.featureGroup(polygonLayers).addTo(map);
    polygonLayerRef.current = polygonFeatureGroup;

    console.log("[RenderMap] polygons added to map", diff());

    // 将 pointsLayer 移动到最上层
    pointLayerRef.current?.bringToFront();

    console.log("[RenderMap] render ends", diff());
  }, [center.geometry.coordinates, polygons, colors, pointColors]);

  useEffect(() => {
    renderMap();

    // 在组件卸载时，移除地图和所有的 markers
    return () => {
      const map = mapRef.current;
      map?.remove();
      mapRef.current = null;
    };
  }, [polygons, colors, center, renderMap]);

  return <div id="map" style={{ height: "100%", width: "100%" }} />;
};

export default Map;
