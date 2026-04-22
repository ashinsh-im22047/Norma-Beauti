// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    // 1. Find user with this token AND ensure token hasn't expired
    const user = await prisma.user.findFirst({
      where: { 
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Expiry must be greater than NOW
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update User & Clear Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,       // Remove token so it can't be used again
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (error) {
    return NextResponse.json({ error: 'Error resetting password' }, { status: 500 });
  }
}