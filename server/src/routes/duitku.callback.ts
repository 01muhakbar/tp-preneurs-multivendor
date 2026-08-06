import express from "express";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";
import {
  DUITKU_CALLBACK_BODY_LIMIT_BYTES,
  DuitkuCallbackParseError,
  parseAndVerifyDuitkuCallback,
} from "../services/duitku/duitkuCallbackParser.service.js";
import {
  storeDuitkuCallbackSecurityEvent,
  storeValidDuitkuCallback,
} from "../services/duitku/duitkuCallbackStorage.service.js";

const router = express.Router();

const rawFormParser = express.raw({
  type: "application/x-www-form-urlencoded",
  limit: DUITKU_CALLBACK_BODY_LIMIT_BYTES,
});

const requestContext = (req: express.Request) => ({
  sourceIp: req.ip,
  userAgent: req.get("user-agent") || undefined,
});

router.post("/callback", rawFormParser, async (req, res, next) => {
  try {
    const config = resolveDuitkuConfig();
    if (!config.enabled) {
      return res.status(503).json({
        success: false,
        message: "Duitku callback parser is disabled.",
      });
    }

    const parsed = parseAndVerifyDuitkuCallback({
      rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0),
      contentType: req.get("content-type"),
      merchantCode: config.merchantCode,
      apiKey: config.apiKey,
    });

    if (!parsed.signatureValid) {
      await storeDuitkuCallbackSecurityEvent({
        eventType: "CALLBACK_INVALID_SIGNATURE",
        fields: parsed.fields,
        signatureState: "INVALID",
        rawBodyDigest: parsed.rawBodyDigest,
        fieldValuesDigest: parsed.fieldValuesDigest,
        context: requestContext(req),
      });
      return res.status(200).json({
        success: true,
        accepted: false,
        storedAsSecurityEvent: true,
        reason: parsed.merchantCodeMatchesConfig ? "INVALID_SIGNATURE" : "MERCHANT_CODE_MISMATCH",
      });
    }

    const stored = await storeValidDuitkuCallback(parsed, requestContext(req));
    return res.status(200).json({
      success: true,
      accepted: true,
      duplicate: stored.duplicate,
      bindingState: stored.bindingState,
      processingResult: stored.processingResult,
      financialMutationApplied: false,
    });
  } catch (error) {
    if (error instanceof DuitkuCallbackParseError) {
      await storeDuitkuCallbackSecurityEvent({
        eventType: error.statusCode === 413 ? "CALLBACK_OVERSIZED" : "CALLBACK_MALFORMED",
        fields: error.fields,
        signatureState: "NOT_CHECKED",
        rawBodyDigest: error.rawBodyDigest,
        fieldValuesDigest: error.fieldValuesDigest,
        context: requestContext(req),
      });
      return res.status(error.statusCode).json({
        success: false,
        message: error.reason,
      });
    }
    return next(error);
  }
});

router.use(
  async (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (error?.type === "entity.too.large" || error?.status === 413) {
      await storeDuitkuCallbackSecurityEvent({
        eventType: "CALLBACK_OVERSIZED",
        signatureState: "NOT_CHECKED",
        context: requestContext(req),
      });
      return res.status(413).json({
        success: false,
        message: "callback body exceeds 64 KiB",
      });
    }
    return next(error);
  }
);

export default router;
