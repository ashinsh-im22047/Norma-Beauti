import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, fullName, address, phoneNumber, dob, gender } = await request.json();

    // 1. Find the User ID based on the email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Create the Customer Profile linked to that User
    await prisma.customer.create({
      data: {
        userId: user.id,
        fullName: fullName,
        address: address,
        phoneNumber: phoneNumber,
        dob: dob ? new Date(dob) : null, // Convert string to Date
        gender: gender,
      },
    });

    return NextResponse.json({ message: 'Profile created successfully' });

  } catch (error) {
    console.error("Profile Error:", error);
    return NextResponse.json({ error: 'Error creating profile' }, { status: 500 });
  }
}