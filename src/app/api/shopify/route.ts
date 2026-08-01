import { NextRequest, NextResponse } from 'next/server'

// #62: Shopify integration — sync packaging design as product metafields
// POST body: { projectName, shopifyStore, accessToken, productId?, params, dieline }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectName, shopifyStore, accessToken, productId, params, dieline } = body

    if (!shopifyStore || !accessToken) {
      return NextResponse.json({ error: 'Missing shopifyStore or accessToken' }, { status: 400 })
    }

    const store = shopifyStore.replace(/https?:\/\//, '').replace(/\/$/, '')
    const apiUrl = `https://${store}/admin/api/2024-01`

    const metafields = [
      { namespace: 'fold_studio', key: 'project_name', value: projectName ?? 'Untitled', type: 'single_line_text_field' },
      { namespace: 'fold_studio', key: 'width_mm',     value: String(params?.width ?? 0), type: 'number_decimal' },
      { namespace: 'fold_studio', key: 'height_mm',    value: String(params?.height ?? 0), type: 'number_decimal' },
      { namespace: 'fold_studio', key: 'depth_mm',     value: String(params?.depth ?? 0), type: 'number_decimal' },
      { namespace: 'fold_studio', key: 'dieline_svg',  value: dieline ?? '', type: 'multi_line_text_field' },
      { namespace: 'fold_studio', key: 'synced_at',    value: new Date().toISOString(), type: 'single_line_text_field' },
    ]

    let targetId = productId

    // Create product if no ID provided
    if (!targetId) {
      const createRes = await fetch(`${apiUrl}/products.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({
          product: {
            title: projectName ?? 'Fold Studio Package',
            body_html: `<p>Packaging created with Fold Studio. Dimensions: ${params?.width ?? '?'} × ${params?.height ?? '?'} × ${params?.depth ?? '?'} mm</p>`,
            product_type: 'Packaging',
            tags: 'fold-studio,packaging',
          },
        }),
      })
      if (!createRes.ok) {
        const err = await createRes.text()
        return NextResponse.json({ error: 'Failed to create Shopify product', detail: err }, { status: 502 })
      }
      const createData = await createRes.json()
      targetId = createData.product?.id
    }

    // Upsert metafields
    const metaRes = await fetch(`${apiUrl}/products/${targetId}/metafields.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ metafield: metafields[0] }),
    })

    // Batch remaining metafields
    await Promise.all(metafields.slice(1).map(mf =>
      fetch(`${apiUrl}/products/${targetId}/metafields.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({ metafield: mf }),
      })
    ))

    if (!metaRes.ok) {
      const err = await metaRes.text()
      return NextResponse.json({ error: 'Failed to set metafields', detail: err }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      productId: targetId,
      url: `https://${store}/admin/products/${targetId}`,
      syncedAt: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error', detail: String(err) }, { status: 500 })
  }
}
