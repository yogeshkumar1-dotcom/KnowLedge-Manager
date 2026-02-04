import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../contexts/InterviewContext';
import {
  VideoCameraIcon,
  EyeIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const navigate = useNavigate();
  const { interviews, loading } = useInterview();
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRecordings, setSelectedRecordings] = useState([]);

  useEffect(() => {
    filterAndSortRecordings();
  }, [interviews, searchTerm, statusFilter, sortBy, sortOrder]);

  const filterAndSortRecordings = () => {
    let filtered = interviews.filter(recording => {
      const candidateName = recording.candidateName || '';
      const position = recording.position || '';
      const matchesSearch = candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || recording.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = (a.candidateName || '').toLowerCase();
          bValue = (b.candidateName || '').toLowerCase();
          break;
        case 'score':
          aValue = a.overall_communication_score || 0;
          bValue = b.overall_communication_score || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRecordings(filtered);
  };

  const handleSelectRecording = (recordingId) => {
    setSelectedRecordings(prev => 
      prev.includes(recordingId) 
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecordings.length === filteredRecordings.length) {
      setSelectedRecordings([]);
    } else {
      setSelectedRecordings(filteredRecordings.map(r => r._id));
    }
  };

  const downloadReport = () => {
    const selectedData = filteredRecordings.filter(r => selectedRecordings.includes(r._id));
    
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Interview Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .score-high { color: #16a34a; font-weight: bold; }
        .score-medium { color: #ca8a04; font-weight: bold; }
        .score-low { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <h1>Interview Analysis Report</h1>
    <table>
        <thead>
            <tr>
                <th>Candidate Name</th>
                <th>Fluency Score</th>
                <th>Confidence Score</th>
                <th>Clarity Score</th>
                <th>Overall Score</th>
            </tr>
        </thead>
        <tbody>`;
    
    selectedData.forEach(interview => {
      const fluencyScore = interview.language_quality?.fluency_score || 'N/A';
      const confidenceScore = interview.communication_skills?.confidence_score || 'N/A';
      const clarityScore = interview.language_quality?.clarity_score || 'N/A';
      const overallScore = interview.overall_communication_score || 'N/A';
      
      const getScoreClass = (score) => {
        if (score === 'N/A') return '';
        return score >= 8 ? 'score-high' : score >= 5 ? 'score-medium' : 'score-low';
      };
      
      htmlContent += `
            <tr>
                <td>${interview.candidateName || 'Unknown'}</td>
                <td class="${getScoreClass(fluencyScore)}">${fluencyScore}</td>
                <td class="${getScoreClass(confidenceScore)}">${confidenceScore}</td>
                <td class="${getScoreClass(clarityScore)}">${clarityScore}</td>
                <td class="${getScoreClass(overallScore)}">${overallScore}</td>
            </tr>`;
    });
    
    htmlContent += `
        </tbody>
    </table>
    <div class="footer">
        <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Records:</strong> ${selectedData.length}</p>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen -mt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Interview Dashboard</h1>
          <p className="mt-1 text-lg text-gray-500 font-medium">Manage and analyze candidate interviews ({interviews.length} total)</p>
        </div>
        <div className="flex gap-3">
          {selectedRecordings.length > 0 && (
            <button 
              onClick={downloadReport}
              className="px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download ({selectedRecordings.length})
            </button>
          )}
          <button 
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
          >
            Analyze New Interview
          </button>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="score">Sort by Score</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Interviews List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Candidate Interviews</h2>
              <p className="text-sm text-gray-500 mt-1">Showing {filteredRecordings.length} of {interviews.length} interviews</p>
            </div>
            {filteredRecordings.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {selectedRecordings.length === filteredRecordings.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredRecordings.length > 0 ? filteredRecordings.map((recording) => (
            <div 
              key={recording._id}
              className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedRecordings.includes(recording._id)}
                    onChange={() => handleSelectRecording(recording._id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div 
                    className="bg-blue-100 p-3 rounded-lg cursor-pointer"
                    onClick={() => navigate(`/interview/${recording._id}`)}
                  >
                    <VideoCameraIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div onClick={() => navigate(`/interview/${recording._id}`)}>
                    <h3 className="text-lg font-bold text-gray-900">{recording.candidateName || 'Unknown Candidate'}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{recording.position || 'Unknown Position'}</span>
                      <span className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {recording.createdAt ? new Date(recording.createdAt).toLocaleDateString() : 'Unknown Date'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {recording.overall_communication_score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{recording.overall_communication_score}</div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  )}
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    recording.status === 'scored' ? 'bg-green-100 text-green-700' :
                    recording.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {recording.status}
                  </div>
                  
                  <button 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/interview/${recording._id}`);
                    }}
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center">
              <VideoCameraIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters, or analyze a new interview.</p>
              <button 
                onClick={() => navigate('/upload')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Analyze New Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
                 