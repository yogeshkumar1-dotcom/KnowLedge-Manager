# Knowledge Manager - Separate Frontend & Backend Setup

## Running the Application

### Backend (API Server)
```bash
# From root directory
npm run dev
# Server runs on http://localhost:3000
```

### Frontend (React App)
```bash
# From frontend directory
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## API Structure

The frontend now has a dedicated API folder structure:

- `src/api/index.js` - Main API configuration with axios
- `src/api/auth.js` - Authentication API calls
- `src/api/tasks.js` - Task management API calls
- `src/api/transcription.js` - Audio/transcription API calls
- `src/api/grazitti.js` - Grazitti user API calls

## Environment Variables

Frontend `.env` file:
```
VITE_API_URL=http://localhost:3000/api/v1
```

## Usage Example

```javascript
import { authAPI } from '../api/auth.js';
import { taskAPI } from '../api/tasks.js';

// Login
const response = await authAPI.login({ email, password });

// Get tasks
const tasks = await taskAPI.getTasks();
```