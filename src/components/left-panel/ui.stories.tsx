// #305 Storybook — CollapsibleSection, Toggle, ColorPicker

import type { Meta, StoryObj } from '@storybook/react'
import { CollapsibleSection, Toggle, ColorPicker, SliderRow } from './ui'
import { useState } from 'react'

// ── CollapsibleSection
const metaCollapsible: Meta<typeof CollapsibleSection> = {
  title: 'LeftPanel/CollapsibleSection',
  component: CollapsibleSection,
  parameters: { layout: 'padded' },
}
export default metaCollapsible

export const WithContent: StoryObj<typeof CollapsibleSection> = {
  render: () => (
    <div style={{ width: 240, fontFamily: 'system-ui' }}>
      <CollapsibleSection label="Dimensions">
        <p style={{ fontSize: 12, margin: 0 }}>Contenu de la section</p>
      </CollapsibleSection>
      <CollapsibleSection label="Matière">
        <p style={{ fontSize: 12, margin: 0 }}>Autre section</p>
      </CollapsibleSection>
    </div>
  ),
}

export const WithToggle: StoryObj = {
  render: () => {
    const [on, setOn] = useState(false)
    const [color, setColor] = useState('#e91e8c')
    return (
      <div style={{ width: 240, fontFamily: 'system-ui', padding: 16 }}>
        <Toggle on={on} onToggle={() => setOn(v => !v)} label="Activer l'effet" />
        <div style={{ marginTop: 16 }}>
          <ColorPicker label="Couleur principale" value={color} onChange={setColor} />
        </div>
      </div>
    )
  },
}

export const WithSlider: StoryObj = {
  render: () => {
    const [val, setVal] = useState(100)
    return (
      <div style={{ width: 240, fontFamily: 'system-ui', padding: 16 }}>
        <SliderRow label="Largeur" value={val} min={50} max={300} step={1} onChange={setVal} />
      </div>
    )
  },
}
