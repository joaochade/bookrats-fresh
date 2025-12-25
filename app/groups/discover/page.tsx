'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users as UsersIcon, UserPlus, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    memberships: number;
  };
}

export default function DiscoverGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
  setLoading(true);
  try {
    const userId = localStorage.getItem('userId');
    
    // Fetch all groups
    const response = await fetch('/api/groups');
    if (!response.ok) {
      throw new Error('Failed to fetch groups');
    }
    const data = await response.json();
    setGroups(data);
    
    // Get user's groups
    if (userId) {
      const userResponse = await fetch(`/api/users/${userId}/groups`);
      if (userResponse.ok) {
        const userGroups = await userResponse.json();
        // Fix: explicitly type the map result
        const groupIds = new Set<string>(userGroups.map((g: any) => g.groupId as string));
        console.log('User is member of:', Array.from(groupIds));
        setMyGroupIds(groupIds);
      }
    }
  } catch (error) {
    console.error('Failed to fetch groups:', error);
    toast.error('Failed to load groups');
  } finally {
    setLoading(false);
  }
};

  const handleJoinGroup = async (groupId: string) => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    router.push('/auth/login');
    return;
  }

  setJoiningId(groupId);
  try {
    const response = await fetch(`/api/groups/${groupId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success('Joined group successfully! 🎉');
      // Update local state immediately - proper typing
      setMyGroupIds(prev => new Set([...Array.from(prev), groupId]));
      // Also refresh to get accurate member count
      await fetchGroups();
    } else if (response.status === 409) {
      toast.info('You are already a member of this group');
      // Update local state to reflect membership - proper typing
      setMyGroupIds(prev => new Set([...Array.from(prev), groupId]));
    } else {
      toast.error(data.error || 'Failed to join group');
    }
  } catch (error) {
    console.error('Failed to join group:', error);
    toast.error('Something went wrong. Please try again.');
  } finally {
    setJoiningId(null);
  }
};

  const handleGoToGroup = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading groups...</p>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold">Discover Groups</h1>
            <p className="text-primary-foreground/80">Find reading groups to join</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-4 -mt-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No groups available yet. Create the first one!
              </p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => {
            const isMember = myGroupIds.has(group.id);
            console.log(`Group ${group.name} (${group.id}): isMember =`, isMember);
            
            return (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle>{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="mt-1">{group.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <UsersIcon size={14} />
                          {group._count.memberships} {group._count.memberships === 1 ? 'member' : 'members'}
                        </Badge>
                        {isMember && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Check size={14} />
                            Member
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isMember ? (
                      <Button
                        onClick={() => handleGoToGroup(group.id)}
                        variant="outline"
                        size="sm"
                      >
                        View Group
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={joiningId === group.id}
                        size="sm"
                      >
                        <UserPlus size={16} className="mr-2" />
                        {joiningId === group.id ? 'Joining...' : 'Join'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}