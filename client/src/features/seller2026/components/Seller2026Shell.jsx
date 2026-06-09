import "../Seller2026DesignSystem.css";

export default function Seller2026Shell({ children, className = "" }) {
  return (
    <div className={`s26-app ${className}`}>
      <main className="s26-main">{children}</main>
    </div>
  );
}
