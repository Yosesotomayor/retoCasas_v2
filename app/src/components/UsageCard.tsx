'use client';

import { useUsage } from '../hooks/useUsage';

interface UsageCardProps {
  externalUsage?: {
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
  } | null;
}

export default function UsageCard({ externalUsage }: UsageCardProps) {
  const { usage: hookUsage, loading, error } = useUsage();

  // Use external usage if provided, otherwise use hook usage
  const usage = externalUsage || hookUsage;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const { user } = usage;
  const percentage = (user.monthlyUsage / user.maxUsage) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-900 text-sm">API Usage</h3>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          user.tier === 'free'
            ? 'bg-gray-100 text-gray-800'
            : user.tier === 'pro'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-purple-100 text-purple-800'
        }`}>
          {user.tier.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
        <span>{user.monthlyUsage} / {user.maxUsage} consultas</span>
        <span className="font-medium">{user.remainingUsage} restantes</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            !user.canMakeRequest
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {!user.canMakeRequest && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <a
            href="/subscription"
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            🚀 Actualizar plan para continuar →
          </a>
        </div>
      )}

      {user.tier === 'free' && user.canMakeRequest && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <a
            href="/subscription"
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            ¿Necesitas más consultas? Ver planes →
          </a>
        </div>
      )}
    </div>
  );
}