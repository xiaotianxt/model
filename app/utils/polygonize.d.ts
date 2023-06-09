declare module "polygonize" {
  import { FeatureCollection, LineString, Polygon } from "@turf/turf";

  /**
   * Polygonizes {@link LineString|(Multi)LineString(s)} into {@link Polygons}.
   *
   * Implementation of GEOSPolygonize function (`geos::operation::polygonize::Polygonizer`).
   *
   * Polygonizes a set of lines that represents edges in a planar graph. Edges must be correctly
   * noded, i.e., they must only meet at their endpoints.
   *
   * The implementation correctly handles:
   *
   * - Dangles: edges which have one or both ends which are not incident on another edge endpoint.
   * - Cut Edges (bridges): edges that are connected at both ends but which do not form part of a polygon.
   *
   * @name polygonize
   * @param {FeatureCollection|Geometry|Feature<LineString|MultiLineString>} geoJson Lines in order to polygonize
   * @returns {FeatureCollection<Polygon>} Polygons created
   * @throws {Error} if geoJson is invalid.
   */
  declare function polygonize(
    geoJson: FeatureCollection<LineString> | LineString | Polygon
  ): FeatureCollection<Polygon>;

  export default polygonize;
}
