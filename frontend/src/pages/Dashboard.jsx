import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { 
  ClipboardDocumentListIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalTranscripts: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentTranscripts, setRecentTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, transcriptsRes] = await Promise.all([
          axiosInstance.get('/api/v1/tasks'),
          axiosInstance.get('/api/v1/transcripts?limit=5')
        ]);

        const tasks = tasksRes.data.data || [];
        const transcripts = transcriptsRes.data.data?.transcripts || [];

        // Calculate stats
        const completedTasks = tasks.filter(task => task.taskStatus === 'completed').length;
        const pendingTasks = tasks.filter(task => task.taskStatus === 'pending').length;

        setStats({
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks,
          totalTranscripts: transcripts.length
        });

        setRecentTasks(tasks.slice(0, 5));
        setRecentTranscripts(transcripts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your knowledge management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={ClipboardDocumentListIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={CheckCircleIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon={ClockIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Transcripts"
          value={stats.totalTranscripts}
          icon={DocumentTextIcon}
          color="bg-purple-500"
        />
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="p-6">
            {recentTasks.length > 0 ? (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{task.transcriptTitle}</p>
                      <p className="text-sm text-gray-600">{task.actionItems?.length || 0} action items</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.taskStatus === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.taskStatus}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks found</p>
            )}
          </div>
        </div>

        {/* Recent Transcripts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transcripts</h2>
          </div>
          <div className="p-6">
            {recentTranscripts.length > 0 ? (
              <div className="space-y-4">
                {recentTranscripts.map((transcript) => (
                  <div key={transcript._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{transcript.fileName}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transcript.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transcript.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {transcript.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No transcripts found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;