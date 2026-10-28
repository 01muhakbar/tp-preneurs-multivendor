import "dotenv/config";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import net from "node:net";
import { once } from "node:events";
import app from "../app.js";
import { User, UserRegistrationVerification, sequelize } from "../models/index.js";
class CookieClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async request(path, init = {}) {
        const headers = new Headers(init.headers || {});
        headers.set("Accept", "application/json");
        if (init.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers,
        });
        const text = await response.text();
        let body = null;
        try {
            body = text ? JSON.parse(text) : null;
        }
        catch {
            body = text;
        }
        return {
            status: response.status,
            ok: response.ok,
            body,
            text,
            headers: response.headers,
        };
    }
}
class SmtpSink {
    constructor() {
        this.server = net.createServer();
        this.port = 0;
        this.server.on("connection", (socket) => {
            socket.setEncoding("utf8");
            socket.on("error", () => null);
            let buffer = "";
            let dataMode = false;
            let authState = null;
            const write = (line) => {
                if (!socket.destroyed && socket.writable) {
                    socket.write(`${line}\r\n`);
                }
            };
            write("220 localhost ESMTP");
            const handleLine = (rawLine) => {
                const line = rawLine.replace(/\r?\n$/, "");
                if (dataMode) {
                    if (line === ".") {
                        dataMode = false;
                        write("250 Message accepted");
                        return;
                    }
                    return;
                }
                if (authState === "LOGIN_USERNAME") {
                    authState = "LOGIN_PASSWORD";
                    write("334 UGFzc3dvcmQ6");
                    return;
                }
                if (authState === "LOGIN_PASSWORD") {
                    authState = null;
                    write("235 Authentication successful");
                    return;
                }
                const upper = line.toUpperCase();
                if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
                    socket.write("250-localhost\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n");
                    return;
                }
                if (upper.startsWith("AUTH PLAIN")) {
                    write("235 Authentication successful");
                    return;
                }
                if (upper === "AUTH LOGIN") {
                    authState = "LOGIN_USERNAME";
                    write("334 VXNlcm5hbWU6");
                    return;
                }
                if (upper.startsWith("AUTH LOGIN ")) {
                    authState = "LOGIN_PASSWORD";
                    write("334 UGFzc3dvcmQ6");
                    return;
                }
                if (upper.startsWith("MAIL FROM:") ||
                    upper.startsWith("RCPT TO:") ||
                    upper === "RSET" ||
                    upper === "NOOP") {
                    write("250 OK");
                    return;
                }
                if (upper === "DATA") {
                    dataMode = true;
                    write("354 End data with <CR><LF>.<CR><LF>");
                    return;
                }
                if (upper === "QUIT") {
                    write("221 Bye");
                    socket.end();
                    return;
                }
                write("250 OK");
            };
            socket.on("data", (chunk) => {
                buffer += chunk;
                while (buffer.includes("\n")) {
                    const index = buffer.indexOf("\n");
                    const line = buffer.slice(0, index + 1);
                    buffer = buffer.slice(index + 1);
                    handleLine(line);
                }
            });
        });
    }
    async start() {
        this.server.listen(0, "127.0.0.1");
        await once(this.server, "listening");
        const address = this.server.address();
        assert.ok(address && typeof address === "object", "smtp sink failed to bind");
        this.port = Number(address.port);
    }
    async stop() {
        if (!this.server.listening)
            return;
        this.server.close();
        await once(this.server, "close");
    }
}
const RUN_ID = `auth-rate-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const createdUserIds = [];
const createdVerificationIds = [];
const logStep = (label) => {
    console.log(`[auth-rate-limit-smoke] ${label}`);
};
const logPass = (label) => {
    console.log(`[auth-rate-limit-smoke] PASS ${label}`);
};
const assertRateLimited = (response, label) => {
    assert.equal(response.status, 429, `${label}: expected HTTP 429, received ${response.status} (${response.text})`);
    assert.equal(String(response.body?.code || ""), "RATE_LIMITED", `${label}: expected RATE_LIMITED`);
    assert.ok(Number(response.body?.data?.retryAfterSeconds || 0) > 0, `${label}: retryAfterSeconds should be present`);
};
const withEnv = async (overrides, fn) => {
    const originalEntries = Object.entries(overrides).map(([key]) => [key, process.env[key]]);
    for (const [key, value] of Object.entries(overrides)) {
        if (typeof value === "undefined") {
            delete process.env[key];
        }
        else {
            process.env[key] = value;
        }
    }
    try {
        await fn();
    }
    finally {
        for (const [key, value] of originalEntries) {
            if (typeof value === "undefined") {
                delete process.env[key];
            }
            else {
                process.env[key] = value;
            }
        }
    }
};
async function createActiveUser(label) {
    const email = `${RUN_ID}-${label}@example.test`;
    const user = await User.create({
        name: `Auth Rate ${label}`,
        email,
        password: await bcrypt.hash("StartPass123!", 10),
        role: "customer",
        status: "active",
    });
    const id = Number(user.getDataValue("id"));
    createdUserIds.push(id);
    return { id, email };
}
async function createPendingVerificationUser(label) {
    const email = `${RUN_ID}-${label}@example.test`;
    const user = await User.create({
        name: `Auth Pending ${label}`,
        email,
        password: await bcrypt.hash("PendingPass123!", 10),
        role: "customer",
        status: "pending_verification",
    });
    const userId = Number(user.getDataValue("id"));
    createdUserIds.push(userId);
    const verification = await UserRegistrationVerification.create({
        userId,
        publicId: crypto.randomBytes(18).toString("hex"),
        channel: "EMAIL",
        status: "PENDING",
        otpHash: crypto.randomBytes(32).toString("hex"),
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        resendAvailableAt: new Date(Date.now() - 1000),
        lastSentAt: new Date(Date.now() - 1000),
        attempts: 0,
        maxAttempts: 5,
        resendCount: 0,
        maxResends: 99,
    });
    createdVerificationIds.push(Number(verification.getDataValue("id")));
    return {
        userId,
        verificationId: String(verification.getDataValue("publicId")),
        verificationPk: Number(verification.getDataValue("id")),
    };
}
async function resetResendCooldown(verificationPk) {
    await UserRegistrationVerification.update({
        resendAvailableAt: new Date(Date.now() - 1000),
        lastSentAt: new Date(Date.now() - 1000),
    }, { where: { id: verificationPk } });
}
function forgotPayload(email) {
    return {
        email,
        honeypot: "",
        startedAt: Date.now() - 10_000,
    };
}
function resetPayload(token) {
    return {
        token,
        password: "ResetPass123!",
        passwordConfirm: "ResetPass123!",
        honeypot: "",
        startedAt: Date.now() - 10_000,
    };
}
async function runLoginRateLimitScenario(client) {
    logStep("login rate limit returns generic 429");
    const fixture = await createActiveUser("login");
    for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await client.request("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
                email: fixture.email,
                password: "WrongPass123!",
            }),
        });
        assert.equal(response.status, 401, `login attempt ${attempt + 1} should fail with 401`);
    }
    const limitedResponse = await client.request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email: fixture.email,
            password: "WrongPass123!",
        }),
    });
    assertRateLimited(limitedResponse, "login rate limit");
    assert.equal(String(limitedResponse.body?.message || ""), "Please wait before trying again.", "login rate limit: message should stay generic");
    logPass("login rate limit");
}
async function runForgotPasswordRateLimitScenario(client) {
    logStep("forgot password rate limit stays generic");
    const fixture = await createActiveUser("forgot");
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await client.request("/api/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(forgotPayload(fixture.email)),
        });
        assert.equal(response.status, 202, `forgot attempt ${attempt + 1} should return 202`);
    }
    const limitedResponse = await client.request("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(forgotPayload(fixture.email)),
    });
    assertRateLimited(limitedResponse, "forgot password rate limit");
    assert.equal(String(limitedResponse.body?.message || ""), "Please wait before trying again.", "forgot password rate limit: message should stay generic");
    logPass("forgot password rate limit");
}
async function runResetPasswordRateLimitScenario(client) {
    logStep("reset password rate limit returns 429");
    const rawToken = "a".repeat(64);
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await client.request("/api/auth/reset-password", {
            method: "POST",
            body: JSON.stringify(resetPayload(rawToken)),
        });
        assert.equal(response.status, 400, `reset attempt ${attempt + 1} should return 400`);
    }
    const limitedResponse = await client.request("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(resetPayload(rawToken)),
    });
    assertRateLimited(limitedResponse, "reset password rate limit");
    logPass("reset password rate limit");
}
async function runResendVerificationRateLimitScenario(client) {
    logStep("resend verification rate limit returns 429");
    const fixture = await createPendingVerificationUser("resend");
    for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await client.request("/api/auth/register/resend-otp", {
            method: "POST",
            body: JSON.stringify({
                verificationId: fixture.verificationId,
            }),
        });
        assert.equal(response.status, 200, `resend attempt ${attempt + 1} should return 200`);
        await resetResendCooldown(fixture.verificationPk);
    }
    const limitedResponse = await client.request("/api/auth/register/resend-otp", {
        method: "POST",
        body: JSON.stringify({
            verificationId: fixture.verificationId,
        }),
    });
    assertRateLimited(limitedResponse, "resend verification rate limit");
    logPass("resend verification rate limit");
}
async function cleanupFixtures() {
    if (createdVerificationIds.length > 0) {
        await UserRegistrationVerification.destroy({
            where: { id: [...new Set(createdVerificationIds)] },
            force: true,
        }).catch(() => null);
    }
    if (createdUserIds.length > 0) {
        await User.destroy({
            where: { id: [...new Set(createdUserIds)] },
            force: true,
        }).catch(() => null);
    }
}
async function run() {
    await sequelize.authenticate();
    const smtpSink = new SmtpSink();
    await smtpSink.start();
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address === "object", "smoke app failed to bind");
    const client = new CookieClient(`http://127.0.0.1:${Number(address.port)}`);
    try {
        await withEnv({
            EMAIL_HOST: "127.0.0.1",
            EMAIL_PORT: String(smtpSink.port),
            EMAIL_SECURE: "false",
            EMAIL_USER: "mvf",
            EMAIL_PASS: "mvf",
            EMAIL_FROM: "MVF <no-reply@example.test>",
            COOKIE_SECURE: "false",
            CLIENT_URL: `http://127.0.0.1:${Number(address.port)}`,
            NODE_ENV: "development",
        }, async () => {
            await runLoginRateLimitScenario(client);
            await runForgotPasswordRateLimitScenario(client);
            await runResetPasswordRateLimitScenario(client);
            await runResendVerificationRateLimitScenario(client);
        });
        console.log("[auth-rate-limit-smoke] OK");
    }
    finally {
        server.close();
        await once(server, "close").catch(() => null);
        await smtpSink.stop().catch(() => null);
    }
}
run()
    .catch((error) => {
    console.error("[auth-rate-limit-smoke] FAIL", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await cleanupFixtures().catch((cleanupError) => {
        console.error("[auth-rate-limit-smoke] cleanup failed", cleanupError);
        process.exitCode = 1;
    });
    await sequelize.close().catch(() => null);
});
