'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReadingCalendar } from '@/components/reading-calendar';
import { User, BookOpen, Calendar, LogOut } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
}

interface DailyRead {
  id: string;
  readAt: string;
  groupId: string;
  group: {
    name: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkIns, setCheckIns] = useState<DailyRead[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    if (!userId) {
      router.push('/auth/login');
      return;
    }

    setUserData({
      id: userId,
      name: userName || 'User',
      username: userEmail?.split('@')[0] || 'user',
      email: userEmail || '',
    });

    fetchUserData(userId);
  }, [selectedMonth, selectedYear]);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch check-ins for calendar
      const monthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const checkInsResponse = await fetch(`/api/daily-reads?userId=${userId}&month=${monthStr}`);
      const checkInsData = await checkInsResponse.json();
      setCheckIns(checkInsData);

      // Fetch user's groups count
      const groupsResponse = await fetch(`/api/users/${userId}/groups`);
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setTotalGroups(groupsData.length);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    if (selectedYear === now.getFullYear() && selectedMonth === now.getMonth()) {
      return;
    }
    
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const isCurrentMonth = selectedYear === new Date().getFullYear() && 
                        selectedMonth === new Date().getMonth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  // Calculate total days read (unique dates)
  const uniqueDates = new Set(
    checkIns.map(c => new Date(c.readAt).toISOString().split('T')[0])
  );
  const totalDaysRead = uniqueDates.size;

  return (
    <div className="min-h-screen pb-24 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{userData.name}</h1>
                <p className="text-muted-foreground">@{userData.username}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">
                    <BookOpen size={14} className="mr-1" />
                    {totalDaysRead} days read
                  </Badge>
                  <Badge variant="outline">
                    {totalGroups} {totalGroups === 1 ? 'group' : 'groups'}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
          >
            ← Previous
          </Button>
          <h2 className="font-semibold">
            {new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
          >
            Next →
          </Button>
        </div>

        {/* Calendar */}
        <ReadingCalendar 
          checkIns={checkIns} 
          year={selectedYear}
          month={selectedMonth}
        />

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Your latest reading activity</CardDescription>
          </CardHeader>
          <CardContent>
            {checkIns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar size={48} className="mx-auto mb-2 opacity-20" />
                <p>No check-ins this month yet!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkIns.slice(0, 5).map((checkIn, index) => (
                  <div key={checkIn.id}>
                    {index > 0 && <div className="border-t my-2" />}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{checkIn.group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(checkIn.readAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary">✓ Read</Badge>
                    </div>
                  </div>
                ))}
                {checkIns.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {checkIns.length - 5} more this month
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}