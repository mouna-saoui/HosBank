const ComplaintRepository = require("../repositories/ComplaintRepository");
const EmailService = require("./EmailService");

const VALID_PRIORITIES = ["low", "normal", "high", "urgent"];
const VALID_STATUSES   = ["open", "in_progress", "resolved", "closed"];

// ── CLIENT ────────────────────────────────────────────────

async function createComplaint(userId, { subject, description, priority }) {
    if (!subject || subject.trim().length < 5)
        throw new Error("Le sujet doit contenir au moins 5 caractères.");
    if (!description || description.trim().length < 10)
        throw new Error("La description doit contenir au moins 10 caractères.");
    if (!VALID_PRIORITIES.includes(priority))
        throw new Error("Priorité invalide.");

    return ComplaintRepository.create({
        userId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
    });
}

async function getMyComplaints(userId) {
    return ComplaintRepository.findByUserId(userId);
}

async function getMyComplaintById(id, userId) {
    const complaint = await ComplaintRepository.findByIdAndUserId(id, userId);
    if (!complaint) throw new Error("Réclamation introuvable.");
    const comments = await ComplaintRepository.findComments(id);
    return { complaint, comments };
}

async function addClientComment(complaintId, userId, body) {
    // Vérifier que la réclamation appartient au client
    const complaint = await ComplaintRepository.findByIdAndUserId(complaintId, userId);
    if (!complaint) throw new Error("Réclamation introuvable.");
    if (complaint.status === "closed") throw new Error("Cette réclamation est clôturée.");
    if (!body || body.trim().length < 2) throw new Error("Le commentaire est trop court.");
    return ComplaintRepository.addComment({ complaintId, authorId: userId, body: body.trim() });
}

// ── AGENT / ADMIN ─────────────────────────────────────────

async function getAllComplaints() {
    return ComplaintRepository.findAll();
}

async function getComplaintById(id) {
    const complaint = await ComplaintRepository.findById(id);
    if (!complaint) throw new Error("Réclamation introuvable.");
    const comments = await ComplaintRepository.findComments(id);
    return { complaint, comments };
}

async function updateComplaintStatus(id, status, officerId, commentBody) {
    if (!VALID_STATUSES.includes(status)) throw new Error("Statut invalide.");

    const complaint = await ComplaintRepository.findById(id);
    if (!complaint) throw new Error("Réclamation introuvable.");

    const updated = await ComplaintRepository.updateStatus(id, status, officerId);

    // Ajouter un commentaire de résolution si fourni
    if (commentBody && commentBody.trim().length > 1) {
        await ComplaintRepository.addComment({
            complaintId: id,
            authorId: officerId,
            body: commentBody.trim(),
        });
    }

    // ── Notification email client ─────────────────────────
    if (complaint.email) {
        if (status === "resolved") {
            sendComplaintResolvedEmail({
                toEmail: complaint.email,
                firstName: complaint.first_name || "Client",
                subject: complaint.subject,
                comment: commentBody || null,
            }).catch(err =>
                console.error("[EmailService] Erreur email réclamation résolue:", err.message)
            );
        } else if (status === "in_progress") {
            sendComplaintInProgressEmail({
                toEmail: complaint.email,
                firstName: complaint.first_name || "Client",
                subject: complaint.subject,
            }).catch(err =>
                console.error("[EmailService] Erreur email réclamation en cours:", err.message)
            );
        }
    }

    return updated;
}

async function addOfficerComment(complaintId, officerId, body) {
    const complaint = await ComplaintRepository.findById(complaintId);
    if (!complaint) throw new Error("Réclamation introuvable.");
    if (!body || body.trim().length < 2) throw new Error("Le commentaire est trop court.");
    return ComplaintRepository.addComment({ complaintId, authorId: officerId, body: body.trim() });
}

async function getStats() {
    return ComplaintRepository.countByStatus();
}

// ── Emails spécifiques réclamation ───────────────────────

async function sendComplaintResolvedEmail({ toEmail, firstName, subject, comment }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[EmailService] SMTP non configuré — email non envoyé.");
        return;
    }
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const commentBlock = comment
        ? `<p style="margin-top:12px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;color:#15803d;">
             <strong>Réponse de votre chargé client :</strong><br>${comment}
           </p>`
        : "";

    await transporter.sendMail({
        from: `"HosBank" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `✅ Votre réclamation a été résolue — HosBank`,
        html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">🏦 HosBank</h1>
          <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Votre banque de confiance</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;">✅</div>
            <h2 style="margin:16px 0 4px;color:#1e3a8a;font-size:22px;font-weight:700;">Réclamation résolue !</h2>
          </div>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            Votre réclamation concernant <strong style="color:#1d4ed8;">"${subject}"</strong> a été traitée et marquée comme <strong style="color:#16a34a;">résolue</strong>.
          </p>
          ${commentBlock}
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.APP_URL || "http://localhost:3000"}/complaints"
               style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
              Voir ma réclamation →
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} HosBank — Email automatique.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
    console.log(`[EmailService] Email réclamation résolue envoyé à ${toEmail}`);
}

async function sendComplaintInProgressEmail({ toEmail, firstName, subject }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
        from: `"HosBank" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `🔄 Votre réclamation est en cours de traitement — HosBank`,
        html: `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:36px 40px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">🏦 HosBank</h1>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="display:inline-block;background:#dbeafe;border-radius:50%;width:72px;height:72px;line-height:72px;font-size:36px;">🔄</div>
            <h2 style="margin:16px 0 4px;color:#1e3a8a;font-size:22px;font-weight:700;">Traitement en cours</h2>
          </div>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            Votre réclamation <strong style="color:#1d4ed8;">"${subject}"</strong> est maintenant <strong style="color:#2563eb;">en cours de traitement</strong> par votre chargé client.
            Vous serez notifié dès qu'elle sera résolue.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.APP_URL || "http://localhost:3000"}/complaints"
               style="display:inline-block;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">
              Suivre ma réclamation →
            </a>
          </div>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} HosBank — Email automatique.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
}

module.exports = {
    createComplaint,
    getMyComplaints,
    getMyComplaintById,
    addClientComment,
    getAllComplaints,
    getComplaintById,
    updateComplaintStatus,
    addOfficerComment,
    getStats,
};
