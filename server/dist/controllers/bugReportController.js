import { Op } from "sequelize";
import { BugReport } from "../models/BugReport.js";
import { sendBugReportAcknowledgementEmail } from "../services/bugReportEmail.service.js";
async function generateTicketNumber() {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `BUG-${yearMonth}-`;
    const count = await BugReport.count({
        where: {
            ticketNumber: {
                [Op.like]: `${prefix}%`,
            },
        },
    });
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${String(count + 1).padStart(4, "0")}-${randomPart}`;
}
export async function submitBugReport(req, res) {
    try {
        const { pageUrl, errorName, errorMessage, errorStack, userAgent, reporterEmail, userNote, } = req.body;
        // Resolve reporter email (from body or authenticated user)
        const authUser = req.user;
        const finalEmail = String(reporterEmail || authUser?.email || "").trim();
        if (!pageUrl || !errorMessage) {
            return res.status(400).json({
                success: false,
                message: "Halaman terkendala dan pesan error wajib diisi.",
            });
        }
        if (!finalEmail) {
            return res.status(400).json({
                success: false,
                message: "Alamat email pelapor diperlukan agar kami dapat mengabari saat perbaikan selesai.",
            });
        }
        const ticketNumber = await generateTicketNumber();
        const bugReport = await BugReport.create({
            ticketNumber,
            pageUrl: String(pageUrl).slice(0, 2048),
            errorName: String(errorName || "ApplicationError").slice(0, 255),
            errorMessage: String(errorMessage),
            errorStack: errorStack ? String(errorStack) : null,
            userAgent: userAgent ? String(userAgent) : req.headers["user-agent"] || null,
            reporterEmail: finalEmail,
            reporterUserId: authUser?.id ? Number(authUser.id) : null,
            userNote: userNote ? String(userNote) : null,
            status: "NEW",
            priority: "MEDIUM",
        });
        // Send acknowledgement email asynchronously (non-blocking)
        sendBugReportAcknowledgementEmail(bugReport.toJSON()).catch((err) => {
            console.warn("[BugReport] Failed to send email ack:", err);
        });
        return res.status(201).json({
            success: true,
            message: "Laporan kendala berhasil dikirim. Terima kasih atas masukan Anda!",
            data: {
                ticketNumber: bugReport.ticketNumber,
                status: bugReport.status,
                createdAt: bugReport.createdAt,
            },
        });
    }
    catch (error) {
        console.error("[BugReport] Error submitting bug report:", error);
        return res.status(500).json({
            success: false,
            message: "Gagal menyimpan laporan kendala.",
            error: error?.message || "Internal server error",
        });
    }
}
