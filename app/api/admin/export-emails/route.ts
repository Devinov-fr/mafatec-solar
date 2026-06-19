// app/api/admin/export-emails/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Study from '@/models/Study';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is admin
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all users (excluding admin accounts)
    const users = await User.find({ 
      role: { $ne: 'admin' } 
    }).select('email prenom nom type entreprise activated');

    // Get all studies to count per user
    const studies = await Study.find({});
    
    // Create a map of email -> study count
    const studyCountMap = studies.reduce((acc, study) => {
      const email = study.userEmail;
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Combine user data with study counts
    const usersWithStudyCounts = users.map(user => ({
      email: user.email,
      prenom: user.prenom || '',
      nom: user.nom || '',
      type: user.type || 'part',
      entreprise: user.entreprise || '',
      activated: user.activated || false,
      studyCount: studyCountMap[user.email] || 0
    }));

    return NextResponse.json({
      success: true,
      users: usersWithStudyCounts,
      total: usersWithStudyCounts.length
    });

  } catch (error) {
    console.error('Erreur lors de l\'export des emails:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}