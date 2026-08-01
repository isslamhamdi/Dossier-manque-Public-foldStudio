'use client'

/**
 * Multi-tab / multi-window collaboration via BroadcastChannel.
 * Same-origin only (no server needed). When Yjs + y-websocket are installed,
 * replace the BroadcastChannel transport with a Y.Doc + WebSocket provider —
 * the rest of the API stays identical.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { BoxParams, TemplateType, ImageLayer } from '@/lib/types'

const CHANNEL_NAME = 'fold-studio-collab'

type MessageType =
  | { type: 'state-update'; from: string; payload: CollabState }
  | { type: 'cursor'; from: string; name: string; color: string; x: number; y: number }
  | { type: 'heartbeat'; from: string; name: string; color: string }
  | { type: 'leave'; from: string }

export interface CollabState {
  params: BoxParams
  activeTemplate: TemplateType
  imageLayers: ImageLayer[]
}

export interface Collaborator {
  id: string
  name: string
  color: string
  lastSeen: number
}

const COLORS = ['#e91e8c', '#5A6BD4', '#00bcd4', '#ff9800', '#4caf50', '#9c27b0']

interface Options {
  state: CollabState
  onRemoteUpdate: (state: CollabState) => void
  enabled?: boolean
}

export function useCollaboration({ state, onRemoteUpdate, enabled = true }: Options) {
  // Lazy identity — initialized once on first client render, never during SSR.
  // Module-level Math.random() would run on both server and client, causing hydration mismatch.
  const identityRef = useRef<{ id: string; color: string; name: string } | null>(null)
  if (!identityRef.current) {
    const id = Math.random().toString(36).slice(2, 8)
    identityRef.current = { id, color: COLORS[Math.floor(Math.random() * COLORS.length)], name: `Designer ${id.slice(0, 3)}` }
  }
  const { id: CLIENT_ID, color: MY_COLOR, name: MY_NAME } = identityRef.current

  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastSentRef = useRef<string>('')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Prune stale collaborators (> 8s without heartbeat)
  useEffect(() => {
    const id = setInterval(() => {
      setCollaborators(prev => prev.filter(c => Date.now() - c.lastSeen < 8000))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === 'undefined') return

    const ch = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = ch
    setIsConnected(true)

    ch.onmessage = (ev: MessageEvent<MessageType>) => {
      const msg = ev.data
      if (!msg || msg.from === CLIENT_ID) return

      if (msg.type === 'state-update') {
        // Ignore if this is our own state echoed back by another tab
        const serialized = JSON.stringify(msg.payload)
        if (serialized === lastSentRef.current) return
        onRemoteUpdate(msg.payload)
      }

      if (msg.type === 'heartbeat' || msg.type === 'state-update' || msg.type === 'cursor') {
        const name = 'name' in msg ? msg.name : `User ${msg.from.slice(0, 3)}`
        const color = 'color' in msg ? msg.color : COLORS[0]
        setCollaborators(prev => {
          const existing = prev.findIndex(c => c.id === msg.from)
          const updated = { id: msg.from, name, color, lastSeen: Date.now() }
          if (existing >= 0) {
            const next = [...prev]
            next[existing] = updated
            return next
          }
          return [...prev, updated]
        })
      }

      if (msg.type === 'leave') {
        setCollaborators(prev => prev.filter(c => c.id !== msg.from))
      }
    }

    // Heartbeat every 4s
    const heartbeat = setInterval(() => {
      ch.postMessage({ type: 'heartbeat', from: CLIENT_ID, name: MY_NAME, color: MY_COLOR })
    }, 4000)

    // Announce on join
    ch.postMessage({ type: 'heartbeat', from: CLIENT_ID, name: MY_NAME, color: MY_COLOR })

    return () => {
      clearInterval(heartbeat)
      ch.postMessage({ type: 'leave', from: CLIENT_ID })
      ch.close()
      channelRef.current = null
      setIsConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Broadcast state changes — debounced 500ms to avoid 60fps JSON.stringify during drag
  const latestStateRef = useRef(state)
  const broadcastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  latestStateRef.current = state

  const scheduleBroadcast = useCallback(() => {
    if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current)
    broadcastTimerRef.current = setTimeout(() => {
      const ch = channelRef.current
      if (!ch) return
      const serialized = JSON.stringify(latestStateRef.current)
      if (serialized === lastSentRef.current) return
      lastSentRef.current = serialized
      ch.postMessage({ type: 'state-update', from: CLIENT_ID, name: MY_NAME, color: MY_COLOR, payload: latestStateRef.current })
    }, 500)
  }, [])

  // Auto-broadcast when state changes (debounced — state is recreated every render so we
  // use a ref for the value and a scheduler to avoid per-frame JSON.stringify)
  useEffect(() => { scheduleBroadcast() }, [state, scheduleBroadcast])

  return { collaborators, isConnected, myId: CLIENT_ID, myName: MY_NAME, myColor: MY_COLOR }
}
