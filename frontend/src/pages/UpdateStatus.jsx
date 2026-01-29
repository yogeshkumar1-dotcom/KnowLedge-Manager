import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default function UpdateStatus() {
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) return console.error("No token provided");

  const data = jwtDecode(token);
  const { taskId, owner, actionItem, subtaskIndex } = data;

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await axios.get(`/api/v1/tasks/${taskId}`);
        const taskData = res.data.data;
        const ai = taskData.actionItems.find(
          (a) => a.owner === owner && a.taskTitle === actionItem
        );
        const subtask = ai?.task[subtaskIndex];
        console.log(subtask);
        setTask(subtask);
        setLoading(false);
      } catch (err) {
        setMessage("❌ Failed to load task data");
        setLoading(false);
      }
    };
    fetchTask();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMessage("");
      let res = await axios.put("/api/v1/tasks/update-status", {
        taskId,
        owner,
        actionItem,
        subtaskIndex,
        status,
        reason,
      });
      console.log("res - ", res.data);
      setMessage("✅ Task status updated successfully!");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update task status");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  if (!task)
    return (
      <div className="p-6 text-center text-red-500">Task not found or invalid link.</div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Update Task Status
        </h2>
        <div className="mb-4 text-sm text-gray-600">
          <p><strong>Task:</strong> {task.taskName}</p>
          <p><strong>Priority:</strong> {task.Priority}</p>
          <p><strong>Due Date:</strong> {task.DueDate}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring focus:ring-blue-200"
          >
            <option value="">Select Status</option>
            <option value="Completed">✅ Completed</option>
            <option value="In Progress">🔄 In Progress</option>
            <option value="Pending">⏳ Pending</option>
          </select>

          {status === "Pending" || status === "Blocked" ? (
            <>
              <label className="block text-sm font-medium mb-2">
                Reason (if delayed)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why the task is delayed..."
                rows={3}
                className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring focus:ring-blue-200"
              />
            </>
          ) : null}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Submit Update
          </button>
        </form>

        {message && <p className="mt-4 text-center text-gray-700">{message}</p>}
      </div>
    </div>
  );
}