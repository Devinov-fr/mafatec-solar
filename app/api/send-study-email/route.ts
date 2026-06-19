import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Study from "@/models/Study";
import Lead from "@/models/Lead";
import ActivationToken from "@/models/ActivationToken";
import { sendEmail } from "@/lib/email";
import { generateStudyPDFServer } from "@/lib/serverPDFGenerator";
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
    } = body;

    // Validate required fields
    if (!prenom || !email || !studyData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists
    let existingUser = await User.findOne({ email });
    let isNewUser = false;
    let activationToken = null;

    if (!existingUser) {
      isNewUser = true;
      
      // Generate activation token
      const token = crypto.randomUUID();
      
      // Create new user
      const user = await User.create({
        email,
        prenom,
        nom,
        entreprise: entreprise || "",
        type: universe || "part",
        activated: false,
      });
      
      existingUser = user;

      // Create activation token
      const tokenDoc = await ActivationToken.create({
        token: token,
        userEmail: email,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });
      
      activationToken = token;
    }

    // Save study to database
    const study = await Study.create({
      userEmail: email,
      puissance: studyData.puissance,
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
      },
      results: {
        production: studyData.production || 0,
        irradiation: studyData.irradiation || 0,
        variabilite: studyData.variabilite || 0,
        monthly: studyData.monthly || [],
        fullData: studyData.data || {},
      },
    });

    // Save lead
    await Lead.create({
      prenom,
      nom,
      email,
      entreprise: entreprise || "",
      universe: universe || "part",
      studyData: {
        puissance: studyData.puissance,
        adresse: studyData.adresse || "Adresse non définie",
        production: studyData.production || 0,
        irradiation: studyData.irradiation || 0,
        variabilite: studyData.variabilite || 0,
      },
    });

    // --- Generate PDF on server ---
    let pdfBuffer: Buffer | null = null;
    let pdfGenerated = false;

    try {
      // Prepare data for PDF generation
      const pdfData = {
        puissance: studyData.puissance,
        adresse: studyData.adresse || "Adresse non définie",
        production: studyData.production || 0,
        irradiation: studyData.irradiation || 0,
        variabilite: studyData.variabilite || 0,
        inclinaison: studyData.inclinaison || "35",
        azimut: studyData.azimut || "0",
        systemLosses: studyData.systemLosses || "14",
        monthlyData: studyData.monthly || [],
      };

      // Generate PDF
      pdfBuffer = await generateStudyPDFServer(pdfData);
      pdfGenerated = true;
      console.log(`✅ PDF generated successfully for ${email}`);
      
      // Update study with report URL
      await Study.findByIdAndUpdate(study._id, {
        reportUrl: `pdf-${study._id}-${Date.now()}.pdf`,
      });
      
    } catch (pdfError) {
      console.error('❌ Error generating PDF on server:', pdfError);
      // Continue without PDF attachment
    }

    // --- Send email with PDF attachment ---
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/activate?token=${activationToken}&email=${encodeURIComponent(email)}`;

    let emailHtml = '';
    let subject = '';
    const attachments = [];

    // Add PDF as attachment if generated
    if (pdfBuffer) {
      attachments.push({
        filename: `rapport-installation-pv-${studyData.puissance}kwc.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    const studyForEmail = {
      puissance: studyData.puissance,
      adresse: studyData.adresse || "Adresse non définie",
      production: studyData.production || 0,
      irradiation: studyData.irradiation || 0,
      variabilite: studyData.variabilite || 0,
    };

    if (isNewUser) {
      emailHtml = getActivationEmailHtml(prenom, activationUrl, studyForEmail);
      subject = `Votre étude MAFATEC et activation de compte`;
    } else {
      emailHtml = getStudyReadyEmailHtml(prenom, loginUrl, studyForEmail);
      subject = `Votre nouvelle étude MAFATEC est prête`;
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
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(`✅ Email sent to ${email} with PDF: ${pdfGenerated}`);

    return NextResponse.json({
      success: true,
      isNew: isNewUser,
      activationToken: activationToken,
      pdfAttached: pdfGenerated,
      message: `Study created and email sent${pdfGenerated ? ' with PDF attachment' : ''}`,
    });

  } catch (error) {
    console.error('Error in send-study-email API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}