'use client'

import { useEffect } from 'react'
import { useLocationEngine } from '@/app/shared/location/useLocationEngine'
import { useSosStore } from './sos.store'
import { dispatchSos } from './sos.api'

export default function SOSPage() {
  const { location, status, error, start, stop } = useLocationEngine()

  const {
    isActive,
    sessionId,
    sessionStatus,
    currentLocation,
    lastKnownLocation,
    deliveryState,
    retryCount,
    startSession,
    stopSession,
    setCurrentLocation,
    setLastSentLocation,
    setDeliveryState,
    incrementRetry,
    setError,
  } = useSosStore()

  useEffect(() => {
    if (isActive) {
      start()
      return
    }

    stop()
  }, [isActive, start, stop])

  useEffect(() => {
    if (!location) return
    setCurrentLocation(location)
  }, [location, setCurrentLocation])

  useEffect(() => {
    if (!error) return
    setError(error.message)
  }, [error, setError])

  useEffect(() => {
    if (!isActive || !currentLocation || !sessionId) return

    let cancelled = false

    const send = async () => {
      try {
        setDeliveryState('sending')

        await dispatchSos({
          sessionId,
          status: 'active',
          sentAt: Date.now(),
          location: currentLocation,
          isFallback: false,
        })

        if (cancelled) return

        setLastSentLocation(currentLocation)
        setDeliveryState('delivered')
      } catch {
        if (cancelled) return

        setDeliveryState('failed')
        incrementRetry()

        setTimeout(() => {
          if (!cancelled) {
            send()
          }
        }, 3000)
      }
    }

    send()

    return () => {
      cancelled = true
    }
  }, [
    isActive,
    currentLocation,
    sessionId,
    setDeliveryState,
    setLastSentLocation,
    incrementRetry,
  ])

  return (
    <main
      style={{
        padding: 20,
        color: 'white',
        background: '#0c1730',
        minHeight: '100vh',
      }}
    >
      <h1>SOS SYSTEM</h1>

      <div style={{ marginTop: 20 }}>
        <button onClick={startSession}>START SOS</button>

        <button onClick={stopSession} style={{ marginLeft: 10 }}>
          STOP SOS
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <p><b>Session:</b> {sessionId ?? 'none'}</p>
        <p><b>Session status:</b> {sessionStatus}</p>
        <p><b>Tracking status:</b> {status}</p>
        <p><b>Delivery:</b> {deliveryState}</p>
        <p><b>Retry count:</b> {retryCount}</p>
      </div>

      {currentLocation && (
        <div style={{ marginTop: 24 }}>
          <h2>Current Location</h2>
          <p><b>Lat:</b> {currentLocation.lat}</p>
          <p><b>Lng:</b> {currentLocation.lng}</p>
          <p><b>Accuracy:</b> {currentLocation.accuracy} meters</p>
          <p><b>Timestamp:</b> {currentLocation.timestamp}</p>
        </div>
      )}

      {lastKnownLocation && (
        <div style={{ marginTop: 24 }}>
          <h2>Last Known Location</h2>
          <p><b>Lat:</b> {lastKnownLocation.lat}</p>
          <p><b>Lng:</b> {lastKnownLocation.lng}</p>
          <p><b>Accuracy:</b> {lastKnownLocation.accuracy} meters</p>
        </div>
      )}

      {error && (
        <p style={{ marginTop: 24, color: 'red' }}>
          <b>ERROR:</b> {error.message}
        </p>
      )}
    </main>
  )
}
