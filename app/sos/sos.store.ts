'use client'

import { create } from 'zustand'
import type { GeoLocation } from '@/app/shared/types/geo'

export type SosDeliveryState =
  | 'idle'
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'failed'
  | 'retrying'

export type SosSessionStatus =
  | 'idle'
  | 'active'
  | 'resolved'
  | 'cancelled'
  | 'failed'

type SosState = {
  isActive: boolean
  sessionId: string | null
  sessionStatus: SosSessionStatus
  activatedAt: number | null
  resolvedAt: number | null
  currentLocation: GeoLocation | null
  lastKnownLocation: GeoLocation | null
  lastSentLocation: GeoLocation | null
  deliveryState: SosDeliveryState
  retryCount: number
  lastSuccessfulSendAt: number | null
  error: string | null

  startSession: () => void
  stopSession: () => void
  resolveSession: () => void
  setCurrentLocation: (location: GeoLocation) => void
  setLastSentLocation: (location: GeoLocation) => void
  setDeliveryState: (state: SosDeliveryState) => void
  incrementRetry: () => void
  resetRetry: () => void
  setError: (message: string | null) => void
  reset: () => void
}

function createSessionId() {
  return `sos_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export const useSosStore = create<SosState>((set) => ({
  isActive: false,
  sessionId: null,
  sessionStatus: 'idle',
  activatedAt: null,
  resolvedAt: null,
  currentLocation: null,
  lastKnownLocation: null,
  lastSentLocation: null,
  deliveryState: 'idle',
  retryCount: 0,
  lastSuccessfulSendAt: null,
  error: null,

  startSession: () =>
    set({
      isActive: true,
      sessionId: createSessionId(),
      sessionStatus: 'active',
      activatedAt: Date.now(),
      resolvedAt: null,
      deliveryState: 'queued',
      retryCount: 0,
      error: null,
    }),

  stopSession: () =>
    set({
      isActive: false,
      sessionStatus: 'cancelled',
      resolvedAt: Date.now(),
      deliveryState: 'idle',
    }),

  resolveSession: () =>
    set({
      isActive: false,
      sessionStatus: 'resolved',
      resolvedAt: Date.now(),
      deliveryState: 'delivered',
      retryCount: 0,
    }),

  setCurrentLocation: (location) =>
    set({
      currentLocation: location,
      lastKnownLocation: location,
    }),

  setLastSentLocation: (location) =>
    set({
      lastSentLocation: location,
      lastSuccessfulSendAt: Date.now(),
    }),

  setDeliveryState: (state) => set({ deliveryState: state }),

  incrementRetry: () =>
    set((state) => ({
      retryCount: state.retryCount + 1,
      deliveryState: 'retrying',
    })),

  resetRetry: () => set({ retryCount: 0 }),

  setError: (message) =>
    set({
      error: message,
      deliveryState: message ? 'failed' : 'idle',
    }),

  reset: () =>
    set({
      isActive: false,
      sessionId: null,
      sessionStatus: 'idle',
      activatedAt: null,
      resolvedAt: null,
      currentLocation: null,
      lastKnownLocation: null,
      lastSentLocation: null,
      deliveryState: 'idle',
      retryCount: 0,
      lastSuccessfulSendAt: null,
      error: null,
    }),
}))
