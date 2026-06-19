import nodemailer from 'nodemailer';
import path from 'path';

const isProduction = process.env.IS_PRODUCTION === 'true';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (options: any) => {
  if (!isProduction) {
    console.log('[DEV MODE] Email would be sent:', {
      to: options.to,
      subject: options.subject,
      attachments: options.attachments?.length || 0,
    });
    return true;
  }

  try {
    const attachments = [
      {
        filename: 'logo-mafatec-blanc.png',
        path: path.join(process.cwd(), 'public', 'logo-mafatec-blanc.png'),
        cid: 'logo_mafatec_blanc',
      },
      ...(options.attachments || []),
    ];

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      ...options,
      attachments,
    });
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

const FOOTER_HTML = `
    <tr><td style="padding:30px 40px 34px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e7e4de;">
        <tr><td style="padding-top:22px;" align="center">
          <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8e9c;">MAFATEC — Énergie solaire · 12 Rue Paul Langevin, 93270 Sevran</p>
          <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8a8e9c;">RGE · Qualifelec · Qualit'EnR · IRVE · KNX</p>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#b3b6c0;">Vous recevez cet email car une étude a été demandée avec cette adresse.<br><a href="#" style="color:#8a8e9c;text-decoration:underline;">Politique de confidentialité</a> · <a href="#" style="color:#8a8e9c;text-decoration:underline;">Se désabonner</a></p>
        </td></tr>
      </table>
    </td></tr>
`;

const getStudyCardHtml = (study: any) => {
  const productionValue = study.results?.production || study.production || 0;
  const irradiationValue = study.results?.irradiation || study.irradiation || 0;
  const variabiliteValue = study.results?.variabilite || study.variabilite || 0;

  const production = productionValue ? productionValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  const irradiation = irradiationValue ? irradiationValue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—';
  const variabilite = variabiliteValue ? variabiliteValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

  return `
    <tr><td style="padding:8px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf9f7;border:1px solid #e7e4de;border-radius:12px;">
        <tr><td style="padding:22px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" width="46" style="padding-right:14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" valign="middle" width="46" height="46" style="width:46px;height:46px;background-color:#0b0e1d;border-radius:11px;color:#A82E12;font-family:Georgia,serif;font-size:20px;">☀</td></tr></table>
              </td>
              <td valign="middle">
                <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#15171f;">Étude installation PV <span style="color:#c93b18;">${study.puissance} kWc</span></p>
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#54586a;">${study.adresse}</p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border-top:1px solid #e7e4de;">
            <tr>
              <td width="33%" style="padding:14px 6px 0 0;" valign="top">
                <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9a8a6a;">Production / an</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#15171f;">${production}<span style="font-family:Arial,sans-serif;font-size:11px;color:#54586a;"> kWh</span></p>
              </td>
              <td width="33%" style="padding:14px 6px 0;" valign="top">
                <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9a8a6a;">Irradiation</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#15171f;">${irradiation}<span style="font-family:Arial,sans-serif;font-size:11px;color:#54586a;"> kWh/m²</span></p>
              </td>
              <td width="33%" style="padding:14px 0 0 6px;" valign="top">
                <p style="margin:0 0 3px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#9a8a6a;">Variabilité</p>
                <p style="margin:0;font-family:Georgia,serif;font-size:18px;color:#15171f;">${variabilite}<span style="font-family:Arial,sans-serif;font-size:11px;color:#54586a;"> kWh</span></p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  `;
};

export const getActivationEmailHtml = (prenom: string, activationUrl: string, study: any) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#e9eaee;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e9eaee;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;">
    <tr><td style="background-color:#0b0e1d;padding:30px 40px 26px;" align="left">
      <img src="cid:logo_mafatec_blanc" alt="MAFATEC" width="132" style="display:block;border:0;height:auto;">
    </td></tr>
    <tr><td style="height:3px;background-color:#A82E12;line-height:3px;font-size:3px;">&nbsp;</td></tr>
    <tr><td style="padding:40px 40px 8px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c93b18;">Votre étude est prête</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#15171f;font-weight:normal;">Merci, ${prenom} — voici votre analyse solaire</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#54586a;">Votre étude de production photovoltaïque a bien été générée. Le rapport complet est disponible ci-dessous.</p>
    </td></tr>
    ${getStudyCardHtml(study)}
    <tr><td style="padding:24px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fbf3ef;border:1px solid #efccbf;border-radius:12px;">
        <tr><td style="padding:24px 26px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#c93b18;">Votre espace personnel</p>
          <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:21px;line-height:1.25;color:#15171f;font-weight:normal;">Activez votre compte MAFATEC</h2>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#54586a;">Un compte a été créé pour vous. Activez-le pour retrouver cette étude et toutes vos prochaines simulations au même endroit.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td align="center" style="background-color:#c93b18;border-radius:8px;">
              <a href="${activationUrl}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Créer mon mot de passe →</a>
            </td>
          </tr></table>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#8a7a68;">⌛ Ce lien d'activation est valable <strong style="color:#a8400f;">3 jours</strong>. Passé ce délai, relancez une étude avec la même adresse email pour en recevoir un nouveau.</p>
        </td></tr>
      </table>
    </td></tr>
    ${FOOTER_HTML}
  </table>
</td></tr>
</table>
</body>
</html>
  `;
};

export const getStudyReadyEmailHtml = (prenom: string, loginUrl: string, study: any) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#e9eaee;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e9eaee;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;">
    <tr><td style="background-color:#0b0e1d;padding:30px 40px 26px;" align="left">
      <img src="cid:logo_mafatec_blanc" alt="MAFATEC" width="132" style="display:block;border:0;height:auto;">
    </td></tr>
    <tr><td style="height:3px;background-color:#A82E12;line-height:3px;font-size:3px;">&nbsp;</td></tr>
    <tr><td style="padding:40px 40px 8px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c93b18;">Nouvelle étude disponible</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#15171f;font-weight:normal;">Votre nouvelle analyse solaire est prête</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#54586a;">Bonjour ${prenom}, votre nouvelle étude photovoltaïque vient d'être générée. Vous trouverez le rapport PDF en pièce jointe.</p>
    </td></tr>
    ${getStudyCardHtml(study)}
    <tr><td style="padding:24px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td align="center" style="background-color:#0b0e1d;border-radius:8px;">
          <a href="${loginUrl}" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">Accéder à mon espace →</a>
        </td>
      </tr></table>
    </td></tr>
    ${FOOTER_HTML}
  </table>
</td></tr>
</table>
</body>
</html>
  `;
};

export const getEmailWithPDFHtml = (prenom: string, study: any) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
</head>
<body style="margin:0;padding:0;background-color:#e9eaee;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e9eaee;">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:14px;overflow:hidden;">
    <tr><td style="background-color:#0b0e1d;padding:30px 40px 26px;" align="left">
      <img src="cid:logo_mafatec_blanc" alt="MAFATEC" width="132" style="display:block;border:0;height:auto;">
    </td></tr>
    <tr><td style="height:3px;background-color:#A82E12;line-height:3px;font-size:3px;">&nbsp;</td></tr>
    <tr><td style="padding:40px 40px 8px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#c93b18;">Votre étude est prête</p>
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:28px;line-height:1.2;color:#15171f;font-weight:normal;">Bonjour ${prenom},</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#54586a;">Votre étude photovoltaïque pour une installation de <strong>${study.puissance} kWc</strong> est maintenant disponible.</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#54586a;">Vous trouverez ci-joint le rapport complet au format PDF.</p>
    </td></tr>
    ${getStudyCardHtml(study)}
    <tr><td style="padding:30px 40px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:bold;color:#15171f;">📎 Pièce jointe : Rapport d'étude photovoltaïque</p>
      <p style="margin:0 0 16px;font-size:13px;color:#54586a;">Le fichier PDF contient l'intégralité des résultats de la simulation, y compris les graphiques mensuels et les analyses détaillées.</p>
    </td></tr>
    ${FOOTER_HTML}
  </table>
</td></tr>
</table>
</body>
</html>
  `;
};