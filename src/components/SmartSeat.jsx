import { useState, useEffect, useRef } from "react";

export default function SeatMonitor() {
  const [occupied, setOccupied] = useState(null); // true/false/null
  const [latest, setLatest] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:1880/seat");

    socket.onmessage = (e) => {
      if (!e.data.includes("JSON:")) return;
      try {
        const json = JSON.parse(e.data.split("JSON:")[1]);
        if (json.event === "seat") {
          setLatest(json);
          setOccupied(json.occupied);  // true / false / null
        }
      } catch (err) {}
    };

    socket.onclose = () => setTimeout(() => location.reload(), 3000);
    ws.current = socket;

    return () => socket.close();
  }, []);

  const status = occupied === true ? "OCCUPIED" :
                 occupied === false ? "VACANT" : "WAITING";
  const color = occupied === true ? "#d9534f" :
                occupied === false ? "#5cb85c" : "#6c757d";

  return (
    <div style={{textAlign:"center", paddingTop:"15vh", fontFamily:"sans-serif", background:"#111", color:"white", minHeight:"100vh"}}>
      <h1>SmartSeat Live</h1>
      <div style={{
        width:400, height:400, margin:"40px auto",
        borderRadius:"50%", background:color,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        fontSize:"4rem", fontWeight:"bold", boxShadow:"0 0 0 60px rgba(0,0,0,0.8)"
      }}>
        {status === "OCCUPIED" && "Seated Person"}
        {status === "VACANT" && "Open Seat"}
        {status === "WAITING" && "Magnifying Glass"}
        <div style={{fontSize:"3rem", marginTop:20}}>{status}</div>
      </div>

      {latest && (
        <div style={{fontSize:"1.4rem"}}>
          <p>Trigger: {latest.trigger === "sit" ? "Person sat" : "Person left"}</p>
          <p>ΔT = <strong style={{color: latest.diff>0?"#ff6b6b":"#51cf66"}}>
            {latest.diff>0?"+":""}{latest.diff.toFixed(3)} °C
          </strong></p>
        </div>
      )}

      <p style={{position:"fixed", bottom:20, width:"100%", opacity:0.7}}>
        Press seat button to test • {new Date().getFullYear()}
      </p>
    </div>
  );
}