// app/api/send-study-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Study from "@/models/Study";
import Lead from "@/models/Lead";
import ActivationToken from "@/models/ActivationToken";
import { sendEmail } from "@/lib/email";
import { getStudyReadyEmailHtml, getActivationEmailHtml } from "@/lib/email";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      prenom,
      nom,
      email,
      entreprise,
      universe,
      studyData,
      pdfBase64,
    } = body;

    console.log('📝 ========== STARTING SEND STUDY EMAIL ==========');
    console.log('📝 Email:', email);
    console.log('📝 Prenom:', prenom);
    console.log('📝 PDF Base64 received:', pdfBase64 ? `Yes (${pdfBase64.length} chars)` : 'No');
    console.log('📝 studyData keys:', Object.keys(studyData || {}));

    // Validate required fields
    if (!prenom || !email || !studyData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;
    let activationToken = null;

    if (!existingUser) {
      isNewUser = true;
      
      // Generate activation token
      const token = crypto.randomUUID();
      
      // Create new user
      existingUser = await User.create({
        email: email.toLowerCase(),
        prenom,
        nom,
        entreprise: entreprise || "",
        type: universe || "part",
        activated: false,
      });
      
      console.log('✅ User created:', existingUser.email);

      // Create activation token
      await ActivationToken.create({
        token: token,
        userEmail: email.toLowerCase(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });
      
      activationToken = token;
    } else {
      console.log('✅ User exists:', existingUser.email);
    }

    // Generate public access token for the report
    const publicToken = crypto.randomBytes(32).toString('hex');
    const publicTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    console.log('🔑 Public token generated:', publicToken.substring(0, 20) + '...');

    // Prepare study data
    const productionAnnuelle = studyData.production || 0;
    const irradiationAnnuelle = studyData.irradiation || 0;
    const variabiliteAnnuelle = studyData.variabilite || 0;

    // Create study with all fields matching your model
    const study = await Study.create({
      userEmail: email.toLowerCase(),
      puissance: studyData.puissance || "0",
      adresse: studyData.adresse || "Adresse non définie",
      lat: studyData.lat || 0,
      lng: studyData.lng || 0,
      params: {
        inclinaison: studyData.inclinaison || "35",
        azimut: studyData.azimut || "0",
        systemLosses: studyData.systemLosses || "14",
        panels: studyData.panels || [],
        obstacles: studyData.obstacles || [],
        voltageDropResult: studyData.voltageDropResult || null,
        calepinageImage: studyData.calepinageImage || null,
      },
      results: {
        production: productionAnnuelle,
        irradiation: irradiationAnnuelle,
        variabilite: variabiliteAnnuelle,
        monthly: studyData.monthly || [],
        fullData: studyData.data || {},
      },
      // Public access fields
      publicToken: publicToken,
      publicTokenExpires: publicTokenExpires,
    });

    console.log('✅ Study created with ID:', study._id);
    console.log('✅ Study publicToken:', study.publicToken);

    // Create the report URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solaire.mafatec.com/';
    const reportUrl = `${appUrl}/rapport-public?id=${study._id}&token=${publicToken}`;
    console.log('🔗 Report URL:', reportUrl);

    // Update study with report URL
    await Study.findByIdAndUpdate(study._id, {
      reportUrl: reportUrl,
    });

    // Save lead
    await Lead.create({
      prenom,
      nom,
      email: email.toLowerCase(),
      entreprise: entreprise || "",
      universe: universe || "part",
      studyData: {
        puissance: studyData.puissance || "0",
        adresse: studyData.adresse || "Adresse non définie",
        production: productionAnnuelle,
        irradiation: irradiationAnnuelle,
        variabilite: variabiliteAnnuelle,
      },
    });

    console.log('✅ Lead created for:', email);

    // --- Store PDF if provided ---
    const attachments = [];

    if (pdfBase64) {
      try {
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        attachments.push({
          filename: `etude-mafatec-${studyData.puissance || 'PV'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
        console.log(`📎 PDF attachment added (${pdfBuffer.length} bytes)`);
        
        // Store PDF in study (using the pdfData field from your model)
        await Study.findByIdAndUpdate(study._id, {
          pdfData: pdfBuffer,
          pdfStored: true,
        });
      } catch (error) {
        console.error('❌ Error processing PDF:', error);
      }
    } else {
      console.log('⚠️ No PDF attachment to add');
    }

    // --- Prepare email ---
    const loginUrl = `${appUrl}/login`;
    const activationUrl = `${appUrl}/activate?token=${activationToken}&email=${encodeURIComponent(email)}`;

    const studyForEmail = {
      _id: study._id,
      publicToken: publicToken,
      reportUrl: reportUrl,
      publicTokenExpires: publicTokenExpires,
      puissance: studyData.puissance || "0",
      adresse: studyData.adresse || "Adresse non définie",
      production: productionAnnuelle,
      irradiation: irradiationAnnuelle,
      variabilite: variabiliteAnnuelle,
    };

    let emailHtml = '';
    let subject = '';

    if (isNewUser) {
      emailHtml = getActivationEmailHtml(prenom, activationUrl, studyForEmail);
      subject = `Votre étude MAFATEC et activation de compte`;
    } else {
      emailHtml = getStudyReadyEmailHtml(prenom, loginUrl, studyForEmail);
      subject = `Votre nouvelle étude MAFATEC est prête`;
    }

    console.log(`📧 Sending email to: ${email}`);
    console.log(`📎 Attachments count: ${attachments.length}`);
    console.log(`🔗 Report URL in email: ${reportUrl}`);

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
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(`✅ Email sent successfully to ${email} with PDF: ${attachments.length > 0}`);
    console.log('📝 ========== SEND STUDY EMAIL COMPLETE ==========');

    return NextResponse.json({
      success: true,
      isNew: isNewUser,
      activationToken: activationToken,
      pdfAttached: attachments.length > 0,
      reportUrl: reportUrl,
      studyId: study._id,
      message: `Study created and email sent${attachments.length > 0 ? ' with PDF attachment' : ''}`,
    });

  } catch (error) {
    console.error('❌ Error in send-study-email API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}