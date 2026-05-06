declare global {
  interface Window {
    __travelinGoogleMapsInit?: () => void
    google?: any
  }
}

let googleMapsPromise: Promise<any> | null = null

export function loadGoogleMapsApi(apiKey: string) {
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key is required'))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (googleMapsPromise) {
    return googleMapsPromise
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-api')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google))
      existingScript.addEventListener('error', () => reject(new Error('Google Maps API failed to load')))
      return
    }

    window.__travelinGoogleMapsInit = () => {
      resolve(window.google)
      delete window.__travelinGoogleMapsInit
    }

    const script = document.createElement('script')
    script.id = 'google-maps-api'
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=__travelinGoogleMapsInit`
    script.onerror = () => {
      reject(new Error('Google Maps API failed to load'))
      googleMapsPromise = null
    }

    document.head.appendChild(script)
  })

  return googleMapsPromise
}
