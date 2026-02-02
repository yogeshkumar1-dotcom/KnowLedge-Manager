import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import {
  ChartBarIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRecordings: 0,
    averageScore: 0,
    totalTime: 0,
    engagementRate: 0
  });
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/transcripts?limit=100');
        const transcripts = response.data.data?.transcripts || [];

        // Calculate stats
        const totalRecordings = transcripts.length;
        const totalScore = transcripts.reduce((acc, curr) => acc + (curr.analytics?.overallCommunicationScore || 0), 0);
        const averageScore = totalRecordings > 0 ? (totalScore / totalRecordings / 10).toFixed(1) : 0;

        // Mock usage data based on actual transcripts
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const count = transcripts.filter(t => new Date(t.createdAt).toISOString().split('T')[0] === dateStr).length;
          return { name: dateStr.split('-').slice(1).join('/'), usage: count || Math.floor(Math.random() * 5) }; // Random for demo if no data
        }).reverse();

        setUsageData(last7Days);
        setStats({
          totalRecordings,
          averageScore,
          totalTime: Math.floor(totalRecordings * 12.5), // Mock conversion
          engagementRate: 85 // Mock
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subValue, max }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          +12% ↑
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline mt-1">
          <p className="text-3xl font-black text-gray-900">{value}</p>
          {subValue && <span className="ml-2 text-sm font-medium text-gray-400">{subValue}</span>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Welcome Back!</h1>
          <p className="mt-1 text-lg text-gray-500 font-medium">Here's your communication performance overview.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Generate Report
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sessions"
          value={stats.totalRecordings}
          icon={VideoCameraIcon}
          color="bg-blue-600"
          subValue="Recordings"
        />
        <StatCard
          title="Avg Communication"
          value={stats.averageScore}
          icon={ChartBarIcon}
          color="bg-purple-600"
          subValue="/10"
        />
        <StatCard
          title="Total Practice"
          value={stats.totalTime}
          icon={ClockIcon}
          color="bg-emerald-600"
          subValue="Mins"
        />
        <StatCard
          title="Engagement"
          value={stats.engagementRate}
          icon={ArrowTrendingUpIcon}
          color="bg-orange-600"
          subValue="%"
        />
      </div>

      {/* Engagement Graph */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daily Engagement</h2>
            <p className="text-sm text-gray-500 font-medium">Usage activity over the last 7 days</p>
          </div>
          <select className="bg-gray-50 border-none text-sm font-bold text-gray-600 rounded-xl px-4 focus:ring-2 focus:ring-blue-500">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="usage"
                stroke="#3B82F6"
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorUsage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Visual Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
          <h3 className="text-2xl font-bold mb-2">Pro Tip: Use Pauses</h3>
          <p className="text-blue-100 mb-6">Controlled silences can make your speech more impactful and give you time to think.</p>
          <button className="bg-white/20 hover:bg-white/30 transition-colors px-6 py-2 rounded-xl font-bold text-sm backdrop-blur-md">Learn More</button>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to grow?</h3>
            <p className="text-gray-500 mb-6">Upload a new recording to see your latest communication metrics.</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">New Recording</button>
          </div>
          <div className="hidden lg:block">
            <SpeakerWaveIcon className="h-32 w-32 text-blue-50/50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;