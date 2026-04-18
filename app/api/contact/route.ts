import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // 1. Basic validation
    if (!name || !email || !subject || !message) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // 2. Configure Email Sender using your existing env variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    // 3. Send Email TO the owner
    await transporter.sendMail({
      from: '"Norma Beauti System" <no-reply@normabeauti.com>', // System email
      to: 'normabeauti123@gmail.com', // The Owner's email
      replyTo: email, // This allows the owner to hit "Reply" and email the customer directly!
      subject: `New Contact Request: ${subject}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #f8bbd0; border-radius: 10px; background-color: #fff0f5;">
          <h2 style="color: #880e4f; text-align: center; border-bottom: 2px solid #f8bbd0; padding-bottom: 10px;">New Message from a Customer</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin-bottom: 10px;"><strong>Name:</strong> ${name}</p>
              <p style="margin-bottom: 10px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #e91e63;">${email}</a></p>
              <p style="margin-bottom: 10px;"><strong>Subject:</strong> ${subject}</p>
          </div>

          <div style="background-color: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
              <h4 style="color: #880e4f; margin-top: 0;">Message:</h4>
              <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
            This email was sent from your Norma Beauti Contact Form. You can reply directly to this email to respond to ${name}.
          </p>
        </div>
      `
    });

    return NextResponse.json({ message: 'Message sent successfully' });

  } catch (error: any) {
    console.error("CONTACT EMAIL ERROR:", error);
    return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
  }
}