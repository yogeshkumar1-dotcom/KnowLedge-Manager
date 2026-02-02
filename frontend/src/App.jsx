import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import CommunicationDashboard from './pages/CommunicationDashboard';
import Transcripts from './pages/Transcripts';
import Upload from './pages/Upload';
import UpdateStatus from './pages/UpdateStatus';
import Login from './pages/Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-status" element={<UpdateStatus />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<CommunicationDashboard />} />
            <Route path="dashboard" element={<CommunicationDashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="transcripts" element={<Transcripts />} />
            <Route path="recent-activities" element={<Transcripts />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;