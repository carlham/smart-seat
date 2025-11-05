import { useState, useEffect } from "react";

export default function SeatStatus() {
  const [seatData, setSeatData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSeatData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:1880/api/seat");
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();

      // Node-RED may return msg.payload = { weight, temperature }
      // or the API may return a full object. Normalize payload here.
      const payload = data.payload ?? data;

      // Ensure numeric values
      const weight = Number(payload.weight ?? 0);
      const temperature = Number(payload.temperature ?? 0);

      // Derive a friendly status and color from the simulation rules
      const computeColorAndStatus = ({ weight, temperature }) => {
        // Use Node-RED simulation ranges:
        // empty: weight ~ 0-3, temp ~22-24
        // object: weight ~5-30, temp ~23-25
        // person: weight ~40-80, temp ~27-32
        let state = "unknown";
        if (weight <= 3) state = "empty";
        else if (weight >= 40) state = "person";
        else if (weight >= 5) state = "object";

        // temperature can strengthen a person hypothesis
        if (temperature >= 27 && weight > 10) state = "person";

        switch (state) {
          case "empty":
            return { color: "#5cb85c", status: "Empty" };
          case "object":
            return { color: "#337ab7", status: "Object detected" };
          case "person":
            return { color: "#d9534f", status: "Person detected" };
          default:
            return { color: "#777", status: "Unknown" };
        }
      };

      const { color, status } = computeColorAndStatus({ weight, temperature });

      const seatId = data.seatId ?? payload.seatId ?? "-";
      const timestamp = data.timestamp ?? payload.timestamp ?? new Date().toISOString();

      setSeatData({ ...payload, weight, temperature, color, status, seatId, timestamp });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial state once on mount so user doesn't have to click
  useEffect(() => {
    fetchSeatData();
  }, []);


  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        backgroundColor: "#f4f4f4",
      }}
    >
      <h1>🚆 Train Seat Occupancy</h1>

      <button
        onClick={fetchSeatData}
        style={{
          padding: "10px 20px",
          fontSize: "1rem",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          marginBottom: 20,
          backgroundColor: "#333",
          color: "white",
        }}
        disabled={loading}
      >
        {loading ? "Fetching..." : "Check Seat"}
      </button>

      {error && <div style={{ color: "red", marginBottom: 20 }}>Error: {error}</div>}

      {seatData && (
        <>
          <div
            style={{
              width: 200,
              height: 200,
              backgroundColor: seatData.color,
              borderRadius: 20,
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "bold",
              transition: "background-color 0.5s ease",
            }}
          >
            {seatData.status ?? "—"}
          </div>

          <div style={{ marginTop: 20, fontSize: "1rem", textAlign: "center" }}>
            <p>💺 Seat ID: {seatData.seatId ?? "-"}</p>
            <p>⚖️ Weight: {(seatData.weight ?? 0).toFixed(1)} kg</p>
            <p>🌡️ Temperature: {(seatData.temperature ?? 0).toFixed(1)} °C</p>
            <p>🕒 {seatData.timestamp ? new Date(seatData.timestamp).toLocaleTimeString() : "-"}</p>
          </div>
        </>
      )}
    </div>
  );
}