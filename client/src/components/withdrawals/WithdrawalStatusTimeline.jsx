import { getWithdrawalTimeline } from "../../lib/withdrawalStatus.js";
import "./WithdrawalStatusTimeline.css";

const formatTimelineDate = (value, isId = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function WithdrawalStatusTimeline({ withdrawal, status, isId = false, compact = false }) {
  const steps = getWithdrawalTimeline(withdrawal || status, { isId });

  return (
    <ol className={`withdrawal-status-timeline ${compact ? "is-compact" : ""}`} aria-label={isId ? "Linimasa pencairan dana" : "Withdrawal timeline"}>
      {steps.map((step) => {
        const dateLabel = formatTimelineDate(step.timestamp, isId);
        return (
          <li className={`withdrawal-status-timeline__item is-${step.state} is-${step.tone}`} key={step.code}>
            <span className="withdrawal-status-timeline__dot" aria-hidden="true" />
            <span className="withdrawal-status-timeline__content">
              <strong>{step.label}</strong>
              {compact ? null : <small>{step.description}</small>}
              <em>{dateLabel || (isId ? "Belum tercatat" : "Not recorded yet")}</em>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
