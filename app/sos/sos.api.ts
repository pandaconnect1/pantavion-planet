import type { GeoLocation } from '@/app/shared/types/geo'

export type SosDispatchPayload = {
  sessionId: string
  status: 'active' | 'updating' | 'resolved' | 'cancelled'
  sentAt: number
  location: GeoLocation
  isFallback: boolean
}

export async function dispatchSos(payload: SosDispatchPayload) {
  const res = await fetch('/api/sos/dispatch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`SOS dispatch failed: ${res.status}`)
  }

  return res.json()
}
