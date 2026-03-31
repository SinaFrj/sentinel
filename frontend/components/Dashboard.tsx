"use client";

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Heart, Thermometer, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface Vitals {
  heart_rate: number;
  bp_sys: number;
  bp_dia: number;
  spo2: number;
  lactate: number;
  temp: number;
}

interface SystemState {
  timestamp: string;
  state: string;
  vitals: Vitals;
}

export default function Dashboard() {
  const [data, setData] = useState<SystemState | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isCritical, setIsCritical] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8000/status');
        const json = await res.json();
        setData(json);
        
        const newCritical = json.state === "CRITICAL";
        if (newCritical && !isCritical) {
            // Trigger flashing only on new critical state
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 5000);
        }
        setIsCritical(newCritical);
        
        setHistory(prev => {
          const newData = [...prev, { ...json.vitals, time: new Date().toLocaleTimeString() }];
          if (newData.length > 50) newData.shift();
          return newData;
        });
      } catch (e) {
        console.error("Connection Error", e);
      }
    }, 100); 
    return () => clearInterval(interval);
  }, [isCritical]);

  const triggerCrisis = async () => {
    await fetch('http://localhost:8000/simulate-crisis', { method: 'POST' });
  };

  const resetSystem = async () => {
    await fetch('http://localhost:8000/reset', { method: 'POST' });
    setIsCritical(false);
    setIsFlashing(false);
  };

  if (!data) return <div className="text-neon-green p-10">INITIALIZING SENTINEL UPLINK...</div>;

  const statusColor = isCritical ? "text-red-500" : "text-neon-green";
  const borderColor = isCritical ? "border-red-500" : "border-neon-green";
  const glowClass = isCritical ? "shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "shadow-[0_0_10px_rgba(34,197,94,0.3)]";

  return (
    <div className={`min-h-screen bg-black text-white p-6 font-mono transition-colors duration-500 ${isCritical ? 'bg-red-950/20' : ''}`}>
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <ShieldCheck className={`w-8 h-8 ${statusColor}`} />
          <h1 className="text-2xl font-bold tracking-widest">SENTINEL <span className="text-xs opacity-50">v1.0.4</span></h1>
        </div>
        <div className={`px-4 py-1 border ${borderColor} ${statusColor} ${glowClass} rounded text-sm font-bold animate-pulse`}>
          STATUS: {data.state}
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* VITALS PANEL */}
        <div className="md:col-span-2 space-y-6">
          <div className={`p-4 border border-gray-800 bg-gray-900/50 rounded-lg ${glowClass}`}>
            <h2 className="text-gray-400 text-sm mb-4 flex items-center gap-2"><Activity size={16}/> LIVE WAVEFORM</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="heart_rate" stroke={isCritical ? "#ef4444" : "#22c55e"} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="bp_sys" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <MetricCard label="HEART RATE" value={data.vitals.heart_rate} unit="BPM" icon={<Heart size={16}/>} isCritical={data.vitals.heart_rate > 110} />
            <MetricCard label="LACTATE" value={data.vitals.lactate} unit="mmol/L" icon={<Zap size={16}/>} isCritical={data.vitals.lactate > 2.0} />
            <MetricCard label="TEMP" value={data.vitals.temp} unit="°C" icon={<Thermometer size={16}/>} isCritical={data.vitals.temp > 38} />
          </div>
        </div>

        {/* CONTROLS & LOGS */}
        <div className="space-y-6">
          <div className={`p-6 border ${borderColor} rounded-lg bg-black/80 flex flex-col gap-4`}>
            <h3 className="text-lg font-bold">INTERVENTION</h3>
            <button 
              onClick={triggerCrisis}
              className="w-full py-4 bg-red-900/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all font-bold tracking-wider flex items-center justify-center gap-2"
            >
              <AlertTriangle /> SIMULATE CRISIS
            </button>
            
            {isCritical && (
               <button 
               onClick={resetSystem}
               className="w-full py-2 bg-blue-900/20 border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-sm"
             >
               RESET SYSTEM
             </button>
            )}
          </div>

          <div className="p-4 border border-gray-800 rounded-lg h-64 overflow-y-auto font-mono text-xs text-gray-400 bg-black">
            <div className="mb-2 text-gray-500 border-b border-gray-800 pb-1">SYSTEM LOGS</div>
            {isCritical ? (
              <>
                <div className="text-red-500">[CRITICAL] SEPTIC SHOCK DETECTED</div>
                <div className="text-yellow-500">[WARN] BP DROPPING RAPIDLY</div>
                <div className="text-blue-400">[INFO] FLUID RESUSCITATION RECOMMENDED</div>
              </>
            ) : (
              <>
                <div className="text-green-500">[OK] SYSTEM NOMINAL</div>
                <div className="text-gray-600">[DEBUG] Agent Heartbeat...</div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* ALERT MODAL */}
      {isCritical && (
        <div className={`fixed inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none z-50 ${isFlashing ? 'animate-pulse' : ''}`}>
          <div className={`bg-black border-2 border-red-500 p-8 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.5)] text-center ${isFlashing ? 'animate-bounce' : ''}`}>
            <h1 className="text-4xl font-black text-red-500 mb-2">CRITICAL ALERT</h1>
            <p className="text-xl text-white">PATIENT UNSTABLE</p>
            <p className="text-sm text-red-400 mt-4">IMMEDIATE INTERVENTION REQUIRED</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, icon, isCritical }: any) {
  return (
    <div className={`p-4 border rounded-lg transition-colors duration-300 ${isCritical ? 'border-red-500 bg-red-600 text-white' : 'border-green-500 bg-green-900/30 text-white'}`}>
      <div className={`flex justify-between items-center mb-2 ${isCritical ? 'text-white' : 'text-green-400'}`}>
        <span className="text-xs">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">
        {value} <span className={`text-xs ${isCritical ? 'text-white/80' : 'text-green-400/80'}`}>{unit}</span>
      </div>
    </div>
  );
}
