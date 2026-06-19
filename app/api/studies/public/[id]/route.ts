// app/api/studies/public/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Study from '@/models/Study';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    console.log('🔍 Fetching public study:', { id, token });

    // Validate ID
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      return NextResponse.json(
        { success: false, error: 'ID de l\'étude manquant ou invalide' },
        { status: 400 }
      );
    }

    // Validate token
    if (!token || token === 'undefined' || token === 'null' || token === '') {
      return NextResponse.json(
        { success: false, error: 'Token manquant ou invalide' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID de l\'étude invalide' },
        { status: 400 }
      );
    }

    // Find study by ID and public token
    const study = await Study.findOne({
      _id: new mongoose.Types.ObjectId(id),
      publicToken: token,
      publicTokenExpires: { $gt: new Date() }, // Check if token is not expired
    });

    if (!study) {
      return NextResponse.json(
        { success: false, error: 'Étude introuvable, token invalide ou lien expiré' },
        { status: 404 }
      );
    }

    console.log('✅ Public study found:', study._id);

    // Remove sensitive data before sending
    const studyData = study.toObject();
    delete studyData.pdfData; // Remove PDF buffer if stored
    delete studyData.publicToken; // Remove token for security

    return NextResponse.json({
      success: true,
      study: studyData,
    });

  } catch (error: any) {
    console.error('Error fetching public study:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors du chargement' },
      { status: 500 }
    );
  }
}