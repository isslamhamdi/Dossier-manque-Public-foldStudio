// #108 STL export — generates ASCII STL from box dimensions

import { NextRequest, NextResponse } from 'next/server'

function box3D(w: number, h: number, d: number, t: number): string {
  // Generate 6-face box as ASCII STL (millimeters)
  const faces: string[] = []
  const hw = w / 2, hh = h / 2, hd = d / 2

  function quad(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    dx: number, dy: number, dz: number,
    nx: number, ny: number, nz: number,
  ) {
    faces.push(`  facet normal ${nx} ${ny} ${nz}`)
    faces.push(`    outer loop`)
    faces.push(`      vertex ${ax} ${ay} ${az}`)
    faces.push(`      vertex ${bx} ${by} ${bz}`)
    faces.push(`      vertex ${cx} ${cy} ${cz}`)
    faces.push(`    endloop`)
    faces.push(`  endfacet`)
    faces.push(`  facet normal ${nx} ${ny} ${nz}`)
    faces.push(`    outer loop`)
    faces.push(`      vertex ${ax} ${ay} ${az}`)
    faces.push(`      vertex ${cx} ${cy} ${cz}`)
    faces.push(`      vertex ${dx} ${dy} ${dz}`)
    faces.push(`    endloop`)
    faces.push(`  endfacet`)
  }

  const ti = t  // inner offset
  // Front
  quad(-hw,  hh, hd, hw,  hh, hd, hw, -hh, hd, -hw, -hh, hd,  0, 0, 1)
  // Back
  quad( hw,  hh,-hd,-hw,  hh,-hd,-hw, -hh,-hd, hw, -hh,-hd,  0, 0,-1)
  // Top
  quad(-hw,  hh,-hd, hw,  hh,-hd, hw,  hh, hd,-hw,  hh, hd,  0, 1, 0)
  // Bottom
  quad(-hw, -hh, hd, hw, -hh, hd, hw, -hh,-hd,-hw, -hh,-hd,  0,-1, 0)
  // Left
  quad(-hw,  hh,-hd,-hw,  hh, hd,-hw, -hh, hd,-hw, -hh,-hd, -1, 0, 0)
  // Right
  quad( hw,  hh, hd, hw,  hh,-hd, hw, -hh,-hd, hw, -hh, hd,  1, 0, 0)

  void ti  // suppress unused warning

  return `solid fold_studio_box\n${faces.join('\n')}\nendsolid fold_studio_box`
}

export async function POST(req: NextRequest) {
  try {
    const { width, height, depth, thickness = 1 } = await req.json() as {
      width: number; height: number; depth: number; thickness?: number
    }

    if (!width || !height || !depth) {
      return NextResponse.json({ error: 'Dimensions manquantes' }, { status: 400 })
    }

    const stl = box3D(width, height, depth, thickness)

    return new NextResponse(stl, {
      headers: {
        'Content-Type': 'model/stl',
        'Content-Disposition': `attachment; filename="fold_studio_${width}x${height}x${depth}.stl"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur génération STL' }, { status: 500 })
  }
}
