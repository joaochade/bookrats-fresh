import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const memberships = await prisma.groupMembership.findMany({
      where: { userId },
      select: {
        groupId: true,
        joinedAt: true,
      },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user groups' },
      { status: 500 }
    );
  }
}