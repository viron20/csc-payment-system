import { useState, useCallback } from 'react';
import { adminGetStudents, adminFilterStudents, adminGetStats } from '../services/api';

export function useAdminStudents() {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminGetStats();
      setStats(data);
    } catch {}
  }, []);

  const fetchStudents = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      );
      const hasFilters = Object.keys(params).length > 0;
      const { data } = hasFilters
        ? await adminFilterStudents(params)
        : await adminGetStudents();
      setStudents(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  return { students, stats, loading, error, fetchStudents, fetchStats };
}
