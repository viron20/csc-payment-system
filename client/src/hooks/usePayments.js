import { useState, useEffect, useCallback } from 'react';
import { getPayments } from '../services/api';

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getPayments();
      setPayments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const paid = payments.filter(p => p.status === 'paid');
  const unpaid = payments.filter(p => p.status === 'not_paid');
  const pendingReview = unpaid.filter(p => p.receipt);
  const progressPct = payments.length ? Math.round((paid.length / payments.length) * 100) : 0;

  return {
    payments,
    loading,
    error,
    refetch: fetch,
    paid,
    unpaid,
    pendingReview,
    progressPct,
  };
}
