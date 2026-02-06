import { createContext, useContext } from 'react';
import { useInterviewUpdates } from '../hooks/useInterviewUpdates';

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const interviewData = useInterviewUpdates();

  return (
    <InterviewContext.Provider value={interviewData}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};