'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BookOpen, TrendingUp, Calendar, Users } from 'lucide-react';
import Link from 'next/link';

interface DailyRead {
  id: string;
  readAt: string;
  user: {
    name: string;
    username: string;
  };
  group: {
    id: string;
    name: string;
  };
}

interface Stats {
  totalGroups: number;
  daysReadThisMonth: number;
  currentStreak: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [recentActivity, setRecentActivity] = useState<DailyRead[]>([]);
  const [stats, setStats] = useState<Stats>({ totalGroups: 0, daysReadThisMonth: 0, currentStreak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData(userId);
  }, []);

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch user's groups
      const groupsResponse = await fetch(`/api/users/${userId}/groups`);
      if (!groupsResponse.ok) {
        throw new Error('Failed to fetch groups');
      }
      const groups = await groupsResponse.json();

      // Fetch recent activity from all user's groups
      const allActivity: DailyRead[] = [];
      for (const membership of groups) {
        try {
          const activityResponse = await fetch(`/api/groups/${membership.groupId}/daily-reads`);
          if (activityResponse.ok) {
            const groupActivity = await activityResponse.json();
            allActivity.push(...groupActivity);
          }
        } catch (err) {
          console.error(`Failed to fetch activity for group ${membership.groupId}:`, err);
        }
      }

      // Sort by most recent
      allActivity.sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime());
      setRecentActivity(allActivity.slice(0, 10));

      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const userEmail = localStorage.getItem('userEmail');
      const userCheckIns = allActivity.filter(a => a.user.username === userEmail?.split('@')[0]);
      const thisMonthCheckIns = userCheckIns.filter(a => new Date(a.readAt) >= monthStart);
      const uniqueDays = new Set(thisMonthCheckIns.map(c => new Date(c.readAt).toISOString().split('T')[0]));

      setStats({
        totalGroups: groups.length,
        daysReadThisMonth: uniqueDays.size,
        currentStreak: calculateStreak(userCheckIns),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (checkIns: DailyRead[]): number => {
    if (checkIns.length === 0) return 0;

    const dates = checkIns
      .map(c => new Date(c.readAt))
      .map(d => {
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);

    for (const date of dates) {
      if (date.getTime() === checkDate.getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (date.getTime() < checkDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your reading activity at a glance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-2xl font-bold">{stats.totalGroups}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="mx-auto mb-2 text-green-600" size={24} />
              <p className="text-2xl font-bold">{stats.daysReadThisMonth}</p>
              <p className="text-xs text-muted-foreground">Days</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="mx-auto mb-2 text-orange-600" size={24} />
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest check-ins from all your groups</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen size={48} className="mx-auto mb-2 opacity-20" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id}>
                    {index > 0 && <div className="border-t my-3" />}
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.user.name}</p>
                        <Link 
                          href={`/groups/${activity.group?.id || ''}`} 
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {activity.group?.name || 'Unknown Group'}
                        </Link>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          ✓ Read
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.readAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}