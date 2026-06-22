
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('🔍 ======== VERIFY TOKEN ========');
    console.log('📝 Token from URL:', token);

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ 
        valid: false, 
        error: 'Token manquant' 
      }, { status: 400 });
    }

    // Find user with this token
    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user) {
      console.log('❌ No user found with token:', token);
      return NextResponse.json({ 
        valid: false, 
        error: 'Token invalide' 
      }, { status: 200 });
    }

    console.log('✅ User found with token:', user.email);

    // Check if token is expired
    if (user.resetPasswordExpires) {
      const expires = new Date(user.resetPasswordExpires);
      const now = new Date();
      
      if (expires < now) {
        console.log('❌ Token expired for user:', user.email);
        return NextResponse.json({ 
          valid: false, 
          error: 'Token expiré' 
        }, { status: 200 });
      }
    }

    console.log('✅ Token is valid for user:', user.email);
    return NextResponse.json({ 
      valid: true, 
      email: user.email 
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Erreur serveur' 
    }, { status: 500 });
  }
}