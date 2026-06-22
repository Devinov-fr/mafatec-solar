
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import User from '@/models/User';
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email';
import dbConnect from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email } = body;

    console.log('🔐 Password reset requested for:', email);

    if (!email) {
      return NextResponse.json(
        { error: 'L\'adresse email est requise' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json(
        { success: true, message: 'Si un compte existe avec cette adresse, un email de réinitialisation a été envoyé.' },
        { status: 200 }
      );
    }

    console.log('✅ User found:', user.email, 'Activated:', user.activated);

    if (!user.activated) {
      console.log('⚠️ User not activated:', email);
      return NextResponse.json(
        { error: 'Ce compte n\'est pas encore activé. Veuillez vérifier vos emails.' },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = nanoid(32);
    const resetTokenExpires = new Date(Date.now() + 3600000);

    console.log('🔑 Generated token:', resetToken);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    console.log('💾 Token saved to user:', user.email);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    console.log('🔗 Reset URL:', resetUrl);

    const emailHtml = getPasswordResetEmailHtml(user.prenom || 'Utilisateur', resetUrl);
    
    const emailSent = await sendEmail({
      to: email,
      subject: 'MAFATEC - Réinitialisation de votre mot de passe',
      html: emailHtml,
    });

    if (!emailSent) {
      console.error('❌ Failed to send email to:', email);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Un email de réinitialisation a été envoyé à votre adresse.'
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}