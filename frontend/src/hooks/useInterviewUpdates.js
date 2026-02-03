import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';

export const useInterviewUpdates = (initialData = []) => {
  const [interviews, setInterviews] = useState(initialData);
  const [loading, setLoading] = useState(false);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/v1/interviews?limit=100');
      const data = response.data.data?.interviews || [];
      setInterviews(data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addInterview = useCallback((newInterview) => {
    setInterviews(prev => [newInterview, ...prev]);
  }, []);

  const updateInterview = useCallback((updatedInterview) => {
    setInterviews(prev => 
      prev.map(interview => 
        interview._id === updatedInterview._id ? updatedInterview : interview
      )
    );
  }, []);

  const triggerRefresh = useCallback(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInterviews();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchInterviews]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return {
    interviews,
    loading,
    addInterview,
    updateInterview,
    triggerRefresh,
    fetchInterviews
  };
};