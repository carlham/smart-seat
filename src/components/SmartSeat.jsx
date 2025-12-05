import { useState, useEffect } from 'react';
import { Users, Thermometer, Clock, TrendingUp, AlertCircle } from 'lucide-react';

export default function TrainSeatMonitor() {
  const [seatData, setSeatData] = useState(null);
  const [previousTemp, setPreviousTemp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [occupancyReason, setOccupancyReason] = useState('');

  // Read ThingSpeak channel/config from environment (Vite exposes VITE_* vars to the client)
  const CHANNEL_ID = import.meta.env.VITE_CHANNEL_ID;
  const API_KEY = import.meta.env.VITE_API_KEY;
  const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${API_KEY}&results=20`; // Get last 20 readings (5 minutes)
  const TEMP_RISE_THRESHOLD = 0.5; // Temperature rise threshold in °C
  const ABS_TEMP_THRESHOLD = 28.0; // Absolute temperature indicating body heat (°C)

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      
      if (data.feeds && data.feeds.length > 0) {
        const latest = data.feeds[data.feeds.length - 1]; // Most recent
        const previous = data.feeds.length > 1 ? data.feeds[data.feeds.length - 2] : null;
        
        const currentTemp = parseFloat(latest.field1);
        const prevTemp = previous ? parseFloat(previous.field1) : null;
        const pressureDetected = parseInt(latest.field2) === 1;
        
        // Calculate immediate temperature change
        const tempRise = prevTemp !== null ? currentTemp - prevTemp : 0;
        
        // Check if there was ANY significant temp rise in recent history
        let hadRecentTempSpike = false;
        if (data.feeds.length >= 3) {
          for (let i = data.feeds.length - 1; i >= 1; i--) {
            const currentReading = parseFloat(data.feeds[i].field1);
            const previousReading = parseFloat(data.feeds[i - 1].field1);
            const rise = currentReading - previousReading;
            
            if (rise >= TEMP_RISE_THRESHOLD) {
              hadRecentTempSpike = true;
              break;
            }
          }
        }
        
        // Determine occupancy status and reason
        let occupied = false;
        let reason = '';
        
        if (pressureDetected) {
          // If pressure is detected, determine if it's a person or object
          if (currentTemp >= ABS_TEMP_THRESHOLD || hadRecentTempSpike) {
            occupied = true;
            if (tempRise >= TEMP_RISE_THRESHOLD) {
              reason = `Person detected (temp +${tempRise.toFixed(1)}°C)`;
            } else if (hadRecentTempSpike) {
              reason = `Person detected (body heat at ${currentTemp.toFixed(1)}°C)`;
            } else {
              reason = `Person detected (warm: ${currentTemp.toFixed(1)}°C)`;
            }
          } else {
            occupied = true;
            reason = `Object detected (cool: ${currentTemp.toFixed(1)}°C, no body heat)`;
          }
        } else {
          occupied = false;
          reason = 'Seat available';
        }
        
        setSeatData({
          temperature: currentTemp,
          occupied: occupied,
          pressureDetected: pressureDetected,
          tempRise: tempRise,
          timestamp: new Date(latest.created_at)
        });
        setPreviousTemp(prevTemp);
        setOccupancyReason(reason);
        setLastUpdate(new Date());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading seat status...</div>
      </div>
    );
  }

  const isOccupied = seatData?.occupied;
  const temperature = seatData?.temperature;
  const tempRise = seatData?.tempRise;
  const pressureDetected = seatData?.pressureDetected;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-2xl">
          <h1 className="text-3xl font-bold">Train Seat Monitor</h1>
          <p className="text-green-100 mt-2">Real-time seat occupancy system</p>
        </div>

        {/* Main Status Card */}
        <div className="bg-white shadow-xl rounded-b-2xl p-8">
          {/* Seat Status */}
          <div className={`${isOccupied ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'} border-4 rounded-xl p-8 mb-6 transition-all duration-500`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Users size={48} className={isOccupied ? 'text-red-600' : 'text-green-600'} />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Seat Status
                  </h2>
                  <p className={`text-3xl font-bold mt-2 ${isOccupied ? 'text-red-600' : 'text-green-600'}`}>
                    {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{occupancyReason}</p>
                </div>
              </div>
              {/* Visual Seat Indicator */}
              <div className="relative">
                <div className={`w-24 h-32 rounded-2xl border-4 ${isOccupied ? 'bg-red-400 border-red-600' : 'bg-green-400 border-green-600'} transition-all duration-500`}>
                  <div className={`absolute top-2 left-2 right-2 h-28 rounded-xl ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Temperature & Pressure Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Temperature Display */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <Thermometer size={32} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Temperature</h3>
                  <p className="text-3xl font-bold text-blue-600">{temperature}°C</p>
                  {tempRise !== 0 && (
                    <p className={`text-sm mt-1 ${tempRise > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {tempRise > 0 ? '↑' : '↓'} {Math.abs(tempRise).toFixed(1)}°C
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pressure Detection */}
            <div className={`${pressureDetected ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'} border-2 rounded-xl p-6`}>
              <div className="flex items-center gap-3">
                <AlertCircle size={32} className={pressureDetected ? 'text-orange-600' : 'text-gray-400'} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Pressure</h3>
                  <p className={`text-2xl font-bold ${pressureDetected ? 'text-orange-600' : 'text-gray-400'}`}>
                    {pressureDetected ? 'DETECTED' : 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detection Logic Info */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-purple-900 mb-2">Detection Logic:</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li><strong>Person:</strong> Pressure + (Temp ≥{ABS_TEMP_THRESHOLD}°C OR recent spike ≥{TEMP_RISE_THRESHOLD}°C)</li>
              <li><strong>Object:</strong> Pressure + Cool temperature (no body heat)</li>
              <li><strong>Available:</strong> No pressure detected</li>
            </ul>
          </div>

          {/* Last Update */}
          <div className="flex items-center justify-between text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span>Last updated: {lastUpdate?.toLocaleTimeString('no-NO')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              <span className="text-green-600 font-semibold">Live</span>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Updates automatically every 5 seconds • Powered by ESP32 & ThingSpeak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}