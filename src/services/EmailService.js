const nodemailer = require("nodemailer");

// ── Transporter ──────────────────────────────────────────
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true", // true pour 465, false pour autres
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

const BANK_NAME = "HosBank";
const BANK_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;

// ── Templates ─────────────────────────────────────────────

function getRequestLabel(requestType) {
    const labels = {
        savings_account: "Ouverture de compte épargne",
        rib: "Demande de RIB",
        virtual_card: "Demande de carte virtuelle",
        pin: "Demande de PIN",
        opposition: "Opposition carte",
    };
    return labels[requestType] || requestType;
}

function buildApprovedHtml(firstName, requestType, resolutionNote) {
    const label = getRequestLabel(requestType);
    const note = resolutionNote
        ? `<p style="margin-top:12px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;color:#15803d;">
             <strong>Note du chargé client :</strong> ${resolutionNote}
           </p>`
        : "";

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre demande a été acceptée — ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🏦 ${BANK_NAME}</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Votre banque de confiance</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              
              <!-- Icon + Title -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;">✅</div>
                <h2 style="margin:16px 0 4px;color:#1e3a8a;font-size:22px;font-weight:700;">Demande acceptée !</h2>
                <p style="margin:0;color:#64748b;font-size:14px;">Votre demande a été traitée avec succès</p>
              </div>

              <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
              <p style="color:#374151;font-size:15px;line-height:1.6;">
                Nous avons le plaisir de vous informer que votre demande de 
                <strong style="color:#1d4ed8;">${label}</strong> 
                a été <strong style="color:#16a34a;">acceptée et approuvée</strong> par votre chargé client.
              </p>

              ${note}

              <p style="color:#374151;font-size:15px;line-height:1.6;margin-top:20px;">
                Vous pouvez dès maintenant vous connecter à votre espace client pour consulter les détails et utiliser votre nouveau service.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                  Accéder à mon espace →
                </a>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">

              <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
                Si vous avez des questions, contactez votre chargé client ou 
                écrivez-nous à <a href="mailto:${BANK_EMAIL}" style="color:#1d4ed8;">${BANK_EMAIL}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} ${BANK_NAME} — Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildRejectedHtml(firstName, requestType, resolutionNote) {
    const label = getRequestLabel(requestType);
    const note = resolutionNote
        ? `<p style="margin-top:12px;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;color:#b91c1c;">
             <strong>Motif :</strong> ${resolutionNote}
           </p>`
        : "";

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre demande a été refusée — ${BANK_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">🏦 ${BANK_NAME}</h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Votre banque de confiance</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;background:#fee2e2;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;">❌</div>
                <h2 style="margin:16px 0 4px;color:#1e3a8a;font-size:22px;font-weight:700;">Demande non acceptée</h2>
                <p style="margin:0;color:#64748b;font-size:14px;">Votre chargé client a examiné votre demande</p>
              </div>

              <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
              <p style="color:#374151;font-size:15px;line-height:1.6;">
                Après examen, votre demande de 
                <strong style="color:#1d4ed8;">${label}</strong> 
                n'a pas pu être <strong style="color:#dc2626;">acceptée</strong>.
              </p>

              ${note}

              <p style="color:#374151;font-size:15px;line-height:1.6;margin-top:20px;">
                Pour toute question ou pour soumettre une nouvelle demande, connectez-vous à votre espace client ou contactez votre chargé client.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
                  Accéder à mon espace →
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">
              <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
                Contactez-nous : <a href="mailto:${BANK_EMAIL}" style="color:#1d4ed8;">${BANK_EMAIL}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} ${BANK_NAME} — Email automatique, merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Fonctions publiques ───────────────────────────────────

/**
 * Envoie un email de confirmation d'acceptation de demande au client.
 * @param {object} options - { toEmail, firstName, requestType, resolutionNote }
 */
async function sendRequestApprovedEmail({ toEmail, firstName, requestType, resolutionNote }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[EmailService] SMTP non configuré — email non envoyé.");
        return;
    }

    const transporter = createTransporter();
    const label = getRequestLabel(requestType);

    await transporter.sendMail({
        from: `"${BANK_NAME}" <${BANK_EMAIL}>`,
        to: toEmail,
        subject: `✅ Votre demande "${label}" a été acceptée — ${BANK_NAME}`,
        html: buildApprovedHtml(firstName, requestType, resolutionNote),
    });

    console.log(`[EmailService] Email d'approbation envoyé à ${toEmail} (${requestType})`);
}

/**
 * Envoie un email de refus de demande au client.
 * @param {object} options - { toEmail, firstName, requestType, resolutionNote }
 */
async function sendRequestRejectedEmail({ toEmail, firstName, requestType, resolutionNote }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[EmailService] SMTP non configuré — email non envoyé.");
        return;
    }

    const transporter = createTransporter();
    const label = getRequestLabel(requestType);

    await transporter.sendMail({
        from: `"${BANK_NAME}" <${BANK_EMAIL}>`,
        to: toEmail,
        subject: `❌ Votre demande "${label}" — ${BANK_NAME}`,
        html: buildRejectedHtml(firstName, requestType, resolutionNote),
    });

    console.log(`[EmailService] Email de refus envoyé à ${toEmail} (${requestType})`);
}

module.exports = {
    sendRequestApprovedEmail,
    sendRequestRejectedEmail,
};
