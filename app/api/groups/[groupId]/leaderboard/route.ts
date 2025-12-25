import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // YYYY-MM format, defaults to current month

    // Get current month if not provided
    const now = new Date();
    const [year, monthNum] = month 
      ? month.split('-').map(Number)
      : [now.getFullYear(), now.getMonth() + 1];

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    // Get all members
    const members = await prisma.groupMembership.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    // Get check-ins for this month
    const checkIns = await prisma.dailyRead.findMany({
      where: {
        groupId,
        readAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        userId: true,
        readAt: true,
      },
    });

    // Calculate stats for each member
    const leaderboard = members.map(member => {
      const userCheckIns = checkIns.filter(c => c.userId === member.user.id);
      const daysRead = userCheckIns.length;
      
      // Calculate current streak
      let currentStreak = 0;
      const sortedDates = userCheckIns
        .map(c => new Date(c.readAt))
        .sort((a, b) => b.getTime() - a.getTime());

      if (sortedDates.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let checkDate = new Date(today);
        
        for (const date of sortedDates) {
          const readDate = new Date(date);
          readDate.setHours(0, 0, 0, 0);
          
          if (readDate.getTime() === checkDate.getTime()) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      return {
        user: member.user,
        daysRead,
        currentStreak,
        lastCheckIn: sortedDates[0] || null,
      };
    });

    // Sort by days read (descending)
    leaderboard.sort((a, b) => b.daysRead - a.daysRead);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}