'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReadingCalendarProps {
  checkIns: Array<{
    id: string;
    readAt: string;
  }>;
  year?: number;
  month?: number;
}

export function ReadingCalendar({ checkIns, year, month }: ReadingCalendarProps) {
  const now = new Date();
  const currentYear = year || now.getFullYear();
  const currentMonth = month !== undefined ? month : now.getMonth();

  // Get calendar data
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Create set of check-in dates for quick lookup
  const checkInDates = new Set(
    checkIns.map(c => new Date(c.readAt).toISOString().split('T')[0])
  );

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days in month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split('T')[0];
    const hasCheckIn = checkInDates.has(dateString);
    const isToday = dateString === new Date().toISOString().split('T')[0];
    const isFuture = date > now;
    
    calendarDays.push({
      day,
      hasCheckIn,
      isToday,
      isFuture,
      dateString,
    });
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate stats
  const uniqueDays = new Set(checkIns.map(c => new Date(c.readAt).toISOString().split('T')[0]));
  const daysRead = uniqueDays.size;
  const currentStreak = calculateStreak(checkIns);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{monthName}</CardTitle>
            <CardDescription>Your reading activity</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{daysRead} days</Badge>
            {currentStreak > 0 && (
              <Badge variant="default">🔥 {currentStreak} streak</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted border" />
            <span>No read</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Read</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm ring-2 ring-primary" />
            <span>Today</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground pb-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((dayData, index) => {
            if (!dayData) {
              return <div key={`empty-${index}`} />;
            }

            return (
              <div
                key={dayData.dateString}
                className={`
                  aspect-square rounded-sm flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${dayData.isFuture 
                    ? 'bg-muted/50 text-muted-foreground/30 cursor-not-allowed' 
                    : dayData.hasCheckIn 
                      ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' 
                      : 'bg-muted hover:bg-muted/80 cursor-pointer'
                  }
                  ${dayData.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
                title={dayData.isFuture 
                  ? 'Future date' 
                  : dayData.hasCheckIn 
                    ? `Read on ${dayData.dateString}` 
                    : `No reading on ${dayData.dateString}`
                }
              >
                {dayData.day}
              </div>
            );
          })}
        </div>

        {/* Summary */}

        <div className="mt-6 pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Days read:</span>
            <span className="font-semibold">{daysRead} / {daysInMonth}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion:</span>
            <span className="font-semibold">
              {Math.round((daysRead / daysInMonth) * 100)}%
            </span>
          </div>
          {currentStreak > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current streak:</span>
              <span className="font-semibold text-orange-600">
                🔥 {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function calculateStreak(checkIns: Array<{ readAt: string }>): number {
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
}