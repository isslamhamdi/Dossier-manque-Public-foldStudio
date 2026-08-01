// #305 Storybook — VirtualList

import type { Meta, StoryObj } from '@storybook/react'
import { VirtualList } from './VirtualList'

const meta: Meta<typeof VirtualList> = {
  title: 'UI/VirtualList',
  component: VirtualList,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof VirtualList>

const ITEMS = Array.from({ length: 1000 }, (_, i) => ({ id: i, label: `Item ${i + 1}` }))

export const Default: Story = {
  render: () => (
    <VirtualList
      items={ITEMS}
      itemHeight={40}
      height={300}
      renderItem={(item) => {
        const row = item as { id: number; label: string }
        return <div style={{ padding: '10px 12px', borderBottom: '1px solid #eee', fontSize: 13 }}>{row.label}</div>
      }}
    />
  ),
}

export const Compact: Story = {
  render: () => (
    <VirtualList
      items={ITEMS.slice(0, 50)}
      itemHeight={28}
      height={200}
      renderItem={(item) => {
        const row = item as { id: number; label: string }
        return <div style={{ padding: '6px 12px', fontSize: 11, color: '#555' }}>{row.label}</div>
      }}
    />
  ),
}
