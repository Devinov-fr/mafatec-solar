import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prenom, nom, email, entreprise, universe } = body;

    // 1. Connect to DB and save Lead
    await dbConnect();
    const newLead = await Lead.create({
      prenom,
      nom,
      email,
      entreprise,
      universe,
    });

    // 2. Configure Nodemailer
    // Note: User should provide these in .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. Email Content
    const mailOptions = {
      from: process.env.SMTP_FROM || '"MAFATEC Solar" <no-reply@mafatec.fr>',
      to: email,
      subject: 'Votre étude solaire MAFATEC est prête !',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: ${universe === 'pro' ? '#1e40af' : '#c93b18'}; text-align: center;">Bonjour ${prenom},</h2>
          <p>Merci d'avoir réalisé votre étude solaire avec MAFATEC.</p>
          <p>Vous trouverez ci-dessous le récapitulatif de votre demande :</p>
          <ul>
            <li><strong>Nom :</strong> ${nom} ${prenom}</li>
            ${entreprise ? `<li><strong>Entreprise :</strong> ${entreprise}</li>` : ''}
            <li><strong>Profil :</strong> ${universe === 'pro' ? 'Professionnel' : 'Particulier'}</li>
          </ul>
          <p>Votre rapport complet est en cours de préparation et sera accessible via votre lien unique.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
               style="background-color: ${universe === 'pro' ? '#1e40af' : '#c93b18'}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accéder à mon étude
            </a>
          </div>
          <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #777; text-align: center;">
            Ceci est un message automatique, merci de ne pas y répondre.<br/>
            © ${new Date().getFullYear()} MAFATEC. Tous droits réservés.
          </p>
        </div>
      `,
    };

    // 4. Send Email
    // Only attempt to send if SMTP credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.warn('SMTP credentials missing. Lead saved to DB but email not sent.');
    }

    return NextResponse.json({ success: true, lead: newLead }, { status: 201 });
  } catch (error: any) {
    console.error('Error in /api/leads:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
