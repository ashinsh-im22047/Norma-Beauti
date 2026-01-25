import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log("1. Starting registration for:", email); // Debug Log

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("User already exists"); // Debug Log
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    // Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken: token
      },
    });
    console.log("2. User created in DB with ID:", newUser.id); // Debug Log

    // Configure Email Sender
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Check these in your .env file
        pass: process.env.EMAIL_PASS 
      }
    });

    const verificationLink = `http://localhost:3000/verify?token=${token}`;

    console.log("3. Attempting to send email..."); // Debug Log

    // Send Email
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

    console.log("4. Email sent successfully!"); // Debug Log

    return NextResponse.json({ message: 'Verification email sent' });

  } catch (error: any) {
    console.error("REGISTRATION ERROR:", error); // <--- LOOK HERE IN TERMINAL
    return NextResponse.json({ error: error.message || 'Error creating user' }, { status: 500 });
  }
}