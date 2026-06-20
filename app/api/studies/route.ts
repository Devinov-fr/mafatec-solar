//@ts-nocheck
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Study from '@/models/Study';
import ActivationToken from '@/models/ActivationToken';
import { sendEmail, getActivationEmailHtml, getStudyReadyEmailHtml } from '@/lib/email';
import crypto from 'crypto';
import React from 'react';

async function generateStudyPDFBuffer(studyData: any) {
  console.log('[PDF] ========== STARTING PDF GENERATION ==========');
  console.log('[PDF] studyData keys:', Object.keys(studyData || {}));
  console.log('[PDF] studyData.puissance:', studyData?.puissance);
  console.log('[PDF] studyData.data exists?', !!studyData?.data);
  console.log('[PDF] studyData.results exists?', !!studyData?.results);
  
  try {
    console.log('[PDF] Importing @react-pdf/renderer...');
    const { pdf } = await import('@react-pdf/renderer');
    console.log('[PDF] @react-pdf/renderer imported OK');

    console.log('[PDF] Importing PrintComponentPDF...');
    const { PrintComponentPDF } = await import('@/components/ui/PrintComponentPDF');
    console.log('[PDF] PrintComponentPDF imported OK');

    const logoUrl = '/logo-mafatec-2048x423.png';
    console.log('[PDF] Using logo URL:', logoUrl);

    const monthlyData = studyData.monthly || studyData.results?.monthly || [];
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const pdfData = studyData.data || studyData.results?.data || studyData;

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
    const element = React.createElement(PrintComponentPDF, pdfProps);

    console.log('[PDF] Generating PDF stream...');
    const pdfStream = pdf(element);
    console.log('[PDF] pdf() stream created OK');
    
    let buffer: Buffer | null = null;
    
    if (typeof pdfStream.toBuffer === 'function') {
      console.log('[PDF] Using toBuffer() method...');
      buffer = await pdfStream.toBuffer();
    } else if (typeof pdfStream.toBlob === 'function') {
      console.log('[PDF] Using toBlob() method...');
      const blob = await pdfStream.toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (typeof pdfStream.toArrayBuffer === 'function') {
      console.log('[PDF] Using toArrayBuffer() method...');
      const arrayBuffer = await pdfStream.toArrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (pdfStream && typeof pdfStream.pipe === 'function') {
      console.log('[PDF] Using stream reading method...');
      const chunks = [];
      for await (const chunk of pdfStream) {
        chunks.push(chunk);
      }
      buffer = Buffer.concat(chunks);
    } else if (Buffer.isBuffer(pdfStream)) {
      console.log('[PDF] pdfStream is already a buffer');
      buffer = pdfStream;
    } else if (typeof pdfStream === 'string') {
      console.log('[PDF] Converting string to buffer...');
      buffer = Buffer.from(pdfStream, 'utf-8');
    } else {
      console.log('[PDF] Trying alternative approach with pdf().toBuffer()...');
      try {
        const { pdf: pdfAlt } = await import('@react-pdf/renderer');
        const altStream = pdfAlt(element);
        if (typeof altStream.toBuffer === 'function') {
          buffer = await altStream.toBuffer();
        } else {
          throw new Error('No valid method to extract buffer found');
        }
      } catch (altError) {
        console.error('[PDF] Alternative approach failed:', altError);
        throw new Error('Could not generate PDF buffer');
      }
    }
    
    if (!buffer || buffer.length === 0) {
      console.error('[PDF] Generated buffer is empty or null');
      return null;
    }
    
    console.log(`[PDF] ✅ Buffer generated successfully, size: ${buffer.length} bytes`);
    console.log('[PDF] ========== PDF GENERATION COMPLETE ==========');
    
    return buffer;
  } catch (pdfError: any) {
    console.error('[PDF] ❌ Error generating PDF:');
    console.error('[PDF] Error message:', pdfError?.message);
    console.error('[PDF] Error stack:', pdfError?.stack);
    console.error('[PDF] ========== PDF GENERATION FAILED ==========');
    return null;
  }
}

export async function POST(req: Request) {
  try {
    console.log('🔵 ========== API /api/studies POST STARTED ==========');
    
    await dbConnect();
    const body = await req.json();
    console.log('🔵 Received body keys:', Object.keys(body || {}));
    
    const { prenom, nom, email, entreprise, type, universe, studyData } = body;
    const userType = type || universe || 'part';

    console.log('📝 ========== STARTING STUDY PROCESS ==========');
    console.log('📝 Email:', email);
    console.log('📝 studyData keys:', Object.keys(studyData || {}));
    console.log('📝 studyData.puissance:', studyData?.puissance);
    console.log('📝 studyData.params exists?', !!studyData?.params);
    console.log('📝 studyData.params keys:', Object.keys(studyData?.params || {}));
    console.log('📝 studyData.results exists?', !!studyData?.results);
    console.log('📝 studyData.results keys:', Object.keys(studyData?.results || {}));
    console.log('📝 studyData.results.monthly length:', studyData?.results?.monthly?.length || 0);
    console.log('📝 studyData.params.panels length:', studyData?.params?.panels?.length || 0);
    
    // LOG THE ENTIRE studyData to see what's coming in
    console.log('📝 Full studyData:', JSON.stringify(studyData, null, 2));

    if (!email) {
      console.log('❌ Email missing');
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

    // Generate public access token for the report
    const publicToken = crypto.randomBytes(32).toString('hex');
    const publicTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    console.log('🔑 Public token generated:', publicToken);

    // CRITICAL: Extract params and results from studyData
    let params = studyData.params || {};
    let results = studyData.results || {};

    console.log('📦 Initial params keys:', Object.keys(params));
    console.log('📦 Initial results keys:', Object.keys(results));

    // If params is empty, try to build it from flat data
    if (Object.keys(params).length === 0) {
      console.log('⚠️ No params found, building from flat data...');
      params = {
        inclinaison: studyData.inclinaison || "35",
        azimut: studyData.azimut || "0",
        systemLosses: studyData.systemLosses || "14",
        pertes: studyData.systemLosses || "14",
        panels: studyData.panels || [],
        obstacles: studyData.obstacles || [],
        voltageDropResult: studyData.voltageDropResult || null,
        calepinageImage: studyData.calepinageImage || null,
      };
      console.log('📦 Built params from flat data:', params);
    } else {
      console.log('✅ Params found with keys:', Object.keys(params));
      console.log('📦 params.panels length:', params.panels?.length || 0);
    }

    // If results is empty, try to build it from flat data
    if (Object.keys(results).length === 0 || !results.production) {
      console.log('⚠️ No results found, building from flat data...');
      results = {
        production: studyData.production || 0,
        irradiation: studyData.irradiation || 0,
        variabilite: studyData.variabilite || 0,
        monthly: studyData.monthly || [],
        fullData: studyData.data || {},
      };
      console.log('📦 Built results from flat data:', results);
      console.log('📦 results.monthly length:', results.monthly?.length || 0);
    } else {
      console.log('✅ Results found with keys:', Object.keys(results));
      console.log('📦 results.monthly length:', results.monthly?.length || 0);
    }

    console.log('📦 Final params keys:', Object.keys(params));
    console.log('📦 Final results keys:', Object.keys(results));
    console.log('📦 Final results.monthly length:', results.monthly?.length || 0);
    console.log('📦 Final params.panels length:', params.panels?.length || 0);
    console.log('📦 Final params:', JSON.stringify(params, null, 2));
    console.log('📦 Final results:', JSON.stringify(results, null, 2));

    // 2. Create Study with ALL fields including params and results
    const study = await Study.create({
      userEmail: user.email,
      puissance: studyData.puissance || "0",
      adresse: studyData.adresse || "Adresse non définie",
      lat: studyData.lat || 0,
      lng: studyData.lng || 0,
      params: params,      // <-- CRITICAL: Save params
      results: results,    // <-- CRITICAL: Save results
      publicToken: publicToken,
      publicTokenExpires: publicTokenExpires,
    });

    console.log('✅ Study created with ID:', study._id);
    console.log('✅ Study params saved:', !!study.params);
    console.log('✅ Study results saved:', !!study.results);
    console.log('✅ Study publicToken saved:', study.publicToken);
    
    // Verify the saved data
    const savedStudy = await Study.findById(study._id);
    console.log('✅ Verifying saved study:');
    console.log('   - params keys:', Object.keys(savedStudy.params || {}));
    console.log('   - results keys:', Object.keys(savedStudy.results || {}));
    console.log('   - results.monthly length:', savedStudy.results?.monthly?.length || 0);
    console.log('   - params.panels length:', savedStudy.params?.panels?.length || 0);

    // Create the report URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solaire.mafatec.com/';
    const reportUrl = `https://solaire.mafatec.com/rapport-public?id=${study._id}&token=${publicToken}`;
    console.log('🔗 Report URL:', reportUrl);

    // Update study with report URL
    await Study.findByIdAndUpdate(study._id, {
      reportUrl: reportUrl,
    });

    console.log('✅ Study updated with reportUrl:', reportUrl);

    let activationToken = null;

    // --- Generate PDF ---
    let pdfBuffer: Buffer | null = null;
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
        params: params,
        results: results,
      };

      console.log('📄 PDF Data prepared:', {
        puissance: pdfData.puissance,
        adresse: pdfData.adresse,
        production: pdfData.production,
        monthlyCount: pdfData.monthly?.length || 0,
        panelsCount: pdfData.panels?.length || 0,
      });

      pdfBuffer = await generateStudyPDFBuffer(pdfData);
      
      // Check if pdfBuffer exists and is a Buffer with content
      if (pdfBuffer && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
        pdfGenerated = true;
        console.log(`✅ PDF generated successfully for ${email}, size: ${pdfBuffer.length} bytes`);
      } else {
        console.log(`⚠️ PDF buffer is empty or null for ${email}`);
        pdfGenerated = false;
      }
    } catch (pdfError) {
      console.error('❌ Error generating PDF:', pdfError);
      pdfGenerated = false;
      // Continue without PDF attachment
    }

    // --- Send email ---
    let emailHtml = '';
    let subject = '';
    const attachments = [];

    // Add PDF as attachment if generated
    if (pdfGenerated && pdfBuffer && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
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
      _id: study._id,
      publicToken: publicToken,
      reportUrl: reportUrl,
      publicTokenExpires: publicTokenExpires,
      puissance: studyData.puissance || "0",
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
    console.log(`🔗 Report URL: ${reportUrl}`);
    if (attachments.length > 0 && attachments[0].content) {
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
      reportUrl: reportUrl,
      publicToken: publicToken,
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error in /api/studies:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}