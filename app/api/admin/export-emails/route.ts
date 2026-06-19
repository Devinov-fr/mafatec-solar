
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Study from '@/models/Study';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    await connectDB();

    const users = await User.find({ 
      role: { $ne: 'admin' } 
    }).select('email prenom nom type entreprise activated');

    const studies = await Study.find({});
    
    const studyCountMap = studies.reduce((acc, study) => {
      const email = study.userEmail;
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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