import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import nodemailer from 'nodemailer';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prenom, nom, email, entreprise, universe, studyData } = body;

    // 1. Connect to DB and save Lead
    await dbConnect();
    const newLead = await Lead.create({
      prenom,
      nom,
      email,
      entreprise,
      universe,
      studyData,
    });

    // Check if we're in production mode
    const isProduction = process.env.IS_PRODUCTION === 'true';

    // 2. Configure Nodemailer (only if sending emails)
    let transporter = null;
    if (isProduction) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solaire.mafatec.com/';
    const logoCid = 'logo_mafatec_blanc';

    // 3. Email Content
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Votre étude solaire MAFATEC est prête !',
      html: `
<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Votre étude photovoltaïque MAFATEC</title>
<!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif !important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#e9eaee;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<!-- Préheader (masqué) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#e9eaee;">Votre étude est prête — activez votre compte pour retrouver tous vos rapports.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e9eaee;">
  <tr>
    <td align="center" style="padding:24px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;">

        <!-- En-tête sombre -->
        <tr>
          <td style="background-color:#0b0e1d;padding:30px 40px 26px;" align="left">
            <img src="cid:${logoCid}" alt="MAFATEC" width="132" style="display:block;border:0;height:auto;width:132px;">
          </td>
        </tr>
        <tr>
          <td style="height:3px;background-color:#A82E12;line-height:3px;font-size:3px;">&nbsp;</td>
        </tr>

        <!-- Corps -->
        <tr>
          <td style="padding:40px 40px 8px;">
            <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c93b18;">Votre étude est prête</p>
            <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:#15171f;font-weight:normal;">Merci, ${prenom} — voici votre analyse solaire</h1>
            <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#54586a;">Votre étude de production photovoltaïque a bien été générée. Le rapport complet — production, irradiation, calepinage et diagramme solaire — est disponible ci-dessous.</p>
          </td>
        </tr>

        <!-- Carte récap étude -->
        <tr>
          <td style="padding:8px 40px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf9f7;border:1px solid #e7e4de;border-radius:12px;">
              <tr>
                <td style="padding:22px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="46" style="padding-right:14px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td align="center" valign="middle" width="46" height="46" style="width:46px;height:46px;background-color:#0b0e1d;border-radius:11px;color:#A82E12;font-family:Georgia,serif;font-size:20px;">☀️</td>
                          </tr>
                        </table>
                      </td>
                      <td valign="middle">
                        <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#15171f;">Étude installation PV <span style="color:#c93b18;">${studyData?.puissance || '—'} kWc</span></p>
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#54586a;">${studyData?.adresse || 'Adresse non spécifiée'}</p>
                      </td>
                    </tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border-top:1px solid #e7e4de;">
                    <tr>
                      <td width="33%" style="padding:14px 6px 0 0;" valign="top">
                        <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9a8a6a;">Production / an</p>
                        <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#15171f;">${studyData?.production ? studyData.production.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}<span style="font-family:Arial,sans-serif;font-size:11px;color:#54586a;"> kWh</span></p>
                      </td>
                      <td width="33%" style="padding:14px 6px 0;" valign="top">
                        <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9a8a6a;">Irradiation</p>
                        <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#15171f;">${studyData?.irradiation ? studyData.irradiation.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}<span style="font-family:Arial,sans-serif;font-size:11px;color:#54586a;"> kWh/m²</span></p>
                      </td>
                      <td width="33%" style="padding:14px 0 0 6px;" valign="top">
                        <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9a8a6a;">Variabilité</p>
                        <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#15171f;">${studyData?.variabilite ? studyData.variabilite.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}<span style="font-family:Arial,sans-serif;font-size:11px;color:#54586a;"> %</span></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bouton télécharger -->
        <tr>
          <td style="padding:24px 40px 4px;" align="left">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="background-color:#0b0e1d;border-radius:8px;">
                  <a href="${appUrl}" style="display:inline-block;padding:15px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">↓&nbsp;&nbsp;Accéder à mon étude</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Séparateur -->
        <tr>
          <td style="padding:30px 40px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid #e7e4de;line-height:1px;font-size:1px;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bloc activation compte -->
        <tr>
          <td style="padding:26px 40px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fbf3ef;border:1px solid #efccbf;border-radius:12px;">
              <tr>
                <td style="padding:24px 26px;">
                  <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#c93b18;">Votre espace personnel</p>
                  <h2 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.25;color:#15171f;font-weight:normal;">Activez votre compte MAFATEC</h2>
                  <p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#54586a;">Un compte a été créé pour vous. Activez-le pour retrouver cette étude et toutes vos prochaines simulations au même endroit, et télécharger vos rapports à tout moment.</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background-color:#c93b18;border-radius:8px;">
                        <a href="${appUrl}" style="display:inline-block;padding:15px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Créer mon mot de passe →</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#8a7a68;">💡 Ce lien d'activation est valable <strong style="color:#a8400f;">3 jours</strong>. Passé ce délai, relancez une étude avec la même adresse email pour en recevoir un nouveau.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Réassurance -->
        <tr>
          <td style="padding:26px 40px 0;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#8a8e9c;">Besoin d'aide pour votre projet? Répondez simplement à cet email, un conseiller MAFATEC vous accompagne — de l'étude à la mise en service, certifié RGE &amp; Qualifelec.</p>
          </td>
        </tr>

        <!-- Pied -->
        <tr>
          <td style="padding:30px 40px 34px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e7e4de;">
              <tr>
                <td style="padding-top:22px;" align="center">
                  <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8e9c;">MAFATEC — Énergie solaire · 12 Rue Paul Langevin, 93270 Sevran</p>
                  <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8e9c;">RGE · Qualifelec · Qualit'EnR · IRVE · KNX</p>
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#b3b6c0;">Vous recevez cet email car une étude a été demandée avec cette adresse.<br><a href="#" style="color:#8a8e9c;text-decoration:underline;">Politique de confidentialité</a> &nbsp;·&nbsp; <a href="#" style="color:#8a8e9c;text-decoration:underline;">Se désabonner</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>
      `,
      attachments: [
        {
          filename: 'logo-mafatec-blanc.png',
          path: path.join(process.cwd(), 'public', 'logo-mafatec-blanc.png'),
          cid: logoCid,
        },
      ],
    };

    // 4. Send Email (ONLY if isProduction is true)
    if (isProduction) {
      // Check if SMTP credentials are provided
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter!.sendMail(mailOptions);
        console.log('Email sent successfully to:', email);
      } else {
        console.error('SMTP credentials missing. Cannot send email in production mode.');
        // Optionally, you might want to throw an error here or handle it differently
      }
    } else {
      // Development mode: log that email would be sent but isn't
      console.log(`[DEV MODE] Email would be sent to ${email} but isProduction is false.`);
      console.log('[DEV MODE] Email content preview:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        htmlLength: mailOptions.html.length,
      });
    }

    return NextResponse.json({ 
      success: true, 
      lead: newLead,
      emailSent: isProduction && !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in /api/leads:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}