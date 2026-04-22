// ==========================================
// File: route.ts
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 1. Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security best practice: Don't reveal if user exists or not
      return NextResponse.json({ message: 'If that email exists, we sent a link.' });
    }

    // 2. Generate Reset Token (Expires in 1 hour)
    const token = uuidv4();
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    // 3. Save token to database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      }
    });

    // 4. Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: '"Norma Beauti" <no-reply@normabeauti.com>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #134B5F;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to set a new one:</p>
          <a href="${resetLink}" style="background-color: #134B5F; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        </div>
      `
    });

    return NextResponse.json({ message: 'Email sent' });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
  }
}