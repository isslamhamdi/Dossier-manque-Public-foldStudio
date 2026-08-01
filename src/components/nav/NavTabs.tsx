'use client'

import { c, fs, fw } from '@/lib/tokens'

interface NavTabsProps {
  activeTab: 'fold' | 'unfold'
  onTabChange: (tab: 'fold' | 'unfold') => void
}

export function NavTabs({ activeTab, onTabChange }: NavTabsProps) {
  const TAB_W = 88

  return (
    <div style={{
      flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
      WebkitAppRegion: 'no-drag',
    } as React.CSSProperties}>
      <div style={{ position: 'relative', display: 'flex', marginBottom: -1 }}>
        {/* sliding underline */}
        <div
          aria-hidden
          style={{
            position: 'absolute', bottom: 0, height: 2,
            width: TAB_W, background: c.ink,
            transition: 'transform 0.22s ease',
            transform: `translateX(${activeTab === 'fold' ? 0 : TAB_W}px)`,
          }}
        />
        {(['fold', 'unfold'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: '2px solid transparent',
              color: activeTab === tab ? c.ink : c.textLight,
              width: TAB_W,
              height: 40,
              cursor: 'pointer',
              fontSize: fs.lg,
              fontWeight: activeTab === tab ? fw.medium : fw.normal,
              textTransform: 'capitalize',
              transition: 'color 0.18s',
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
