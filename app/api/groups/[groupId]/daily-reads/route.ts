import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    const dailyReads = await prisma.dailyRead.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        group: {  // ✅ Make sure group is included
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
    console.error('Error fetching group daily reads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily reads' },
      { status: 500 }
    );
  }
}