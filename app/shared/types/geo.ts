export type GeoLocation = {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
}

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'tracking'
  | 'denied'
  | 'unsupported'
  | 'error'

export type LocationError = {
  code: number
  message: string
}
