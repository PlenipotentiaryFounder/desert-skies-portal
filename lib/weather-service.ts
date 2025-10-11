// Weather service for fetching real-time weather data
// Using OpenWeatherMap API as an example - replace with your preferred weather API

export interface WeatherData {
  temperature: number
  windSpeed: number
  visibility: number
  conditions: string
  pressure: number
  humidity: number
  dewPoint?: number
}

export interface WeatherTrendData {
  time: string
  temperature: number
  windSpeed: number
}

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key'
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

/**
 * Fetch current weather for a given location
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Weather data or fallback data if API fails
 */
export async function getCurrentWeather(lat: number = 33.7490, lon: number = -84.3880): Promise<WeatherData> {
  try {
    // In production, replace with real API call
    if (API_KEY === 'demo_key') {
      // Return demo data when no API key is configured
      return {
        temperature: 72,
        windSpeed: 8,
        visibility: 10,
        conditions: "Clear",
        pressure: 1013,
        humidity: 45,
        dewPoint: 52
      }
    }

    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      temperature: Math.round(data.main.temp),
      windSpeed: Math.round(data.wind.speed),
      visibility: Math.round((data.visibility || 10000) / 1609), // Convert meters to miles
      conditions: data.weather[0]?.main || "Clear",
      pressure: Math.round(data.main.pressure),
      humidity: data.main.humidity,
      dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5))
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)

    // Return fallback data
    return {
      temperature: 72,
      windSpeed: 8,
      visibility: 10,
      conditions: "Clear",
      pressure: 1013,
      humidity: 45,
      dewPoint: 52
    }
  }
}

/**
 * Fetch weather trend data for the next few hours
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Array of weather trend data points
 */
export async function getWeatherTrend(lat: number = 33.7490, lon: number = -84.3880): Promise<WeatherTrendData[]> {
  try {
    // In production, replace with real API call for forecast
    if (API_KEY === 'demo_key') {
      // Return demo trend data
      return [
        { time: "06:00", temperature: 65, windSpeed: 5 },
        { time: "08:00", temperature: 68, windSpeed: 6 },
        { time: "10:00", temperature: 72, windSpeed: 8 },
        { time: "12:00", temperature: 75, windSpeed: 10 },
        { time: "14:00", temperature: 78, windSpeed: 12 },
        { time: "16:00", temperature: 80, windSpeed: 14 },
        { time: "18:00", temperature: 75, windSpeed: 10 },
        { time: "20:00", temperature: 70, windSpeed: 8 }
      ]
    }

    // For now, return current weather repeated for trend
    const current = await getCurrentWeather(lat, lon)
    return Array.from({ length: 8 }, (_, i) => ({
      time: `${6 + i * 2}:00`,
      temperature: current.temperature + (Math.random() - 0.5) * 10,
      windSpeed: Math.max(0, current.windSpeed + (Math.random() - 0.5) * 5)
    }))
  } catch (error) {
    console.error('Error fetching weather trend:', error)

    // Return fallback trend data
    return [
      { time: "06:00", temperature: 65, windSpeed: 5 },
      { time: "08:00", temperature: 68, windSpeed: 6 },
      { time: "10:00", temperature: 72, windSpeed: 8 },
      { time: "12:00", temperature: 75, windSpeed: 10 },
      { time: "14:00", temperature: 78, windSpeed: 12 },
      { time: "16:00", temperature: 80, windSpeed: 14 },
      { time: "18:00", temperature: 75, windSpeed: 10 },
      { time: "20:00", temperature: 70, windSpeed: 8 }
    ]
  }
}
