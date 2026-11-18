import { Op } from "sequelize";
import { BugReport } from "../../models/BugReport.js";
import { User } from "../../models/User.js";
import { Notification } from "../../models/Notification.js";
import { sendBugReportResolvedEmail } from "../../services/bugReportEmail.service.js";
export async function listBugReports(req, res) {
    try {
        const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "15"), 10)));
        const offset = (page - 1) * limit;
        const { status, priority, search } = req.query;
        const where = {};
        if (status && status !== "ALL") {
            where.status = status;
        }
        if (priority && priority !== "ALL") {
            where.priority = priority;
        }
        if (search && String(search).trim()) {
            const q = `%${String(search).trim()}%`;
            where[Op.or] = [
                { ticketNumber: { [Op.like]: q } },
                { pageUrl: { [Op.like]: q } },
                { reporterEmail: { [Op.like]: q } },
                { errorName: { [Op.like]: q } },
                { errorMessage: { [Op.like]: q } },
            ];
        }
        const { count, rows } = await BugReport.findAndCountAll({
            where,
            limit,
            offset,
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: User,
                    as: "reporter",
                    attributes: ["id", "name", "email", "role"],
                },
                {
                    model: User,
                    as: "resolver",
                    attributes: ["id", "name", "email", "role"],
                },
            ],
        });
        // Compute summary KPI counts
        const [totalCount, newCount, investigatingCount, fixedCount, closedCount] = await Promise.all([
            BugReport.count(),
            BugReport.count({ where: { status: "NEW" } }),
            BugReport.count({ where: { status: "INVESTIGATING" } }),
            BugReport.count({ where: { status: "FIXED" } }),
            BugReport.count({ where: { status: "CLOSED" } }),
        ]);
        return res.json({
            success: true,
            data: {
                items: rows,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit),
                },
                summary: {
                    total: totalCount,
                    new: newCount,
                    investigating: investigatingCount,
                    fixed: fixedCount,
                    closed: closedCount,
                },
            },
        });
    }
    catch (error) {
        console.error("[AdminBugReports] Error listing bug reports:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar laporan kendala.",
            error: error?.message,
        });
    }
}
export async function getBugReportDetail(req, res) {
    try {
        const reportId = Number(req.params.id);
        const report = await BugReport.findByPk(reportId, {
            include: [
                {
                    model: User,
                    as: "reporter",
                    attributes: ["id", "name", "email", "role"],
                },
                {
                    model: User,
                    as: "resolver",
                    attributes: ["id", "name", "email", "role"],
                },
            ],
        });
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Laporan kendala tidak ditemukan.",
            });
        }
        return res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        console.error("[AdminBugReports] Error getting report detail:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal mengambil detail laporan kendala.",
            error: error?.message,
        });
    }
}
export async function updateBugReportStatus(req, res) {
    try {
        const reportId = Number(req.params.id);
        const { status, priority, resolutionNote } = req.body;
        const report = await BugReport.findByPk(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Laporan kendala tidak ditemukan.",
            });
        }
        if (status) {
            report.status = status;
        }
        if (priority) {
            report.priority = priority;
        }
        if (resolutionNote !== undefined) {
            report.resolutionNote = resolutionNote ? String(resolutionNote) : null;
        }
        await report.save();
        return res.json({
            success: true,
            message: "Status laporan berhasil diperbarui.",
            data: report,
        });
    }
    catch (error) {
        console.error("[AdminBugReports] Error updating report status:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal memperbarui status laporan.",
            error: error?.message,
        });
    }
}
export async function resolveBugReport(req, res) {
    try {
        const reportId = Number(req.params.id);
        const { resolutionNote, sendEmailNotification = true } = req.body;
        const adminUser = req.user;
        const report = await BugReport.findByPk(reportId);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Laporan kendala tidak ditemukan.",
            });
        }
        report.status = "FIXED";
        report.resolutionNote = resolutionNote
            ? String(resolutionNote).trim()
            : "Pembaruan komponen dan optimasi sistem telah berhasil diterapkan.";
        report.resolvedAt = new Date();
        report.resolvedBy = adminUser?.id ? Number(adminUser.id) : null;
        await report.save();
        let emailSent = false;
        if (sendEmailNotification && report.reporterEmail) {
            try {
                emailSent = await sendBugReportResolvedEmail(report.toJSON());
            }
            catch (emailErr) {
                console.warn("[AdminBugReports] Failed to dispatch resolution email:", emailErr);
            }
        }
        // In-app notification if reporter is registered user
        if (report.reporterUserId) {
            try {
                await Notification.create({
                    type: "SYSTEM",
                    title: `Kendala #${report.ticketNumber} Telah Diperbaiki`,
                    isRead: false,
                    meta: {
                        ticketNumber: report.ticketNumber,
                        pageUrl: report.pageUrl,
                        resolutionNote: report.resolutionNote,
                        resolvedAt: report.resolvedAt,
                    },
                });
            }
            catch (notifErr) {
                console.warn("[AdminBugReports] Failed to create in-app notification:", notifErr);
            }
        }
        return res.json({
            success: true,
            message: "Laporan bug berhasil ditandai selesai dan pemberitahuan telah dikirimkan ke pelapor.",
            data: {
                report,
                emailSent,
            },
        });
    }
    catch (error) {
        console.error("[AdminBugReports] Error resolving bug report:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menyelesaikan laporan kendala.",
            error: error?.message,
        });
    }
}
