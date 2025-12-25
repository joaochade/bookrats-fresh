'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, BookCheck, Calendar as CalendarIcon, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Member {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    createdAt: string;
  };
}

interface LeaderboardEntry {
  user: {
    id: string;
    name: string;
    username: string;
  };
  daysRead: number;
  currentStreak: number;
  lastCheckIn: string | null;
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const userId = localStorage.getItem('userId');

      // Fetch group details
      const groupResponse = await fetch(`/api/groups`);
      const groups = await groupResponse.json();
      const currentGroup = groups.find((g: Group) => g.id === groupId);
      setGroup(currentGroup);

      // Fetch members
      const membersResponse = await fetch(`/api/groups/${groupId}/members`);
      const membersData = await membersResponse.json();
      setMembers(membersData);

      // Fetch leaderboard
      const leaderboardResponse = await fetch(`/api/groups/${groupId}/leaderboard`);
      const leaderboardData = await leaderboardResponse.json();
      setLeaderboard(leaderboardData);

      // Check if current user is a member
      if (userId) {
        const isUserMember = membersData.some((m: Member) => m.user.id === userId);
        setIsMember(isUserMember);

        // Check if user checked in today
        if (isUserMember) {
          const today = new Date().toISOString().split('T')[0];
          const checkInResponse = await fetch(
            `/api/daily-reads?userId=${userId}&groupId=${groupId}`
          );
          const checkIns = await checkInResponse.json();
          const todayCheckIn = checkIns.some((c: any) => 
            c.readAt.startsWith(today)
          );
          setHasCheckedInToday(todayCheckIn);
        }
      }
    } catch (error) {
      console.error('Failed to fetch group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/auth/signup');
      return;
    }

    setJoining(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        await fetchGroupData();
      }
    } catch (error) {
      console.error('Failed to join group:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleCheckIn = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    router.push('/auth/signup');
    return;
  }

  setCheckingIn(true);
  try {
    const response = await fetch('/api/daily-reads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, groupId }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success('Check-in successful! 📚');
      setHasCheckedInToday(true);
      await fetchGroupData();
    } else if (response.status === 409) {
      toast.info('Already checked in today!');
      setHasCheckedInToday(true);
    } else {
      toast.error(data.error || 'Failed to check in');
    }
  } catch (error) {
    console.error('Failed to check in:', error);
    toast.error('Something went wrong. Please try again.');
  } finally {
    setCheckingIn(false);
  }
};

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/groups">
            <Button variant="ghost" size="icon" className="mb-4 text-primary-foreground hover:bg-primary-foreground/20">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-primary-foreground/80">{group.description}</p>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary">
                {members.length} {members.length === 1 ? 'reader' : 'readers'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6 -mt-4">
        {/* Check-in Button */}
        {!isMember ? (
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleJoinGroup} 
                disabled={joining}
                className="w-full"
                size="lg"
              >
                <UserPlus size={20} className="mr-2" />
                {joining ? 'Joining...' : 'Join Group'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleCheckIn} 
                disabled={checkingIn || hasCheckedInToday}
                className="w-full"
                size="lg"
                variant={hasCheckedInToday ? "outline" : "default"}
              >
                <BookCheck size={20} className="mr-2" />
                {hasCheckedInToday 
                  ? '✅ Already checked in today!' 
                  : checkingIn 
                    ? 'Checking in...' 
                    : 'I Read Today! 📖'
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leaderboard">
              <Trophy size={16} className="mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="members">
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{currentMonth}</CardTitle>
                <CardDescription>Days read this month</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No check-ins yet this month!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.user.id}>
                        {index > 0 && <Separator className="my-3" />}
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold w-8">
                            {getRankEmoji(index)}
                          </div>
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(entry.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{entry.user.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{entry.daysRead} days</span>
                              {entry.currentStreak > 0 && (
                                <span className="flex items-center gap-1">
                                  🔥 {entry.currentStreak} day streak
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={entry.daysRead > 0 ? "default" : "outline"}>
                              {entry.daysRead}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? 'person is' : 'people are'} reading together
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={member.id}>
                      {index > 0 && <Separator className="my-3" />}
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">@{member.user.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}