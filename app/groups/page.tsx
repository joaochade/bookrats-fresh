'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Users as UsersIcon, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateGroupDialog } from '@/components/create-group-dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: {
    memberships: number;
  };
}

export default function GroupsPage() {
  const router = useRouter();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/auth/login');
      return;
    }
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }

      const groupsResponse = await fetch('/api/groups');
      if (!groupsResponse.ok) {
        throw new Error(`Failed to fetch groups: ${groupsResponse.status}`);
      }
      const allGroups = await groupsResponse.json();

      const userResponse = await fetch(`/api/users/${userId}/groups`);
      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user groups: ${userResponse.status}`);
      }
      const memberships = await userResponse.json();

      const myGroupIds = new Set(memberships.map((m: any) => m.groupId));
      const userGroups = allGroups.filter((g: Group) => myGroupIds.has(g.id));
      
      setMyGroups(userGroups);
    } catch (error) {
      console.error('Error in fetchMyGroups:', error);
      toast.error('Failed to load your groups');
    } finally {
      setLoading(false);
    }
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
      {/* Hero Header */}
      <div className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground p-8 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 p-3 rounded-xl backdrop-blur">
                <BookOpen size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">My Groups</h1>
                <p className="text-primary-foreground/80">
                  {myGroups.length} {myGroups.length === 1 ? 'reading community' : 'reading communities'}
                </p>
              </div>
            </div>
            <CreateGroupDialog onGroupCreated={fetchMyGroups} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-8">
        {/* Groups List */}
        {myGroups.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <UsersIcon size={40} className="text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create your first reading group or discover existing communities to start tracking your reading journey together
                </p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <CreateGroupDialog onGroupCreated={fetchMyGroups}>
                  <Button size="lg" className="min-w-40">
                    <Plus size={20} className="mr-2" />
                    Create Group
                  </Button>
                </CreateGroupDialog>
                <Button variant="outline" size="lg" className="min-w-40" asChild>
                  <Link href="/groups/discover">
                    <Search size={20} className="mr-2" />
                    Discover Groups
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myGroups.map((group) => (
              <div key={group.id}>
                <Link href={`/groups/${group.id}`}>
                  <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer group">
                    <CardHeader className="pb-5">  {/* Add more padding */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-primary transition-colors text-lg">
                            {group.name}
                          </CardTitle>
                          {group.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                              {group.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
                          <UsersIcon size={14} />
                          {group._count.memberships}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <CreateGroupDialog onGroupCreated={fetchMyGroups}>
                <Button variant="outline" className="w-full">
                  <Plus size={18} className="mr-2" />
                  Create New
                </Button>
              </CreateGroupDialog>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/groups/discover">
                  <Search size={18} className="mr-2" />
                  Discover More
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}