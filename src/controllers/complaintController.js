const ComplaintService = require("../services/ComplaintService");

// ── CLIENT ────────────────────────────────────────────────

async function listMyComplaints(req, res) {
    try {
        const complaints = await ComplaintService.getMyComplaints(req.session.userId);
        res.render("complaints/client-list", { complaints, error: null });
    } catch (err) {
        res.render("complaints/client-list", { complaints: [], error: err.message });
    }
}

async function showNewComplaintForm(req, res) {
    res.render("complaints/client-new", { error: null });
}

async function createComplaint(req, res) {
    try {
        const { subject, description, priority } = req.body;
        await ComplaintService.createComplaint(req.session.userId, { subject, description, priority });
        res.redirect("/complaints?success=1");
    } catch (err) {
        res.render("complaints/client-new", { error: err.message });
    }
}

async function showMyComplaintDetail(req, res) {
    try {
        const { complaint, comments } = await ComplaintService.getMyComplaintById(
            req.params.id,
            req.session.userId
        );
        res.render("complaints/client-detail", { complaint, comments, error: null, success: null });
    } catch (err) {
        res.redirect("/complaints");
    }
}

async function addClientComment(req, res) {
    try {
        await ComplaintService.addClientComment(req.params.id, req.session.userId, req.body.body);
        res.redirect(`/complaints/${req.params.id}`);
    } catch (err) {
        try {
            const { complaint, comments } = await ComplaintService.getMyComplaintById(
                req.params.id,
                req.session.userId
            );
            res.render("complaints/client-detail", { complaint, comments, error: err.message, success: null });
        } catch {
            res.redirect("/complaints");
        }
    }
}

// ── AGENT / ADMIN ─────────────────────────────────────────

async function listAllComplaints(req, res) {
    try {
        const complaints = await ComplaintService.getAllComplaints();
        const stats = await ComplaintService.getStats();
        res.render("complaints/officer-list", { complaints, stats, error: null });
    } catch (err) {
        res.render("complaints/officer-list", { complaints: [], stats: [], error: err.message });
    }
}

async function showComplaintDetail(req, res) {
    try {
        const { complaint, comments } = await ComplaintService.getComplaintById(req.params.id);
        res.render("complaints/officer-detail", { complaint, comments, error: null });
    } catch (err) {
        res.redirect("/officer/complaints");
    }
}

async function processComplaint(req, res) {
    try {
        const { status, comment } = req.body;
        await ComplaintService.updateComplaintStatus(req.params.id, status, req.session.userId, comment);
        res.redirect(`/officer/complaints/${req.params.id}`);
    } catch (err) {
        try {
            const { complaint, comments } = await ComplaintService.getComplaintById(req.params.id);
            res.render("complaints/officer-detail", { complaint, comments, error: err.message });
        } catch {
            res.redirect("/officer/complaints");
        }
    }
}

async function addOfficerComment(req, res) {
    try {
        await ComplaintService.addOfficerComment(req.params.id, req.session.userId, req.body.body);
        res.redirect(`/officer/complaints/${req.params.id}`);
    } catch (err) {
        try {
            const { complaint, comments } = await ComplaintService.getComplaintById(req.params.id);
            res.render("complaints/officer-detail", { complaint, comments, error: err.message });
        } catch {
            res.redirect("/officer/complaints");
        }
    }
}

module.exports = {
    listMyComplaints,
    showNewComplaintForm,
    createComplaint,
    showMyComplaintDetail,
    addClientComment,
    listAllComplaints,
    showComplaintDetail,
    processComplaint,
    addOfficerComment,
};
