// app/api/reset-password-confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { token, password } = body;

    console.log('🔐 ======== RESET PASSWORD CONFIRM ========');
    console.log('📝 Token received:', token);

    if (!token || !password) {
      console.log('❌ Missing token or password');
      return NextResponse.json(
        { error: 'Token et mot de passe sont requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      console.log('❌ No user found with valid token');
      return NextResponse.json(
        { error: 'Ce lien de réinitialisation est invalide ou a expiré' },
        { status: 400 }
      );
    }

    console.log('✅ User found:', user.email);

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log('✅ Password updated successfully for:', user.email);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('❌ Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}