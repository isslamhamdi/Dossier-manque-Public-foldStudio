'use client'

import * as RadixSelect from '@radix-ui/react-select'
import { c, fs, r } from '@/lib/tokens'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function Select({ value, options, onChange, placeholder, style }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger
        className="fs-select-trigger fs-input"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: '#fff', border: `1px solid ${c.border}`,
          color: '#333', padding: '5px 8px', borderRadius: r.md,
          fontSize: fs.md, cursor: 'pointer', outline: 'none',
          fontFamily: 'inherit', gap: 6, ...style,
        }}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon style={{ flexShrink: 0 }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          style={{
            background: '#fff', border: `1px solid ${c.borderLight}`,
            borderRadius: r.lg, padding: 4,
            minWidth: 'var(--radix-select-trigger-width)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 9999,
          }}
        >
          <RadixSelect.Viewport>
            {options.map(opt => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                className="fs-select-item"
                style={{
                  padding: '5px 8px', fontSize: fs.md, cursor: 'pointer',
                  borderRadius: r.sm, outline: 'none', color: '#333',
                  userSelect: 'none', listStyle: 'none',
                }}
              >
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
