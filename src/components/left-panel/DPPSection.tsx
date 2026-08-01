'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DPPSectionProps {
  onAddLayer: (l: ImageLayer) => void
}

interface DPPData {
  productName: string
  manufacturer: string
  material: string
  countryOfOrigin: string
  recycledContent: number
  certifications: string[]
  manufactureDate: string
  qrUrl: string
}

// ─── Static data ─────────────────────────────────────────────────────────────

const MATERIAL_OPTIONS = [
  { id: 'carton',         label: 'Carton' },
  { id: 'kraft',          label: 'Kraft' },
  { id: 'plastique-pet',  label: 'Plastique PET' },
  { id: 'alu',            label: 'Aluminium' },
  { id: 'verre',          label: 'Verre' },
  { id: 'carton-recycle', label: 'Carton Recyclé' },
  { id: 'papier-couche',  label: 'Papier Couché' },
]

const CERTIFICATIONS = ['FSC', 'PEFC', 'ISO-14001', 'Recyclable', 'Bio-based']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAutoUrl(data: DPPData): string {
  const params = new URLSearchParams({
    name:     data.productName,
    mfr:      data.manufacturer,
    mat:      data.material,
    origin:   data.countryOfOrigin,
    recycled: String(data.recycledContent),
    certs:    data.certifications.join(','),
    date:     data.manufactureDate,
    reg:      '2024/1781',
  })
  return `https://dpp.example.com/product?${params.toString()}`
}

function buildJsonLd(data: DPPData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.productName,
    manufacturer: {
      '@type': 'Organization',
      name: data.manufacturer,
    },
    material: data.material,
    countryOfOrigin: data.countryOfOrigin,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'recycledContent',
        value: `${data.recycledContent}%`,
      },
      {
        '@type': 'PropertyValue',
        name: 'certifications',
        value: data.certifications,
      },
      {
        '@type': 'PropertyValue',
        name: 'euDppCompliance',
        value: '2024/1781',
      },
      {
        '@type': 'PropertyValue',
        name: 'manufactureDate',
        value: data.manufactureDate,
      },
    ],
  }
}

function downloadJsonLd(data: DPPData): void {
  const jsonLd = buildJsonLd(data)
  const blob = new Blob([JSON.stringify(jsonLd, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `dpp-${(data.productName || 'product').replace(/\s+/g, '-').toLowerCase()}.jsonld`
  a.click()
  URL.revokeObjectURL(url)
}

async function generateQRDataUrl(text: string): Promise<string> {
  const QRCode = (await import('qrcode')).default
  return QRCode.toDataURL(text, {
    width: 256,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DPPSection({ onAddLayer }: DPPSectionProps) {
  const [productName,     setProductName]     = useState('')
  const [manufacturer,    setManufacturer]    = useState('')
  const [material,        setMaterial]        = useState('carton')
  const [countryOfOrigin, setCountryOfOrigin] = useState('France')
  const [recycledContent, setRecycledContent] = useState(0)
  const [certifications,  setCertifications]  = useState<string[]>([])
  const [manufactureDate, setManufactureDate] = useState('')
  const [qrUrl,           setQrUrl]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [qrPreview,       setQrPreview]       = useState<string | null>(null)

  const getDPPData = (): DPPData => ({
    productName, manufacturer, material, countryOfOrigin,
    recycledContent, certifications, manufactureDate, qrUrl,
  })

  const effectiveUrl = qrUrl.trim() || buildAutoUrl(getDPPData())

  const toggleCert = (cert: string) => {
    setCertifications(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    )
  }

  const handleGenerateQR = async () => {
    setLoading(true)
    try {
      const dataUrl = await generateQRDataUrl(effectiveUrl)
      setQrPreview(dataUrl)

      const layer: ImageLayer = {
        id:             `dpp-qr-${Date.now()}`,
        name:           `QR DPP — ${productName || 'Produit'}`,
        src:            dataUrl,
        x:              10,
        y:              10,
        width:          25,
        height:         25,
        scale:          1,
        rotation:       0,
        visible:        true,
        locked:         false,
        faceAssignment: 'auto',
        opacity:        1,
        kind:           'qr',
        naturalWidth:   256,
        naturalHeight:  256,
      }
      onAddLayer(layer)
    } catch (err) {
      console.error('QR generation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadJsonLd = () => {
    downloadJsonLd(getDPPData())
  }

  return (
    <CollapsibleSection label="Passeport Produit Numérique">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Regulation badge */}
        <div style={{
          background: '#e8f5e9',
          border: '1px solid #a5d6a7',
          borderRadius: r.md,
          padding: '5px 9px',
          fontSize: 10,
          color: '#2e7d32',
          fontWeight: fw.bold,
          letterSpacing: 0.3,
        }}>
          Conforme Règlement UE 2024/1781
        </div>

        {/* Nom du produit */}
        <div>
          <FieldLabel>Nom du produit</FieldLabel>
          <input
            type="text"
            value={productName}
            placeholder="Ex: Boîte cosmétique"
            onChange={e => setProductName(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Fabricant */}
        <div>
          <FieldLabel>Fabricant</FieldLabel>
          <input
            type="text"
            value={manufacturer}
            placeholder="Ex: Entreprise SAS"
            onChange={e => setManufacturer(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Matière principale */}
        <div>
          <FieldLabel>Matière principale</FieldLabel>
          <select
            value={material}
            onChange={e => setMaterial(e.target.value)}
            style={inputStyle}
          >
            {MATERIAL_OPTIONS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Pays de fabrication */}
        <div>
          <FieldLabel>Pays de fabrication</FieldLabel>
          <input
            type="text"
            value={countryOfOrigin}
            onChange={e => setCountryOfOrigin(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* % matière recyclée */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <FieldLabel>% matière recyclée</FieldLabel>
            <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: '#388e3c' }}>
              {recycledContent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={recycledContent}
            onChange={e => setRecycledContent(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#388e3c', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: c.textMuted, marginTop: 2 }}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Certifications */}
        <div>
          <FieldLabel>Certifications</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CERTIFICATIONS.map(cert => {
              const active = certifications.includes(cert)
              return (
                <button
                  key={cert}
                  onClick={() => toggleCert(cert)}
                  style={{
                    background:   active ? '#1a1a1a' : '#f5f5f5',
                    color:        active ? '#fff' : c.textMed,
                    border:       `1px solid ${active ? '#1a1a1a' : '#d0d0d0'}`,
                    borderRadius: r.pill,
                    padding:      '3px 9px',
                    fontSize:     10,
                    fontWeight:   active ? fw.bold : fw.normal,
                    cursor:       'pointer',
                    transition:   'all 0.15s',
                  }}
                >
                  {cert}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date de fabrication */}
        <div>
          <FieldLabel>Date de fabrication</FieldLabel>
          <input
            type="date"
            value={manufactureDate}
            onChange={e => setManufactureDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* URL destination QR */}
        <div>
          <FieldLabel>URL destination QR</FieldLabel>
          <input
            type="text"
            value={qrUrl}
            placeholder="Auto-généré si vide"
            onChange={e => setQrUrl(e.target.value)}
            style={inputStyle}
          />
          {!qrUrl.trim() && (
            <div style={{
              marginTop: 4,
              fontSize: 9,
              color: c.textMuted,
              wordBreak: 'break-all',
              lineHeight: 1.4,
            }}>
              {effectiveUrl.slice(0, 80)}{effectiveUrl.length > 80 ? '…' : ''}
            </div>
          )}
        </div>

        {/* QR preview */}
        {qrPreview && (
          <div style={{ textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrPreview}
              alt="QR DPP preview"
              style={{
                width: 100,
                height: 100,
                border: `1px solid ${c.borderLight}`,
                borderRadius: r.md,
                display: 'inline-block',
              }}
            />
            <div style={{ fontSize: 9, color: c.textMuted, marginTop: 4 }}>
              Calque ajouté
            </div>
          </div>
        )}

        {/* Action buttons */}
        <button
          onClick={handleGenerateQR}
          disabled={loading}
          style={{
            ...btnPrimary,
            background: loading ? '#999' : '#1a1a1a',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Génération…' : 'Générer QR DPP'}
        </button>

        <button
          onClick={handleDownloadJsonLd}
          style={{
            ...btnPrimary,
            background: '#2e7d32',
          }}
        >
          Télécharger JSON-LD
        </button>

        {/* JSON-LD preview */}
        <details style={{ marginTop: 2 }}>
          <summary style={{
            fontSize: 10,
            color: c.textMuted,
            cursor: 'pointer',
            userSelect: 'none',
            letterSpacing: 0.3,
          }}>
            Aperçu JSON-LD
          </summary>
          <pre style={{
            marginTop: 8,
            fontSize: 9,
            color: '#444',
            background: '#f8f8f8',
            border: `1px solid ${c.borderLight}`,
            borderRadius: r.md,
            padding: '8px',
            overflowX: 'auto',
            maxHeight: 180,
            overflowY: 'auto',
            lineHeight: 1.5,
          }}>
            {JSON.stringify(buildJsonLd(getDPPData()), null, 2)}
          </pre>
        </details>

      </div>
    </CollapsibleSection>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d0d0d0',
  borderRadius: 4,
  padding: '5px 8px',
  fontSize: 11,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#333',
}

const btnPrimary: React.CSSProperties = {
  width: '100%',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  padding: '8px 0',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
}
