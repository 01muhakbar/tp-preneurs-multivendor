import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  FileImage,
  Pencil,
  QrCode,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import Seller2026PaymentProfileEditor from "../../components/seller2026/paymentProfile/Seller2026PaymentProfileEditor.jsx";
import { useSeller2026PaymentProfile } from "../../hooks/seller2026/useSeller2026PaymentProfile.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/Seller2026PaymentProfile.css";

const display = (value, fallback = "Not provided") =>
  String(value || "").trim() || fallback;

const dateTime = (value) => {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not reviewed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toneForStatus = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (
    normalized.includes("ACTIVE") ||
    normalized.includes("APPROVED") ||
    normalized.includes("VERIFIED")
  ) {
    return "green";
  }
  if (normalized.includes("REJECT") || normalized.includes("REVISION")) {
    return "red";
  }
  if (normalized.includes("PENDING") || normalized.includes("SUBMITTED")) {
    return "amber";
  }
  return "slate";
};

function StatusChip({ children, tone = "slate" }) {
  return <span className={`s26-pp-chip is-${tone}`}>{children}</span>;
}

function Detail({ icon: Icon, label, value, chip }) {
  return (
    <div className="s26-pp-detail">
      <span><Icon size={17} /></span>
      <dt>{label}</dt>
      <dd>{chip || value}</dd>
    </div>
  );
}

export default function Seller2026LivePaymentProfilePage() {
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("STORE_PAYMENT_PROFILE_READ");
  const permissionCanEdit = can("STORE_PAYMENT_PROFILE_SUBMIT");
  const profileQuery = useSeller2026PaymentProfile(storeId, {
    enabled: canView,
    canEdit: permissionCanEdit,
  });
  const { data: profile } = profileQuery;
  const [editorOpen, setEditorOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (
      !profileQuery.isLoading &&
      !profile.checkoutReady &&
      profile.governance.canEdit &&
      !profile.governance.isReviewLocked
    ) {
      setEditorOpen(true);
    }
  }, [
    profile.checkoutReady,
    profile.governance.canEdit,
    profile.governance.isReviewLocked,
    profileQuery.isLoading,
  ]);

  if (!canView) {
    return (
      <main className="s26-pp">
        <div className="s26-pp-state">
          <ShieldCheck size={34} />
          <h1>Payment Profile access is unavailable</h1>
          <p>Your seller role cannot view payment setup for this store.</p>
        </div>
      </main>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <main className="s26-pp">
        <div className="s26-pp-skeleton is-heading" />
        <div className="s26-pp-kpis">
          {[0, 1, 2, 3].map((item) => (
            <div className="s26-pp-skeleton is-card" key={item} />
          ))}
        </div>
        <div className="s26-pp-skeleton is-content" />
      </main>
    );
  }

  if (profileQuery.isError) {
    return (
      <main className="s26-pp">
        <div className="s26-pp-state">
          <AlertTriangle size={34} />
          <h1>Payment Profile could not load</h1>
          <p>{profileQuery.error?.message || "Try loading the store setup again."}</p>
          <button type="button" onClick={() => profileQuery.refetch()}>
            Retry
          </button>
        </div>
      </main>
    );
  }

  const active = profile.activeSnapshot;
  const previewUrl = resolveAssetUrl(
    active?.qrisImageUrl || profile.form.qrisImageUrl
  );
  const reviewDate = profile.review.reviewedAt || profile.updatedAt;
  const canEdit = profileQuery.canEdit;
  const readinessTitle = profile.checkoutReady
    ? "Checkout is ready"
    : profile.requestStatus.isSubmitted
      ? "Checkout setup is under review"
      : "Checkout setup needs review";
  const readinessDescription = profile.checkoutReady
    ? "Your active approved QRIS is available to buyers at checkout."
    : profile.requestStatus.isSubmitted
      ? "Admin is reviewing the submitted request. The active checkout setup is unchanged."
      : "Complete the required request fields and submit them for Admin approval.";

  return (
    <main className="s26-pp">
      <div className="s26-pp-breadcrumb">
        <span>Finance</span><i>/</i><strong>Payment Profile</strong>
      </div>

      <header className="s26-pp-header">
        <div>
          <h1>Payment profile</h1>
          <p>Manage your QRIS payment and checkout setup.</p>
        </div>
        <div>
          <StatusChip tone={profile.checkoutReady ? "green" : "amber"}>
            {profile.checkoutReady ? "Active" : profile.requestStatus.label}
          </StatusChip>
          <span>Last updated {dateTime(profile.updatedAt)}</span>
        </div>
      </header>

      {notice ? (
        <div className={`s26-pp-notice is-${notice.type}`}>
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notice.message}</span>
        </div>
      ) : null}

      <section className={`s26-pp-readiness ${profile.checkoutReady ? "is-ready" : ""}`}>
        <span>
          {profile.checkoutReady ? <Check size={23} /> : <Clock3 size={23} />}
        </span>
        <div>
          <strong>{readinessTitle}</strong>
          <p>{readinessDescription}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (profile.checkoutReady) {
              document
                .getElementById("approved-payment-profile")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              setEditorOpen(true);
            }
          }}
        >
          {profile.checkoutReady ? "View approved setup" : "Review setup"}
          <ExternalLink size={16} />
        </button>
      </section>

      <section className="s26-pp-kpis">
        <article>
          <span className={profile.checkoutReady ? "is-green" : "is-amber"}>
            <CreditCard size={25} />
          </span>
          <div>
            <small>Checkout status</small>
            <strong>{profile.checkoutStatus}</strong>
            <p>{profile.checkoutReady ? "Buyers can pay with QRIS" : "Awaiting approved setup"}</p>
          </div>
        </article>
        <article>
          <span className="is-blue"><QrCode size={25} /></span>
          <div>
            <small>Payment method</small>
            <strong>{active?.paymentTypeLabel || "Static QRIS"}</strong>
            <p>QR shown at checkout</p>
          </div>
        </article>
        <article>
          <span className={profile.checkoutReady ? "is-green" : "is-amber"}>
            <ShieldCheck size={25} />
          </span>
          <div>
            <small>Admin approval</small>
            <strong>{profile.review.label}</strong>
            <p>Admin remains final authority</p>
          </div>
        </article>
        <article>
          <span className="is-violet"><Clock3 size={25} /></span>
          <div>
            <small>Last review</small>
            <strong>{dateTime(reviewDate).split(",")[0]}</strong>
            <p>{dateTime(reviewDate).includes(",") ? dateTime(reviewDate).split(",").slice(1).join(",").trim() : "No review recorded"}</p>
          </div>
        </article>
      </section>

      <section className="s26-pp-progress">
        <h2>Setup progress</h2>
        <div>
          {profile.progress.map((step, index) => (
            <article className={step.complete ? "is-complete" : ""} key={step.key}>
              <i>{step.complete ? <Check size={16} /> : index + 1}</i>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <div className="s26-pp-main" id="approved-payment-profile">
        <section className="s26-pp-panel s26-pp-preview">
          <header>
            <div>
              <h2>QRIS Preview</h2>
              <p>This approved QRIS is used by buyers at checkout.</p>
            </div>
            {previewUrl ? (
              <a href={previewUrl} download target="_blank" rel="noreferrer">
                <Download size={17} /> Download QRIS
              </a>
            ) : null}
          </header>
          {previewUrl ? (
            <div className="s26-pp-preview__image">
              <img src={previewUrl} alt="Store QRIS payment setup" />
            </div>
          ) : (
            <div className="s26-pp-preview__empty">
              <FileImage size={36} />
              <strong>No QRIS image available</strong>
              <span>Add a QRIS image in the seller request editor.</span>
            </div>
          )}
        </section>

        <div className="s26-pp-side">
          <section className="s26-pp-panel">
            <header>
              <div>
                <h2>Payment details</h2>
                <p>Checkout reads only the active approved snapshot.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                disabled={!canEdit}
                title={!canEdit ? profile.governance.lockReason || profile.governance.note || "Read-only access" : ""}
              >
                <Pencil size={16} /> Edit
              </button>
            </header>
            <dl className="s26-pp-details">
              <Detail icon={QrCode} label="Payment type" value={active?.paymentTypeLabel || "Static QRIS"} />
              <Detail icon={Store} label="Merchant name" value={display(active?.merchantName || profile.form.merchantName)} />
              <Detail icon={UserRound} label="Account name" value={display(active?.accountName || profile.form.accountName)} />
              <Detail icon={Store} label="Store" value={display(profile.store.name || sellerContext?.store?.name)} />
              <Detail icon={BadgeCheck} label="QRIS merchant ID" value={display(active?.merchantId || profile.form.merchantId)} />
              <Detail
                icon={CheckCircle2}
                label="Status"
                chip={
                  <StatusChip tone={profile.checkoutReady ? "green" : "amber"}>
                    {profile.checkoutReady ? "Active" : profile.requestStatus.label}
                  </StatusChip>
                }
              />
            </dl>
          </section>

          <section className="s26-pp-panel s26-pp-review">
            <header>
              <div>
                <h2>Review status</h2>
                <p>Seller request and Admin decision history.</p>
              </div>
              <StatusChip tone={toneForStatus(profile.review.code)}>
                {profile.review.label}
              </StatusChip>
            </header>
            <dl>
              <div><dt>Required fields</dt><dd>{profile.completeness.completedFields}/{profile.completeness.totalFields}</dd></div>
              <div><dt>Submitted</dt><dd>{dateTime(profile.review.submittedAt)}</dd></div>
              <div><dt>Reviewed</dt><dd>{dateTime(profile.review.reviewedAt)}</dd></div>
              <div><dt>Missing</dt><dd>{profile.completeness.missingFields.map((field) => field.label).join(", ") || "None"}</dd></div>
            </dl>
            {profile.review.note ? <blockquote>{profile.review.note}</blockquote> : null}
            <p className="s26-pp-boundary">
              Payment proofs are reviewed in Payment Review, not here.
            </p>
          </section>

          <section className="s26-pp-panel s26-pp-authority">
            <ShieldCheck size={22} />
            <div>
              <h2>Checkout authority</h2>
              <p>
                Sellers prepare a store-scoped request. Admin controls approval and activation,
                and buyer checkout continues using only the active approved setup.
              </p>
            </div>
          </section>
        </div>
      </div>

      <Seller2026PaymentProfileEditor
        open={editorOpen}
        profile={profile}
        canEdit={canEdit}
        saving={profileQuery.saving}
        submitting={profileQuery.submitting}
        uploading={profileQuery.uploading}
        mutationError={
          profileQuery.saveError ||
          profileQuery.submitError ||
          profileQuery.uploadError
        }
        onClose={() => setEditorOpen(false)}
        onSave={profileQuery.saveDraft}
        onSubmit={profileQuery.submitForReview}
        onUpload={profileQuery.uploadQris}
        onNotice={setNotice}
      />
    </main>
  );
}
