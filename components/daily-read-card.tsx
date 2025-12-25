import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface DailyReadCardProps {
  dailyRead: {
    id: string;
    imageUrl: string;
    caption: string | null;
    pagesRead: number | null;
    readAt: string;
    user: {
      id: string;
      name: string;
      username: string;
    };
  };
}

export function DailyReadCard({ dailyRead }: DailyReadCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(dailyRead.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold">{dailyRead.user.name}</p>
            <p className="text-sm text-muted-foreground">@{dailyRead.user.username}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(dailyRead.readAt)}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={dailyRead.imageUrl}
            alt={dailyRead.caption || 'Daily read'}
            fill
            className="object-cover"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex-col items-start gap-2">
        {dailyRead.caption && (
          <p className="text-sm">{dailyRead.caption}</p>
        )}
        {dailyRead.pagesRead && (
          <Badge variant="secondary">
            {dailyRead.pagesRead} pages read
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}