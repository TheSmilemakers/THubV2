'use client';

import { useEffect, useState } from 'react';
import { GlassCard, Skeleton } from '@/components/ui';
import { TrendingUp, TrendingDown, Activity, BarChart3, Clock, Target, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  totalSignals: number;
  successRate: number;
  activeSignals: number;
  averageScore: number;
  signalsByTimeframe: {
    '1h': number;
    '4h': number;
    '1d': number;
  };
  topPerformers: Array<{
    symbol: string;
    performance: number;
    signals: number;
  }>;
  recentActivity: Array<{
    id: string;
    symbol: string;
    action: 'buy' | 'sell';
    score: number;
    timestamp: string;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/signals/analytics');
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalyticsPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Analytics</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Use default data if analytics is null
  const data = analytics || {
    totalSignals: 0,
    successRate: 0,
    activeSignals: 0,
    averageScore: 0,
    signalsByTimeframe: { '1h': 0, '4h': 0, '1d': 0 },
    topPerformers: [],
    recentActivity: []
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your signal performance and trading insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricGlassCard
          title="Total Signals"
          value={data.totalSignals.toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
          trend={data.totalSignals > 0 ? 'up' : 'neutral'}
        />
        <MetricGlassCard
          title="Success Rate"
          value={`${data.successRate.toFixed(1)}%`}
          icon={<Target className="h-4 w-4" />}
          trend={data.successRate >= 70 ? 'up' : data.successRate >= 50 ? 'neutral' : 'down'}
          trendValue={`${data.successRate >= 70 ? '+' : ''}${(data.successRate - 60).toFixed(1)}%`}
        />
        <MetricGlassCard
          title="Active Signals"
          value={data.activeSignals.toLocaleString()}
          icon={<Zap className="h-4 w-4" />}
          trend="neutral"
        />
        <MetricGlassCard
          title="Average Score"
          value={data.averageScore.toFixed(1)}
          icon={<BarChart3 className="h-4 w-4" />}
          trend={data.averageScore >= 75 ? 'up' : data.averageScore >= 60 ? 'neutral' : 'down'}
        />
      </div>

      {/* Signals by Timeframe */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold mb-4">Signals by Timeframe</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(data.signalsByTimeframe).map(([timeframe, count]) => (
            <div key={timeframe} className="text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground uppercase">{timeframe}</div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
          <div className="space-y-3">
            {data.topPerformers.length > 0 ? (
              data.topPerformers.map((performer, index) => (
                <div key={performer.symbol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">#{index + 1}</div>
                    <div>
                      <div className="font-medium">{performer.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {performer.signals} signals
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    performer.performance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {performer.performance >= 0 ? '+' : ''}{performer.performance.toFixed(2)}%
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No data available yet
              </div>
            )}
          </div>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      activity.action === 'buy' 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      {activity.action === 'buy' ? 'B' : 'S'}
                    </div>
                    <div>
                      <div className="font-medium">{activity.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        Score: {activity.score}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No recent activity
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

interface MetricGlassCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function MetricGlassCard({ title, value, icon, trend = 'neutral', trendValue }: MetricGlassCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {trendValue && (
          <div className="flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
            <span className={cn(
              "text-xs",
              trend === 'up' && "text-green-600",
              trend === 'down' && "text-red-600",
              trend === 'neutral' && "text-muted-foreground"
            )}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <GlassCard key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}