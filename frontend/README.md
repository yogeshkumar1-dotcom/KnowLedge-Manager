# Knowledge Manager Frontend

A professional React frontend for the Knowledge Manager application that handles audio transcription, task management, and team collaboration.

## Features

- **Dashboard**: Overview of tasks, transcripts, and system statistics
- **Audio Upload**: Drag-and-drop interface for uploading audio files
- **Transcription Management**: View and manage audio transcripts with AI-generated summaries
- **Task Management**: Track action items extracted from meetings with status updates
- **Email Integration**: Maintains compatibility with existing email-based status updates
- **Google OAuth**: Secure authentication integration
- **Responsive Design**: Modern, mobile-friendly interface

## Technology Stack

- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **Axios** - HTTP client for API calls
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## API Integration

The frontend connects to the Knowledge Manager backend API running on `http://10.49.33.16:5656/api/v1/`

### Main API Endpoints Used:

- `GET /tasks` - Fetch all tasks
- `PUT /tasks/update-status` - Update task status
- `GET /transcripts` - Fetch transcripts with pagination
- `GET /transcripts/:id` - Get specific transcript details
- `POST /upload/file` - Upload audio files
- `GET /auth/google` - Google OAuth authentication

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with navigation
│   └── ProtectedRoute.jsx # Route protection
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── Tasks.jsx       # Task management
│   ├── Transcripts.jsx # Transcript viewing
│   ├── Upload.jsx      # File upload
│   ├── Login.jsx       # Authentication
│   └── UpdateStatus.jsx # Email status updates (preserved)
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Key Features

### Email Status Updates (Preserved)
The existing email-based status update functionality is preserved at `/update-status` route, maintaining backward compatibility with the current email workflow.

### Authentication
Google OAuth integration provides secure user authentication. The app redirects unauthenticated users to the login page.

### File Upload
Supports drag-and-drop file uploads with progress tracking. Accepts MP3, WAV, OGG, and M4A audio formats.

### Task Management
- View all tasks with action items
- Update task status in real-time
- Track progress with visual indicators
- Filter and sort capabilities

### Responsive Design
Built with Tailwind CSS for a modern, responsive interface that works on desktop and mobile devices.

## Environment Configuration

Update the API base URL in the components if your backend runs on a different address:

```javascript
// Change this URL in all API calls
const API_BASE_URL = 'http://10.49.33.16:5656/api/v1';
```

## Contributing

1. Follow the existing code structure and naming conventions
2. Use Tailwind CSS for styling
3. Ensure components are responsive
4. Add proper error handling for API calls
5. Test on both desktop and mobile devices