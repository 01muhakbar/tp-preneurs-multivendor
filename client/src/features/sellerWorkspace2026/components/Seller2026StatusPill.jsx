import React from "react";

export default function Seller2026StatusPill({ status, label, type = "status" }) {
  let colorClass = "seller2026-pill-gray";

  if (type === "usage") {
    if (status === "in_use") colorClass = "seller2026-pill-blue";
    else if (status === "unused") colorClass = "seller2026-pill-gray";
  } else if (type === "type") {
    if (status === "dropdown") colorClass = "seller2026-pill-blue";
    else if (status === "text") colorClass = "seller2026-pill-purple";
    else colorClass = "seller2026-pill-gray";
  } else {
    // Status
    if (status === "published" || status === "active" || status === "visible") {
      colorClass = "seller2026-pill-green";
    } else if (status === "draft" || status === "inactive" || status === "hidden") {
      colorClass = "seller2026-pill-amber"; // Or gray depending on exact design
    }
  }

  return (
    <span className={`seller2026-pill ${colorClass}`}>
      {label || status}
    </span>
  );
}
