"use client"

import { useEffect, useRef, useState } from "react"
import type { GeoLocation, LocationStatus, LocationError } from "../types/geo"

export function useLocationEngine() {
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [status, setStatus] = useState<LocationStatus>("idle")
  const [error, setError] = useState<LocationError | null>(null)

  const watchRef = useRef<number | null>(null)

  const start = () => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported")
      setError({ code: 0, message: "Geolocation not supported" })
      return
    }

    setStatus("requesting")

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        })
        setStatus("tracking")
        setError(null)
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error")
        setError({ code: err.code, message: err.message })
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
      }
    )
  }

  const stop = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setStatus("idle")
  }

  useEffect(() => {
    return () => stop()
  }, [])

  return { location, status, error, start, stop }
}
