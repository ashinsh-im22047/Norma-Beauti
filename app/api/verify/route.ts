import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, 
      },
    });

    // --- CHANGE THIS PART ---
    // We MUST return the 'email' here so the frontend can use it
    return NextResponse.json({ 
        message: 'Verified successfully', 
        email: user.email // <--- THIS WAS MISSING
    });
    // -----------------------

  } catch (error) {
    return NextResponse.json({ error: 'Error verifying' }, { status: 500 });
  }
}