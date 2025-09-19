import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UsageData {
  user: {
    id: string;
    email: string;
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
    monthlyUsage: number;
    maxUsage: number;
    remainingUsage: number;
    canMakeRequest: boolean;
  };
  recentUsage: Array<{
    id: string;
    endpoint: string;
    createdAt: string;
    tokens?: number;
    cost?: number;
  }>;
}

export function useUsage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchUsage();
    }
  }, [session]);

  return { usage, loading, error, refetch: fetchUsage };
}