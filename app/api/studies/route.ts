import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Study from '@/models/Study';
import ActivationToken from '@/models/ActivationToken';
import { sendEmail, getActivationEmailHtml, getStudyReadyEmailHtml } from '@/lib/email';
import crypto from 'crypto';
import React from 'react';
import path from 'path';
import { promises as fs } from 'fs';

async function generateStudyPDFBuffer(studyData: any) {
  console.log('[PDF] ========== STARTING PDF GENERATION ==========');
  console.log('[PDF] studyData keys:', Object.keys(studyData || {}));
  console.log('[PDF] studyData.puissance:', studyData?.puissance);
  console.log('[PDF] studyData.data exists?', !!studyData?.data);
  console.log('[PDF] studyData.results exists?', !!studyData?.results);
  
  try {
    // Import @react-pdf/renderer dynamically
    console.log('[PDF] Importing @react-pdf/renderer...');
    const { pdf } = await import('@react-pdf/renderer');
    console.log('[PDF] @react-pdf/renderer imported OK');

    // Import the PDF component
    console.log('[PDF] Importing PrintComponentPDF...');
    const { PrintComponentPDF } = await import('@/components/ui/PrintComponentPDF');
    console.log('[PDF] PrintComponentPDF imported OK');

    // Determine the correct logo path - use a public URL instead of file path
    const logoUrl = '/logo-mafatec-2048x423.png';
    console.log('[PDF] Using logo URL:', logoUrl);

    // Prepare monthly data
    const monthlyData = studyData.monthly || studyData.results?.monthly || [];
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Get the data for the PDF
    const pdfData = studyData.data || studyData.results?.data || studyData;

    // Create props for the PDF component
    const pdfProps = {
      data: pdfData,
      monthNames: monthNames,
      azimut: studyData.azimut || studyData.params?.azimut || '0',
      inclinaison: studyData.inclinaison || studyData.params?.inclinaison || '35',
      clickedPosition: {
        lat: studyData.lat || studyData.latitude || 0,
        lng: studyData.lng || studyData.longitude || 0,
        address: studyData.adresse || studyData.address || 'Adresse non définie',
      },
      puissancePv: studyData.puissance || '0',
      systemLosses: studyData.systemLosses || studyData.params?.pertes || '14',
      voltageDropResult: studyData.voltageDropResult || studyData.params?.voltageDropResult || null,
      panels: studyData.panels || studyData.params?.panels || [],
      logoUrl: logoUrl,
    };

    console.log('[PDF] PDF Props prepared:', {
      puissancePv: pdfProps.puissancePv,
      azimut: pdfProps.azimut,
      inclinaison: pdfProps.inclinaison,
      address: pdfProps.clickedPosition.address,
      panelsCount: pdfProps.panels?.length || 0,
    });

    console.log('[PDF] Creating React element...');
    
    // Create the React element
    const element = React.createElement(PrintComponentPDF, pdfProps);

    console.log('[PDF] Generating PDF stream...');
    
    // Generate the PDF
    const pdfStream = pdf(element);
    console.log('[PDF] pdf() stream created OK');
    
    const buffer = await pdfStream.toBuffer();
    console.log(`[PDF] ✅ Buffer generated successfully, size: ${buffer?.length || 0} bytes`);
    console.log('[PDF] ========== PDF GENERATION COMPLETE ==========');
    
    return buffer;
  } catch (pdfError: any) {
    console.error('[PDF] ❌ Error generating PDF:');
    console.error('[PDF] Error message:', pdfError?.message);
    console.error('[PDF] Error stack:', pdfError?.stack);
    console.error('[PDF] ========== PDF GENERATION FAILED ==========');
    
    // Try a fallback - return null
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { prenom, nom, email, entreprise, type, universe, studyData } = body;
    const userType = type || universe || 'part';

    console.log('📝 ========== STARTING STUDY PROCESS ==========');
    console.log('📝 Email:', email);
    console.log('📝 studyData keys:', Object.keys(studyData || {}));
    console.log('📝 studyData.puissance:', studyData?.puissance);
    console.log('📝 studyData.data exists?', !!studyData?.data);

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
      console.log('✅ User created:', user.email);
    } else {
      console.log('✅ User exists:', user.email);
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
    console.log('✅ Study created:', study._id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let activationToken = null;

    // --- Generate PDF ---
    let pdfBuffer = null;
    let pdfGenerated = false;

    try {
      console.log('📄 Attempting to generate PDF...');
      
      // Prepare data for PDF generation
      const pdfData = {
        data: studyData.data || studyData,
        adresse: studyData.adresse,
        lat: studyData.lat,
        lng: studyData.lng,
        puissance: studyData.puissance,
        inclinaison: studyData.inclinaison || studyData.params?.inclinaison || '35',
        azimut: studyData.azimut || studyData.params?.azimut || '0',
        systemLosses: studyData.systemLosses || studyData.params?.pertes || '14',
        voltageDropResult: studyData.voltageDropResult || studyData.params?.voltageDropResult || null,
        panels: studyData.panels || studyData.params?.panels || [],
        monthly: studyData.monthly || studyData.results?.monthly || [],
        production: studyData.production || studyData.results?.production || 0,
        irradiation: studyData.irradiation || studyData.results?.irradiation || 0,
        variabilite: studyData.variabilite || studyData.results?.variabilite || 0,
        params: studyData.params || {},
        results: studyData.results || {},
      };

      console.log('📄 PDF Data prepared:', {
        puissance: pdfData.puissance,
        adresse: pdfData.adresse,
        production: pdfData.production,
        monthlyCount: pdfData.monthly?.length || 0,
        panelsCount: pdfData.panels?.length || 0,
      });

      pdfBuffer = await generateStudyPDFBuffer(pdfData);
      
      if (pdfBuffer && pdfBuffer.length > 0) {
        pdfGenerated = true;
        console.log(`✅ PDF generated successfully for ${email}, size: ${pdfBuffer.length} bytes`);
      } else {
        console.log(`⚠️ PDF buffer is empty or null for ${email}`);
      }
    } catch (pdfError) {
      console.error('❌ Error generating PDF:', pdfError);
      // Continue without PDF attachment
    }

    // --- Send email ---
    let emailHtml = '';
    let subject = '';
    const attachments = [];

    // Add PDF as attachment if generated
    if (pdfGenerated && pdfBuffer && pdfBuffer.length > 0) {
      attachments.push({
        filename: `etude-mafatec-${studyData.puissance || 'PV'}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
      console.log(`📎 PDF attachment added to email (${pdfBuffer.length} bytes)`);
    } else {
      console.log('⚠️ No PDF attachment to add');
    }

    const studyForEmail = {
      puissance: studyData.puissance,
      adresse: studyData.adresse || 'Adresse non définie',
      production: studyData.production || 0,
      irradiation: studyData.irradiation || 0,
      variabilite: studyData.variabilite || 0,
    };

    if (isNewUser || !user.activated) {
      // Handle activation for new or non-activated users
      const token = crypto.randomBytes(32).toString('hex');
      activationToken = token;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);

      // Invalidate old tokens for this user
      await ActivationToken.updateMany(
        { userEmail: user.email, usedAt: null },
        { usedAt: new Date() }
      );

      await ActivationToken.create({
        token,
        userEmail: user.email,
        expiresAt,
      });

      const activationUrl = `${appUrl}/activate?token=${token}&email=${encodeURIComponent(user.email)}`;
      emailHtml = getActivationEmailHtml(user.prenom, activationUrl, studyForEmail);
      subject = 'Votre étude MAFATEC est prête - Activez votre compte';
    } else {
      // Existing activated user
      const loginUrl = `${appUrl}/login`;
      emailHtml = getStudyReadyEmailHtml(user.prenom, loginUrl, studyForEmail);
      subject = 'Votre nouvelle étude MAFATEC est prête';
    }

    console.log(`📧 Sending email to: ${email}`);
    console.log(`📎 Attachments count: ${attachments.length}`);
    if (attachments.length > 0) {
      console.log(`📄 Attachment: ${attachments[0].filename} (${attachments[0].content.length} bytes)`);
    }

    // Send email
    const emailResult = await sendEmail({
      to: email,
      subject,
      html: emailHtml,
      attachments,
    });

    if (!emailResult) {
      console.error('❌ Email sending failed for:', email);
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`✅ Email sent successfully to ${email} with PDF: ${pdfGenerated}`);
    console.log('📝 ========== STUDY PROCESS COMPLETE ==========');

    return NextResponse.json({
      success: true,
      isNew: isNewUser,
      studyId: study._id,
      activationToken,
      pdfAttached: pdfGenerated,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error in /api/studies:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}