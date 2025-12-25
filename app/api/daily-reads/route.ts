import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/daily-reads - Get all daily reads (optionally filtered by group)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const userId = searchParams.get('userId');
    const month = searchParams.get('month'); // YYYY-MM format

    const where: any = {};
    if (groupId) where.groupId = groupId;
    if (userId) where.userId = userId;
    
    // Filter by month if provided
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      where.readAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const dailyReads = await prisma.dailyRead.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        readAt: 'desc',
      },
    });

    return NextResponse.json(dailyReads);
  } catch (error) {
    console.error('Error fetching daily reads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily reads' },
      { status: 500 }
    );
  }
}

// POST /api/daily-reads - Create a new daily read (simple check-in)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, groupId } = body;

    // Validation
    if (!userId || !groupId) {
      return NextResponse.json(
        { error: 'userId and groupId are required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the group
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'User must be a member of the group to check in' },
        { status: 403 }
      );
    }

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await prisma.dailyRead.findFirst({
      where: {
        userId,
        groupId,
        readAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingCheckIn) {
      return NextResponse.json(
        { error: 'Already checked in today!', dailyRead: existingCheckIn },
        { status: 409 }
      );
    }

    // Create the check-in
    const dailyRead = await prisma.dailyRead.create({
      data: {
        userId,
        groupId,
        imageUrl: '', // Empty for now, not used
        caption: null,
        pagesRead: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(dailyRead, { status: 201 });
  } catch (error) {
    console.error('Error creating daily read:', error);
    return NextResponse.json(
      { error: 'Failed to create daily read' },
      { status: 500 }
    );
  }
}