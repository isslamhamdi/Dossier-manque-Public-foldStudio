'use client'

// #293 Virtual scroll grande liste — TanStack Virtual

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  height?: number
  className?: string
  style?: React.CSSProperties
}

export function VirtualList<T>({ items, itemHeight, renderItem, height = 400, style }: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  return (
    <div
      ref={parentRef}
      style={{ height, overflow: 'auto', ...style }}
    >
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(vItem => (
          <div
            key={vItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: vItem.size,
              transform: `translateY(${vItem.start}px)`,
            }}
          >
            {renderItem(items[vItem.index], vItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
