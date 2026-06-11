import { useEffect, useRef, useState } from "react";
import {
  FileImage,
  LockKeyhole,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

const requiredComplete = (form) =>
  Boolean(
    String(form.accountName || "").trim() &&
      String(form.merchantName || "").trim() &&
      String(form.qrisImageUrl || "").trim()
  );

function Field({ label, hint, multiline = false, ...props }) {
  return (
    <label className="s26-pp-field">
      <span>{label}</span>
      {multiline ? <textarea {...props} /> : <input {...props} />}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export default function Seller2026PaymentProfileEditor({
  open,
  profile,
  canEdit,
  saving,
  submitting,
  uploading,
  mutationError,
  onClose,
  onSave,
  onSubmit,
  onUpload,
  onNotice,
}) {
  const inputRef = useRef(null);
  const [form, setForm] = useState(profile.form);

  useEffect(() => {
    setForm(profile.form);
  }, [profile.form]);

  if (!open) return null;

  const busy = saving || submitting || uploading;
  const locked = !canEdit || profile.governance.isReviewLocked;
  const setField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const url = await onUpload(file);
      setField("qrisImageUrl", url);
      onNotice({
        type: "success",
        message: "QRIS image uploaded. Save the draft or submit it to keep this request.",
      });
    } catch {
      // Mutation error is rendered below.
    }
  };

  return (
    <section className="s26-pp-editor" id="payment-profile-editor">
      <header>
        <div>
          <span>Seller request</span>
          <h2>Payment method editor</h2>
          <p>Changes stay outside checkout until Admin approves and activates them.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close editor">
          <X size={19} />
        </button>
      </header>

      {locked ? (
        <div className="s26-pp-notice is-warning">
          <LockKeyhole size={17} />
          <span>
            {profile.governance.lockReason ||
              profile.governance.note ||
              "This Payment Profile is currently read-only."}
          </span>
        </div>
      ) : null}

      {mutationError ? (
        <div className="s26-pp-notice is-error">{mutationError}</div>
      ) : null}

      <div className="s26-pp-editor__grid">
        <div className="s26-pp-upload-card">
          <div>
            <FileImage size={20} />
            <span>
              <strong>QRIS image</strong>
              <small>PNG or JPEG. Upload does not auto-save.</small>
            </span>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            hidden
            onChange={upload}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={locked || busy}
          >
            <Upload size={17} />
            {uploading ? "Uploading..." : "Upload QRIS"}
          </button>
          {form.qrisImageUrl ? (
            <img
              src={resolveAssetUrl(form.qrisImageUrl)}
              alt="Pending QRIS request preview"
            />
          ) : (
            <div className="s26-pp-upload-empty">
              <FileImage size={30} />
              <strong>No QRIS image selected</strong>
              <span>Upload an image or enter its URL.</span>
            </div>
          )}
        </div>

        <div className="s26-pp-editor__fields">
          <div className="s26-pp-editor__section">
            <h3>Required details</h3>
            <div className="s26-pp-form-grid">
              <Field
                label="Account name"
                value={form.accountName}
                disabled={locked || busy}
                onChange={(event) => setField("accountName", event.target.value)}
              />
              <Field
                label="Merchant name"
                value={form.merchantName}
                disabled={locked || busy}
                onChange={(event) => setField("merchantName", event.target.value)}
              />
              <Field
                label="QRIS image URL"
                value={form.qrisImageUrl}
                disabled={locked || busy}
                onChange={(event) => setField("qrisImageUrl", event.target.value)}
                hint="The image buyers will see after Admin approval."
              />
            </div>
          </div>

          <div className="s26-pp-editor__section">
            <h3>Optional details</h3>
            <div className="s26-pp-form-grid">
              <Field
                label="Merchant ID"
                value={form.merchantId}
                disabled={locked || busy}
                onChange={(event) => setField("merchantId", event.target.value)}
              />
              <Field
                label="QRIS payload"
                multiline
                rows={3}
                value={form.qrisPayload}
                disabled={locked || busy}
                onChange={(event) => setField("qrisPayload", event.target.value)}
              />
              <Field
                label="Instruction text"
                multiline
                rows={3}
                value={form.instructionText}
                disabled={locked || busy}
                onChange={(event) =>
                  setField("instructionText", event.target.value)
                }
              />
              <Field
                label="Seller note"
                multiline
                rows={3}
                value={form.sellerNote}
                disabled={locked || busy}
                onChange={(event) => setField("sellerNote", event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>
          Payment proofs are reviewed in Payment Review, not here.
        </p>
        <div>
          <button
            type="button"
            className="is-secondary"
            disabled={locked || busy}
            onClick={async () => {
              try {
                await onSave(form);
                onNotice({
                  type: "success",
                  message:
                    "Payment Profile draft saved. Checkout remains unchanged.",
                });
              } catch {
                // Mutation error is rendered above.
              }
            }}
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={locked || busy || !requiredComplete(form)}
            onClick={async () => {
              try {
                await onSubmit(form);
                onNotice({
                  type: "success",
                  message:
                    "Payment Profile submitted for Admin review. Checkout remains unchanged.",
                });
                onClose();
              } catch {
                // Mutation error is rendered above.
              }
            }}
          >
            <Send size={17} />
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        </div>
      </footer>
    </section>
  );
}
