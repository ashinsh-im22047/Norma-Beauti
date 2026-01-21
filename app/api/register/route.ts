import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Remove 'username' from here. We only need email and password.
    const { email, password } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    // 2. Create User (No username)
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken: token
      },
    });

    // 3. Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const verificationLink = `http://localhost:3000/verify?token=${token}`;

    await transporter.sendMail({
      from: '"Norma Beauti" <no-reply@normabeauti.com>',
      to: email,
      subject: 'Verify your Norma Beauti Account',
      html: `
        <h2>Welcome!</h2>
        <p>Please click below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
      `
    });

    return NextResponse.json({ message: 'Verification email sent' });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
  }
}