import {
  polygon,
  featureCollection,
  FeatureCollection,
  Point,
} from "@turf/turf";

//定义了一个表示三角形的类
class Triangle {
  x: number;
  y: number;
  r: number;

  constructor(public a: Vertex, public b: Vertex, public c: Vertex) {
    let A = b.x - a.x,
      B = b.y - a.y,
      C = c.x - a.x,
      D = c.y - a.y,
      E = A * (a.x + b.x) + B * (a.y + b.y),
      F = C * (a.x + c.x) + D * (a.y + c.y),
      G = 2 * (A * (c.y - b.y) - B * (c.x - b.x)),
      minx,
      miny,
      dx,
      dy;

    if (Math.abs(G) < 0.000001) {
      minx = Math.min(a.x, b.x, c.x);
      miny = Math.min(a.y, b.y, c.y);
      dx = (Math.max(a.x, b.x, c.x) - minx) * 0.5;
      dy = (Math.max(a.y, b.y, c.y) - miny) * 0.5;

      this.x = minx + dx;
      this.y = miny + dy;
      this.r = dx * dx + dy * dy;
    } else {
      this.x = (D * E - B * F) / G;
      this.y = (A * F - C * E) / G;
      dx = this.x - a.x;
      dy = this.y - a.y;
      this.r = dx * dx + dy * dy;
    }
  }
}

// 定义了一个表示顶点的接口
interface Vertex {
  x: number;
  y: number;
  z?: number;
  __sentinel?: boolean;
}

// 将给定的点集进行Delaunay三角剖分，返回三角形集合
function triangulate(vertices: Vertex[]): Triangle[] {
  // 如果顶点少于3个，无法形成三角形，直接返回空数组
  if (vertices.length < 3) return [];

  vertices.sort((a: Vertex, b: Vertex) => b.x - a.x);

  let i = vertices.length - 1,
    xmin = vertices[i].x,
    xmax = vertices[0].x,
    ymin = vertices[i].y,
    ymax = ymin;

  while (i--) {
    if (vertices[i].y < ymin) ymin = vertices[i].y;
    if (vertices[i].y > ymax) ymax = vertices[i].y;
  }

  // 求出包围所有顶点的超级三角形
  let dx = xmax - xmin,
    dy = ymax - ymin,
    dmax = dx > dy ? dx : dy,
    xmid = (xmax + xmin) * 0.5,
    ymid = (ymax + ymin) * 0.5,
    open: Triangle[] = [
      new Triangle(
        {
          x: xmid - 20 * dmax,
          y: ymid - dmax,
          __sentinel: true,
        },
        {
          x: xmid,
          y: ymid + 20 * dmax,
          __sentinel: true,
        },
        {
          x: xmid + 20 * dmax,
          y: ymid - dmax,
          __sentinel: true,
        }
      ),
    ],
    closed = [],
    edges = [],
    j,
    a,
    b;

  // 逐个加入顶点到网格
  i = vertices.length;
  while (i--) {
    edges.length = 0;
    j = open.length;
    while (j--) {
      dx = vertices[i].x - open[j].x;
      if (dx > 0 && dx * dx > open[j].r) {
        closed.push(open[j]);
        open.splice(j, 1);
        continue;
      }

      dy = vertices[i].y - open[j].y;
      if (dx * dx + dy * dy > open[j].r) continue;

      edges.push(
        open[j].a,
        open[j].b,
        open[j].b,
        open[j].c,
        open[j].c,
        open[j].a
      );
      open.splice(j, 1);
    }

    dedup(edges);

    j = edges.length;
    while (j) {
      b = edges[--j];
      a = edges[--j];
      open.push(new Triangle(a, b, vertices[i]));
    }
  }

  Array.prototype.push.apply(closed, open);

  i = closed.length;
  while (i--)
    if (
      closed[i].a.__sentinel ||
      closed[i].b.__sentinel ||
      closed[i].c.__sentinel
    )
      closed.splice(i, 1);

  return closed;
}

// 从边缘列表中去除重复的边
function dedup(edges: Vertex[]) {
  let j = edges.length,
    a,
    b,
    i,
    m,
    n;

  outer: while (j) {
    b = edges[--j];
    a = edges[--j];
    i = j;
    while (i) {
      n = edges[--i];
      m = edges[--i];
      if ((a === m && b === n) || (a === n && b === m)) {
        edges.splice(j, 2);
        edges.splice(i, 2);
        j -= 2;
        continue outer;
      }
    }
  }
}

// 对外提供的函数，接受点集和属性名，返回Delaunay三角剖分结果
export default function tin(points: FeatureCollection<Point>, z?: string) {
  return featureCollection(
    triangulate(
      points.features.map((p) => {
        let point: Vertex = {
          x: p.geometry.coordinates[0],
          y: p.geometry.coordinates[1],
        };
        if (z && p.properties) point.z = p.properties[z];
        return point;
      })
    ).map((triangle) => {
      return polygon(
        [
          [
            [triangle.a.x, triangle.a.y],
            [triangle.b.x, triangle.b.y],
            [triangle.c.x, triangle.c.y],
            [triangle.a.x, triangle.a.y],
          ],
        ],
        {
          a: triangle.a.z,
          b: triangle.b.z,
          c: triangle.c.z,
        }
      );
    })
  );
}
