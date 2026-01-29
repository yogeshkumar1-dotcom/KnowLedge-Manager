import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PencilIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axiosInstance.get('/api/v1/tasks');
      setTasks(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, actionItemIndex, subtaskIndex, status, reason = '') => {
    try {
      const task = tasks.find(t => t._id === taskId);
      const actionItem = task.actionItems[actionItemIndex];
      
      await axiosInstance.put('/api/v1/tasks/update-status', {
        taskId,
        owner: actionItem.owner,
        actionItem: actionItem.taskTitle,
        subtaskIndex,
        status,
        reason
      });
      
      fetchTasks(); // Refresh tasks
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-gray-600">Manage your action items and track progress</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading an audio file to generate tasks.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {tasks.map((task) => (
            <div key={task._id} className="bg-white shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {task.transcriptTitle || 'Untitled Task'}
                  </h3>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.taskStatus)}`}>
                    {task.taskStatus}
                  </span>
                </div>

                {task.actionItems && task.actionItems.length > 0 ? (
                  <div className="space-y-4">
                    {task.actionItems.map((actionItem, actionIndex) => (
                      <div key={actionIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{actionItem.taskTitle}</h4>
                          <span className="text-sm text-gray-600">Owner: {actionItem.owner}</span>
                        </div>
                        
                        {actionItem.task && actionItem.task.length > 0 && (
                          <div className="space-y-2">
                            {actionItem.task.map((subtask, subtaskIndex) => (
                              <div key={subtaskIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(subtask.status)}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{subtask.taskName}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>Priority: {subtask.Priority}</span>
                                      <span>Due: {subtask.DueDate}</span>
                                    </div>
                                    {subtask.reason && (
                                      <p className="text-xs text-red-600 mt-1">Reason: {subtask.reason}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subtask.status)}`}>
                                    {subtask.status || 'pending'}
                                  </span>
                                  
                                  <select
                                    value={subtask.status || 'pending'}
                                    onChange={(e) => updateTaskStatus(task._id, actionIndex, subtaskIndex, e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No action items found for this task.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;