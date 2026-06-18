import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ActivationToken from '@/models/ActivationToken';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    await dbConnect();

    const activationToken = await ActivationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!activationToken) {
      return NextResponse.json({ success: false, error: 'Token invalid or expired' }, { status: 404 });
    }

    return NextResponse.json({ success: true, email: activationToken.userEmail });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params;
    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    await dbConnect();

    const activationToken = await ActivationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!activationToken) {
      return NextResponse.json({ success: false, error: 'Token invalid or expired' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.updateOne(
      { email: activationToken.userEmail },
      {
        passwordHash,
        activated: true,
        activatedAt: new Date(),
      }
    );

    await ActivationToken.updateOne({ token }, { usedAt: new Date() });

    return NextResponse.json({ success: true, message: 'Account activated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
