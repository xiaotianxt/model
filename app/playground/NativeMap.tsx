import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L, { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Feature, centerMean } from "@turf/turf";
import { geodata } from "../assets";
import { useConfigStore } from "../store/config";
import useAlgorithm, { ElevationPolygon, useContour } from "../utils/algorithm";
import { useColorScale } from "../utils/colorbar";
import { timeDiff } from "../utils/debug";

const pointColorScaleParam = [
  geodata.features.map((item) => item?.properties?.z),
  { colorRange: ["#490000", "#F2BFC2"] },
] as any;

const VectorInfoIndicator: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    hoveredPolygon?: ElevationPolygon;
  }
> = ({ hoveredPolygon, ...rest }) => {
  return <div {...rest}>{JSON.stringify(hoveredPolygon?.properties)}</div>;
};

const Map: React.FC = () => {
  const {
    config: { algorithm, parameter, showContour, showGrid, smoothContour },
  } = useConfigStore();
  const [hoveredPolygon, setHoveredPolygon] = useState<ElevationPolygon>();

  const option = useMemo(
    () => ({
      property: "z",
      algorithm,
      parameter,
    }),
    [algorithm, parameter]
  );

  // 计算得到的 polygons
  const { polygons } = useAlgorithm(geodata, option);
  const contours = useContour(polygons, smoothContour ?? false);
  const center = useMemo(() => centerMean(geodata), []);
  const properties = useMemo(
    () =>
      polygons.features.map(
        (item) => item?.properties?.z ?? item?.properties?.a
      ),
    [polygons]
  );
  const colors = useColorScale(properties);
  const pointColors = useColorScale(
    pointColorScaleParam[0],
    pointColorScaleParam[1]
  );
  const contoursColors = useColorScale(
    contours.features.map((item) => item.properties?.z ?? 0)
  );
  const mapRef = useRef<L.Map | null>(null);
  const pointLayerRef = useRef<L.FeatureGroup | null>(null);
  const polygonLayerRef = useRef<L.Layer | null>(null);

  const renderMap = useCallback(async () => {
    setHoveredPolygon(undefined);
    const diff = timeDiff();

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
      const color = colors[index];
      const polygonLayer = L.polygon(feature.geometry.coordinates as any, {
        color,
        fillColor: color,
        fillOpacity: 0.8,
        stroke: false,
      })
        .addEventListener("mouseover", (e) => {
          e.target.setStyle({ fillOpacity: 1 });
          console.log("mouseover");
          setHoveredPolygon(feature);
        })
        .addEventListener("mouseout", (e) => {
          e.target.setStyle({ fillOpacity: 0.8 });
          console.log("mouseout");
        });
      return polygonLayer;
    });

    const polygonFeatureGroup = L.featureGroup(polygonLayers).addTo(map);
    polygonLayerRef.current = polygonFeatureGroup;

    if (showContour) {
      const contourLayers = L.featureGroup(
        contours.features.map((contour, i) => {
          return L.polyline(contour.geometry.coordinates as any, {
            color: contoursColors[i],
          }).bindTooltip(`${contour.properties?.z}`);
        })
      ).addTo(map);

      console.log(contourLayers);
    }

    // 将 pointsLayer 移动到最上层
    pointLayerRef.current?.bringToFront();

    console.log("[RenderMap] render ends", diff());
  }, [
    center.geometry.coordinates,
    polygons,
    colors,
    pointColors,
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
  }, [polygons, colors, center, renderMap]);

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
