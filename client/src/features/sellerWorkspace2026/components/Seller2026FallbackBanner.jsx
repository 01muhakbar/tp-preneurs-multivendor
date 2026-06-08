export function Seller2026FallbackBanner({ 
  message = "Live API Unavailable. Showing preview fallback data.", 
  compact = false 
}) {
  if (compact) {
    return (
      <span style={{
        display: "inline-block", background: "#fef3c7", color: "#92400e",
        padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500, marginTop: "8px"
      }}>
        {message}
      </span>
    );
  }

  return (
    <div style={{
      background: "#fef3c7", 
      color: "#92400e",
      padding: "12px 16px", 
      borderRadius: "8px", 
      fontSize: "13px", 
      fontWeight: 500, 
      marginBottom: "24px",
      border: "1px solid #fde68a",
      display: "flex",
      alignItems: "center",
      gap: "8px"
    }}>
      <span aria-hidden="true">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
