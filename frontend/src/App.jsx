import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InterviewProvider } from './contexts/InterviewContext';
import Dashboard from './pages/Dashboard';
import Transcripts from './pages/Transcripts';
import Upload from './pages/Upload';
import UpdateStatus from './pages/UpdateStatus';
import Login from './pages/Login';
import InterviewDetails from './pages/InterviewDetails';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <InterviewProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/update-status" element={<UpdateStatus />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="upload" element={<Upload />} />
              <Route path="transcripts" element={<Transcripts />} />
              <Route path="recent-activities" element={<Transcripts />} />
              <Route path="interview/:id" element={<InterviewDetails />} />
            </Route>
          </Routes>
        </Router>
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;