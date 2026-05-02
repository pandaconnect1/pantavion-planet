"use client"

import { useLocationEngine } from "@/app/shared/location/useLocationEngine"

export default function SOSPage() {
  const { location, status, error, start, stop } = useLocationEngine()

  return (
    <div
      style={{
        padding: 20,
        color: "white",
        background: "#0c1730",
        minHeight: "100vh",
      }}
    >
      <h1>SOS SYSTEM</h1>

      <div style={{ marginTop: 20 }}>
        <button onClick={start}>START TRACKING</button>
        <button onClick={stop} style={{ marginLeft: 10 }}>
          STOP
        </button>
      </div>

      <div style={{ marginTop: 20 }}>
        <p>
          <b>Status:</b> {status}
        </p>

        {location && (
          <>
            <p>
              <b>Lat:</b> {location.lat}
            </p>
            <p>
              <b>Lng:</b> {location.lng}
            </p>
            <p>
              <b>Accuracy:</b> {location.accuracy}
            </p>
          </>
        )}

        {error && <p style={{ color: "red" }}>ERROR: {error.message}</p>}
      </div>
    </div>
  )
}
