import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Study from '@/models/Study';
import ActivationToken from '@/models/ActivationToken';
import { sendEmail, getActivationEmailHtml, getStudyReadyEmailHtml } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { prenom, nom, email, entreprise, type, universe, studyData } = body;
    const userType = type || universe || 'part';

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // 1. Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        email: email.toLowerCase(),
        prenom,
        nom,
        entreprise,
        type: userType,
        activated: false,
      });
    }

    // 2. Create Study
    const study = await Study.create({
      userEmail: user.email,
      puissance: studyData.puissance,
      adresse: studyData.adresse,
      lat: studyData.lat,
      lng: studyData.lng,
      params: studyData.params || {
        inclinaison: studyData.inclinaison,
        azimut: studyData.azimut,
        pertes: studyData.systemLosses,
        panels: studyData.panels,
        obstacles: studyData.obstacles,
        voltageDropResult: studyData.voltageDropResult,
        calepinageImage: studyData.calepinageImage,
      },
      results: studyData.results || {
        production: studyData.production,
        irradiation: studyData.irradiation,
        variabilite: studyData.variabilite,
        l_aoi: studyData.l_aoi,
        l_spec: studyData.l_spec,
        l_tg: studyData.l_tg,
        l_total: studyData.l_total,
        monthly: studyData.monthly,
        data: studyData.data, // Full PVGIS object
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let activationToken = null;

    if (isNewUser || !user.activated) {
      // 3. Handle activation for new or non-activated users
      const token = crypto.randomBytes(32).toString('hex');
      activationToken = token;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      // Invalidate old tokens for this user
      await ActivationToken.updateMany({ userEmail: user.email }, { usedAt: new Date() });

      await ActivationToken.create({
        token,
        userEmail: user.email,
        expiresAt,
      });

      const activationUrl = `${appUrl}/activate?token=${token}&email=${encodeURIComponent(user.email)}`;
      
      await sendEmail({
        to: user.email,
        subject: 'Votre étude MAFATEC est prête - Activez votre compte',
        html: getActivationEmailHtml(user.prenom, activationUrl, study),
      });
    } else {
      // 4. Existing activated user
      const loginUrl = `${appUrl}/login`;
      await sendEmail({
        to: user.email,
        subject: 'Votre nouvelle étude MAFATEC est prête',
        html: getStudyReadyEmailHtml(user.prenom, loginUrl, study),
      });
    }

    return NextResponse.json({
      success: true,
      isNew: isNewUser,
      studyId: study._id,
      activationToken, // Returned for the 'simulation d'email' box in UI
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in /api/studies:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
