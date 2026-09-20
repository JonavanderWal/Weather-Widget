import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./App.css";

function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [city, setCity] = useState("Amsterdam");
  const [searchInput, setSearchInput] = useState("Amsterdam");
  const [location, setLocation] = useState("Amsterdam");

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    async function fetchWeather() {
      const key = import.meta.env.VITE_TOMORROW_API_KEY;

      const url = `https://api.tomorrow.io/v4/timelines?location=${encodeURIComponent(
        location
      )}&fields=temperature,humidity,windSpeed,temperatureMin,temperatureMax,weatherCode,uvIndex,temperatureApparent&timesteps=1h,1d&units=metric&apikey=${key}`;

      try {
        setLoading(true);
        setError("");

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`API fout: ${res.status}`);
        }

        const data = await res.json();

        console.log("Weerdata:", data);
        setWeather(data);
      } catch (err) {
        console.error(err);
        setError("Het weer kon niet worden opgehaald.");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [location]);

  function handleSearch() {
    if (!searchInput.trim()) return;

    setCity(searchInput.trim());
    setLocation(searchInput.trim());
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation wordt niet ondersteund door deze browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLocation(`${lat},${lon}`);

        try {
          const response = await fetch(
            `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`
          );

          const data = await response.json();

          const cityName =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            data.address?.suburb ||
            data.address?.county ||
            data.display_name?.split(",")[0] ||
            "Mijn locatie";

          setCity(cityName);
          setSearchInput(cityName);
        } catch (err) {
          console.error("Plaatsnaam ophalen mislukt:", err);
          setCity("Mijn locatie");
          setSearchInput("");
        }
      },
      () => {
        alert("Locatie ophalen is mislukt of geweigerd.");
      }
    );
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function getWeatherIcon(code) {
    if ([1000].includes(code)) {
      return "sun.svg";
    }

    if ([1100, 1101, 1102].includes(code)) {
      return "sun-cloud.svg";
    }

    if ([1001].includes(code)) {
      return "cloud.svg";
    }

    if ([4000, 4001, 4200, 4201].includes(code)) {
      return "rain.svg";
    }

    if ([5000, 5001, 5100, 5101].includes(code)) {
      return "snow.svg";
    }

    return "cloud.svg";
  }

  function getUvLabel(uvIndex) {
    if (uvIndex === undefined || uvIndex === null) {
      return "--";
    }

    if (uvIndex >= 8) {
      return "Hoog";
    }

    if (uvIndex >= 6) {
      return "Gemiddeld";
    }

    return "Laag";
  }

  if (loading) {
    return (
      <div className="page">
        <div className={`widget ${theme}`}>
          <div className="loading">
            <div className="spinner"></div>
            <p>Weerdata laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="page">
        <div className={`widget ${theme}`}>
          <p className="error">{error || "Geen data beschikbaar"}</p>
        </div>
      </div>
    );
  }

  const hourlyTimeline = weather?.data?.timelines?.find(
    (timeline) => timeline.timestep === "1h"
  );

  const dailyTimeline = weather?.data?.timelines?.find(
    (timeline) => timeline.timestep === "1d"
  );

  const current = hourlyTimeline?.intervals?.[0]?.values;

  const days = dailyTimeline?.intervals?.slice(0, 3) || [];

  const chartData =
    hourlyTimeline?.intervals?.slice(0, 24).map((hour) => ({
      time: new Date(hour.startTime).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temp: Math.round(hour.values.temperature),
    })) || [];

  return (
    <div className="page">
      <div className={`widget ${theme}`}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? "☀️" : "🌙"}
      </button>

        <h1>Weather Widget</h1>

        <div className="search-container">
          <input
            type="text"
            placeholder="Zoek een stad..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search"
          />

          <button onClick={handleSearch} className="search-button">
            Zoek
          </button>
        </div>

        <button className="location-button" onClick={handleUseLocation}>
          📍 Gebruik mijn locatie
        </button>

        <div className="location">
          <img
            src={`/icons/${getWeatherIcon(current?.weatherCode)}`}
            alt="Weer icoon"
            className="weather-icon"
          />

          <h2>{city}</h2>
        </div>

        <div className="current">
          <div className="temp">
            {Math.round(current?.temperature ?? 0)}°C
          </div>

          <div className="info">
            <p>💨 Wind: {current?.windSpeed ?? "--"} km/u</p>
            <p>💧 Vochtigheid: {current?.humidity ?? "--"}%</p>
          </div>
        </div>

        <div className="chart-container">
          <h3>Temperatuur komende 24 uur</h3>

          <ResponsiveContainer width="100%" height={190}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />

              <XAxis
                dataKey="time"
                interval={5}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                tickFormatter={(value) => `${value}°`}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />

              <Tooltip
                formatter={(value) => [`${value}°C`, "Temperatuur"]}
                labelFormatter={(label) => `Tijd: ${label}`}
                wrapperStyle={{ outline: "none" }}
              />

              <Line
                type="monotone"
                dataKey="temp"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="forecast">
          {days.map((day, index) => (
            <div key={index} className="day">
              <div className="forecast-top">
                <img
                  src={`/icons/${getWeatherIcon(day.values.weatherCode)}`}
                  alt="Weersverwachting icoon"
                  className="forecast-icon"
                />

                <p>
                  {new Date(day.startTime).toLocaleDateString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              <p className="temp-small">
                {Math.round(day.values.temperatureMin ?? 0)}° /{" "}
                {Math.round(day.values.temperatureMax ?? 0)}°
              </p>
            </div>
          ))}
        </div>

        <div className="extra-data">
          <div className="extra-card">
            <p className="extra-title">☀️ UV Index</p>

            <p className="extra-value">{current?.uvIndex ?? "--"}</p>

            <div className="uv-bar">
              <div
                className="uv-indicator"
                style={{
                  left: `${Math.min((current?.uvIndex ?? 0) * 10, 100)}%`,
                }}
              ></div>
            </div>

            <p className="extra-label">{getUvLabel(current?.uvIndex)}</p>
          </div>

          <div className="extra-card">
            <p className="extra-title">🌡️ Feels Like</p>

            <p className="extra-value">
              {current?.temperatureApparent !== undefined
                ? `${Math.round(current.temperatureApparent)}°`
                : "--"}
            </p>

            <p className="extra-label">Gevoelstemperatuur</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;