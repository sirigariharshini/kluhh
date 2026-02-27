import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Wind, AlertCircle, Cpu } from 'lucide-react';
import { localServices, ServiceStatus } from '../services/localServices';
import { supabaseService, HealthReading } from '../services/supabaseService';
import { apiClient } from '../services/apiClient';

interface DashboardProps {
  simulationMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ simulationMode = false }) => {

  const [history, setHistory] = useState<HealthReading[]>([]);
  const [backendStatus, setBackendStatus] = useState<ServiceStatus | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [lastAlert, setLastAlert] = useState<string>('');
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [dataChanged, setDataChanged] = useState(false);

  // Ask browser permission once
  useEffect(() => {
    Notification.requestPermission();
  }, []);

  // Load health status and Backend health data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Check Supabase connection
        const connected = await supabaseService.checkConnection();
        setSupabaseConnected(connected);

        // Try to fetch health metrics from backend API first
        let readings: any[] = [];
        try {
          const response = await apiClient.getHealthMetrics(50);
          if (response.data && Array.isArray(response.data)) {
            // Transform backend data to match HealthReading interface
            readings = response.data.map((metric: any) => ({
              bpm: Number(metric.heartRate || metric.bpm || 72),
              spo2: Number(metric.oxygen || metric.spo2 || 98),
              timestamp: metric.timestamp || metric.created_at || new Date().toISOString(),
              created_at: metric.created_at || new Date().toISOString()
            }));
            console.log('✅ Loaded', readings.length, 'health metrics from backend');
            console.log('📊 Latest BPM:', readings[readings.length - 1]?.bpm, 'SpO2:', readings[readings.length - 1]?.spo2);
          }
        } catch (error) {
          console.error('⚠️ Failed to fetch from backend:', error);
        }

        // If no backend data, try Supabase
        if (readings.length === 0 && connected) {
          const supabaseReadings = await supabaseService.fetchHealthReadings(50);
          if (supabaseReadings.length > 0) {
            readings = supabaseReadings;
            console.log('✅ Loaded', readings.length, 'health readings from Supabase');
          }
        }

        // If still no data, use mock data
        if (readings.length === 0) {
          console.log('⚠️ No health data found, using mock data');
          readings = [
            { bpm: 72, spo2: 98, timestamp: new Date(Date.now() - 3600000).toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() } as HealthReading,
            { bpm: 75, spo2: 97, timestamp: new Date(Date.now() - 1800000).toISOString(), created_at: new Date(Date.now() - 1800000).toISOString() } as HealthReading,
            { bpm: 78, spo2: 98, timestamp: new Date().toISOString(), created_at: new Date().toISOString() } as HealthReading
          ];
        }

        setHistory(readings);

        // Check backend health
        const { backend } = await localServices.checkHealth(simulationMode);
        setBackendStatus(backend);
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Load data immediately
    loadData();

    // Set up periodic refresh every 5 seconds
    const interval = setInterval(() => {
      console.log('🔄 Refreshing health data...');
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [simulationMode]);

  const latest = history[history.length - 1];

  // Log latest data for debugging
  useEffect(() => {
    if (latest) {
      console.log('📱 Latest Data Updated in Containers:', {
        heartRate: latest.bpm,
        oxygen: latest.spo2,
        timestamp: latest.timestamp
      });
    }
  }, [latest]);

  // 🚨 CRITICAL ALERT DETECTION
  useEffect(() => {
    if (!latest) return;

    const bpm = latest.bpm;
    const spo2 = latest.spo2;

    let message = '';

    if (bpm > 140) {
      message = `Critical Heart Rate Detected: ${bpm} bpm`;
    } else if (spo2 < 90) {
      message = `Critical Oxygen Level Detected: ${spo2}%`;
    }

    if (message && message !== lastAlert) {
      triggerAlert(message);
      setCriticalAlert(message);
      setLastAlert(message);
    }

  }, [latest, lastAlert]);

  const triggerAlert = (message: string) => {
    if (Notification.permission === "granted") {
      new Notification("🚨 Emergency Alert", {
        body: message,
      });
    }
  };

  const chartData = history.length > 0
    ? history.map(h => ({
      time: new Date(h.timestamp || h.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      heartRate: h.bpm
    }))
    : [
      { time: '08:00', heartRate: 72 },
      { time: '10:00', heartRate: 85 },
      { time: '12:00', heartRate: 78 },
      { time: '14:00', heartRate: 92 },
    ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* 🚨 Emergency Banner */}
      {criticalAlert && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl flex items-center gap-4 shadow-md animate-pulse">
          <AlertCircle size={28} className="text-red-600" />
          <div>
            <h3 className="text-red-800 font-black text-lg">CRITICAL CONDITION DETECTED</h3>
            <p className="text-red-600 font-medium text-sm">{criticalAlert}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Heart Rate',
            val: latest?.bpm ? String(Math.round(latest.bpm)) : '72',
            unit: 'bpm',
            icon: Activity,
            color: (latest?.bpm || 0) > 140 ? 'text-red-600' : 'text-rose-500',
            bg: (latest?.bpm || 0) > 140 ? 'bg-red-100' : 'bg-rose-50',
            trend: 'up'
          },
          {
            label: 'Oxygen Level',
            val: latest?.spo2 ? String(Math.round(latest.spo2)) : '98',
            unit: '%',
            icon: Wind,
            color: (latest?.spo2 || 0) < 90 ? 'text-red-600' : 'text-teal-500',
            bg: (latest?.spo2 || 0) < 90 ? 'bg-red-100' : 'bg-teal-50',
            trend: 'stable'
          },
          { label: 'Status', val: supabaseConnected ? '🟢 Connected' : '🔴 Offline', unit: '', icon: Cpu, color: supabaseConnected ? 'text-green-500' : 'text-red-500', bg: supabaseConnected ? 'bg-green-50' : 'bg-red-50', trend: 'stable' },
          { label: 'Readings', val: history.length, unit: 'total', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'up' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div className={`p-5 rounded-3xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={32} />
              </div>
            </div>
            <h3 className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">{stat.val}</span>
              {stat.unit && <span className="text-sm text-slate-400 font-bold uppercase">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="heartRate" stroke="#ef4444" fill="#fecaca" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};
export default Dashboard;