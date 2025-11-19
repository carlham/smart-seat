import { useState, useEffect, useRef } from "react";

export default function SeatStatus() {
  const [seatData, setSeatData] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const ws = useRef(null); // Keep WebSocket instance

  // Helper to compute color/status (same logic as before)
  const computeColorAndStatus = ({ weight, temperature }) => {
    // 1. Empty is easy and almost never wrong
    if (weight <= 4) {
      return { color: "#5cb85c", status: "Empty", reason: "No weight" };
    }

    // 2. Strong person signal — high weight + clearly elevated temperature
    if (weight > 10 && temperature >= 23.51) {
      return { color: "#d9534f", status: "Person detected", reason: "Weight + body heat" };
    }

    // 3. Strong object signal — decent weight but temperature still ambient
    if (weight >= 5 && temperature <= 23.5) {
      return { color: "#337ab7", status: "Object detected", reason: "Weight, no heat" };
    }

    // 4. Everything else = uncertain
    return { 
      color: "#f0ad4e", 
      status: "Uncertain", 
      reason: `Weight ${weight.toFixed(1)} kg, Temp ${temperature.toFixed(1)} °C` 
    };
  };

  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket("ws://localhost:1880/ws/seat");

    socket.onopen = () => {
      console.log("WebSocket connected");
      setConnecting(false);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        // Node-RED sends the full seat object directly
        const data = JSON.parse(event.data);

        const weight = Number(data.weight ?? 0);
        const temperature = Number(data.temperature ?? 0);
        const { color, status } = computeColorAndStatus({ weight, temperature });

        setSeatData({
          ...data,
          weight,
          temperature,
          color,
          status,
          seatId: data.seatId ?? "-",
          timestamp: data.timestamp ?? new Date().toISOString(),
        });
        console.log(data)
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error", err);
      setError("WebSocket connection error");
      setConnecting(false);
    };

    socket.onclose = () => {
      console.log("WebSocket closed – reconnecting in 3s...");
      setError("Connection lost – reconnecting...");
      setConnecting(true);

      // Auto-reconnect after 3 seconds
      setTimeout(() => {
        ws.current = null;
        // useEffect will run again and reconnect
        setSeatData(null);
      }, 3000);
    };

    ws.current = socket;

    // Cleanup on unmount
    return () => {
      socket.close();
    };
  }, []); // Run only once on mount

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
      <h1>Train Seat Occupancy (Live)</h1>

      {connecting && (
        <p style={{ color: "#999" }}>Connecting to live updates...</p>
      )}

      {error && (
        <div style={{ color: "red", marginBottom: 20 }}>⚠️ {error}</div>
      )}

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
              fontSize: "1.4rem",
              fontWeight: "bold",
              color: "white",
              textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
              transition: "background-color 0.5s ease",
            }}
          >
            {seatData.status}
          </div>

          <div style={{ marginTop: 30, textAlign: "center", fontSize: "1.1rem" }}>
            <p>💺 Seat ID: {seatData.seatId}</p>
            <p>Weight: {seatData.weight}</p>
            <p>Temperature: {seatData.temperature}</p>
            <p>Weight and temp just here for testing purposes, <br/>will not be visible on final product</p>
            <p style={{ fontSize: "0.9rem", color: "#666", marginTop: 10 }}>
              Updated: {new Date(seatData.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </>
      )}

      {!seatData && !connecting && !error && (
        <p>Waiting for first update...</p>
      )}
    </div>
  );
}