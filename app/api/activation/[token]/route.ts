// app/api/activation/[token]/route.ts
import { NextResponse } from 'next/server';
import ActivationToken from '@/models/ActivationToken';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';

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
      return NextResponse.json({ 
        success: false, 
        error: 'Le mot de passe doit contenir au moins 8 caractères' 
      }, { status: 400 });
    }

    await dbConnect();

    const activationToken = await ActivationToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
      usedAt: { $exists: false },
    });

    if (!activationToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token invalide ou expiré' 
      }, { status: 404 });
    }

    // Find the user
    const user = await User.findOne({ email: activationToken.userEmail });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Use helper methods to update user
    user.setPassword(passwordHash);
    user.activateAccount(); // This sets activated: true, activatedAt: now, and clears activation token
    await user.save();

    // Mark the activation token as used
    await ActivationToken.updateOne({ token }, { usedAt: new Date() });

    return NextResponse.json({ 
      success: true, 
      message: 'Compte activé avec succès' 
    });
  } catch (error: any) {
    console.error('Activation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Une erreur est survenue lors de l\'activation' 
    }, { status: 500 });
  }
}