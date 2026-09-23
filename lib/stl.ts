import type { Geometry } from "./pricing";

/**
 * Parses binary or ASCII STL and returns solid volume (signed tetrahedra),
 * surface area and bounding box. Units are assumed to be millimetres.
 * STEP files need the geometry worker (services/geometry), not this parser.
 */
export function parseStl(buffer: ArrayBuffer): Geometry & { triangles: number } {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const isBinary = (() => {
    if (buffer.byteLength < 84) return false;
    const count = view.getUint32(80, true);
    return 84 + count * 50 === buffer.byteLength;
  })();

  const tris: number[] = [];
  if (isBinary) {
    const count = view.getUint32(80, true);
    for (let i = 0; i < count; i++) {
      const o = 84 + i * 50 + 12;
      for (let k = 0; k < 9; k++) tris.push(view.getFloat32(o + k * 4, true));
    }
  } else {
    const text = new TextDecoder().decode(bytes);
    const re = /vertex\s+([-+\deE.]+)\s+([-+\deE.]+)\s+([-+\deE.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) tris.push(+m[1], +m[2], +m[3]);
    if (tris.length === 0 || tris.length % 9 !== 0) throw new Error("This file is not a readable STL.");
  }

  let vol = 0;
  let area = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < tris.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = tris.slice(i, i + 9);
    vol += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    area += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
    for (const [x, y, z] of [[ax, ay, az], [bx, by, bz], [cx, cy, cz]]) {
      if (x < min[0]) min[0] = x; if (y < min[1]) min[1] = y; if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x; if (y > max[1]) max[1] = y; if (z > max[2]) max[2] = z;
    }
  }
  if (!isFinite(vol) || tris.length === 0) throw new Error("This file is not a readable STL.");

  return {
    volumeCm3: Math.abs(vol) / 1000,
    areaCm2: area / 100,
    bbox: [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((d) => Math.round(d * 10) / 10) as [number, number, number],
    triangles: tris.length / 9,
  };
}
