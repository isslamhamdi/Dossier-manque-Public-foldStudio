import type { Vec2, Vec3 } from './types'

export const v3 = {
  sub: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x-b.x, y: a.y-b.y, z: a.z-b.z }),
  add: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x+b.x, y: a.y+b.y, z: a.z+b.z }),
  dot: (a: Vec3, b: Vec3) => a.x*b.x + a.y*b.y + a.z*b.z,
  cross: (a: Vec3, b: Vec3): Vec3 => ({
    x: a.y*b.z - a.z*b.y,
    y: a.z*b.x - a.x*b.z,
    z: a.x*b.y - a.y*b.x,
  }),
  len: (v: Vec3) => Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z),
  scale: (v: Vec3, s: number): Vec3 => ({ x: v.x*s, y: v.y*s, z: v.z*s }),
  norm: (v: Vec3): Vec3 => {
    const l = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
    return l < 1e-12 ? { x: 0, y: 0, z: 0 } : { x: v.x/l, y: v.y/l, z: v.z/l }
  },
}

export const v2 = {
  sub: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x-b.x, y: a.y-b.y }),
  add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x+b.x, y: a.y+b.y }),
  scale: (v: Vec2, s: number): Vec2 => ({ x: v.x*s, y: v.y*s }),
  len: (v: Vec2) => Math.sqrt(v.x*v.x + v.y*v.y),
  norm: (v: Vec2): Vec2 => {
    const l = Math.sqrt(v.x*v.x + v.y*v.y)
    return l < 1e-12 ? { x: 0, y: 0 } : { x: v.x/l, y: v.y/l }
  },
  dot: (a: Vec2, b: Vec2) => a.x*b.x + a.y*b.y,
  perp: (v: Vec2): Vec2 => ({ x: -v.y, y: v.x }),
}
