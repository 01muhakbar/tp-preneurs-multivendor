import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSellerWorkspace2026Team } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026Team.js";
import { Seller2026Shell } from "../../features/sellerWorkspace2026/components/Seller2026Shell.jsx";
import { Seller2026FallbackBanner } from "../../features/sellerWorkspace2026/components/Seller2026FallbackBanner.jsx";

export function Seller2026TeamPreviewPage({ productionMode = false }) {
  const { storeSlug } = useParams();
  const { 
    data, 
    loading, 
    error, 
    usingFallback, 
    selectedMemberId, 
    setSelectedMemberId,
    refetch
  } = useSellerWorkspace2026Team(storeSlug);

  if (error && !data) {
    return (
      <Seller2026Shell section="team">
        <div style={{ padding: "48px", textAlign: "center", color: "#ef4444" }}>
          <h2>Error Loading Team Data</h2>
          <p>{error.message || "Failed to load team information."}</p>
        </div>
      </Seller2026Shell>
    );
  }

  const selectedMember = useMemo(() => {
    return data?.members?.find(m => m.id === selectedMemberId) || null;
  }, [data?.members, selectedMemberId]);

  return (
    <Seller2026Shell section="team">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          {usingFallback && <Seller2026FallbackBanner compact message={productionMode ? "Live team data is unavailable. Showing fallback data." : undefined} />}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={refetch} style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", cursor: "pointer", fontWeight: 500 }}>
            Refresh
          </button>
          <button 
            disabled 
            title="Create Role disabled pending permission workflow validation."
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#fff", border: "1px solid #d1d5db", opacity: 0.5, cursor: "not-allowed", fontWeight: 500 }}
          >
            Create Role
          </button>
          <button 
            disabled 
            title="Invite Member disabled pending permission workflow validation."
            style={{ padding: "8px 16px", borderRadius: "8px", background: "#4f46e5", color: "#fff", border: "none", opacity: 0.5, cursor: "not-allowed", fontWeight: 500 }}
          >
            Invite Member
          </button>
        </div>
      </div>
      
      {/* Governance Note */}
      <div style={{ background: "#e0e7ff", border: "1px solid #c7d2fe", padding: "12px 16px", borderRadius: "8px", color: "#3730a3", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontWeight: 600 }}>ℹ️ Security Note:</span>
        Permissions shown here are informational. Backend permissions remain the final enforcement layer. Team mutations are currently disabled pending validation.
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px", marginBottom: "8px" }}>
        {[
          { label: "Total Members", val: data?.summary?.totalMembers },
          { label: "Pending Invites", val: data?.summary?.pendingInvites },
          { label: "Active Roles", val: data?.summary?.activeRoles },
          { label: "Recent Access Changes", val: data?.summary?.recentAccessChanges }
        ].map((stat, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#111827" }}>{stat.val}</div>
            <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
        
        {/* Main Area: Members & Roles */}
        <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
          
          {/* Members Table */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827" }}>Members</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>User</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Role</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Store Scope</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Last Active</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !data?.members?.length ? (
                    <tr><td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>Loading members...</td></tr>
                  ) : data?.members?.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: "32px", textAlign: "center", color: "#6b7280" }}>No members found</td></tr>
                  ) : (
                    data?.members?.map(member => (
                      <tr key={member.id} style={{ borderBottom: "1px solid #e5e7eb", background: selectedMemberId === member.id ? "#f3f4f6" : "#fff" }}>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{member.name}</div>
                          <div style={{ color: "#6b7280", fontSize: "12px" }}>{member.email}</div>
                        </td>
                        <td style={{ padding: "16px" }}>{member.roleLabel}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ 
                            padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 500,
                            background: member.status === "Active" ? "#d1fae5" : member.status === "Pending Invite" ? "#e0e7ff" : "#f3f4f6",
                            color: member.status === "Active" ? "#065f46" : member.status === "Pending Invite" ? "#3730a3" : "#4b5563"
                          }}>
                            {member.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px", color: "#4b5563" }}>{member.storeScope}</td>
                        <td style={{ padding: "16px", color: "#4b5563" }}>
                          {member.lastActiveAt ? new Date(member.lastActiveAt).toLocaleDateString() : '-'}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <button 
                            onClick={() => setSelectedMemberId(member.id === selectedMemberId ? null : member.id)}
                            style={{ background: "none", border: "1px solid #d1d5db", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permission Matrix */}
          <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#111827" }}>Role Permissions</h2>
              {data?.meta?.inferredPermissions && (
                <span style={{ fontSize: "12px", color: "#92400e", background: "#fef3c7", padding: "2px 8px", borderRadius: "4px" }}>
                  Inferred Matrix
                </span>
              )}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: "13px" }}>
                <thead style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563", textAlign: "left" }}>Module</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Owner</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Admin</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Staff</th>
                    <th style={{ padding: "12px 16px", fontWeight: 600, color: "#4b5563" }}>Support</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.permissionMatrix?.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "16px", fontWeight: 500, textAlign: "left", color: "#111827" }}>{row.module}</td>
                      <td style={{ padding: "16px" }}>{row.owner === "Allowed" ? "✅" : row.owner === "Limited" ? "⚠️" : "❌"}</td>
                      <td style={{ padding: "16px" }}>{row.admin === "Allowed" ? "✅" : row.admin === "Limited" ? "⚠️" : "❌"}</td>
                      <td style={{ padding: "16px" }}>{row.staff === "Allowed" ? "✅" : row.staff === "Limited" ? "⚠️" : "❌"}</td>
                      <td style={{ padding: "16px" }}>{row.support === "Allowed" ? "✅" : row.support === "Limited" ? "⚠️" : "❌"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Details & Audit Log */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {selectedMemberId && selectedMember ? (
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Member Details</h2>
                <button onClick={() => setSelectedMemberId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>×</button>
              </div>

              <div style={{ display: "grid", gap: "12px", fontSize: "13px" }}>
                <div><span style={{ color: "#6b7280" }}>Name:</span> <span style={{ fontWeight: 500 }}>{selectedMember.name}</span></div>
                <div><span style={{ color: "#6b7280" }}>Email:</span> <span style={{ fontWeight: 500 }}>{selectedMember.email}</span></div>
                <div><span style={{ color: "#6b7280" }}>Role:</span> <span style={{ fontWeight: 500 }}>{selectedMember.roleLabel}</span></div>
                <div><span style={{ color: "#6b7280" }}>Joined:</span> <span style={{ fontWeight: 500 }}>{selectedMember.joinedAt ? new Date(selectedMember.joinedAt).toLocaleDateString() : '-'}</span></div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button 
                  disabled
                  title="Mutation currently disabled pending validation"
                  style={{ padding: "8px", borderRadius: "6px", background: "#f3f4f6", color: "#9ca3af", border: "1px solid #e5e7eb", fontWeight: 600, cursor: "not-allowed", fontSize: "13px" }}
                >
                  Update Role
                </button>
                <button 
                  disabled
                  title="Destructive mutation currently disabled"
                  style={{ padding: "8px", borderRadius: "6px", background: "#fef2f2", color: "#fca5a5", border: "1px solid #fecaca", fontWeight: 600, cursor: "not-allowed", fontSize: "13px" }}
                >
                  Deactivate Member
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px" }}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#111827" }}>Audit Timeline</h3>
              
              {!data?.auditLogs?.length ? (
                <div style={{ color: "#6b7280", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>
                  No recent access changes found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {data.auditLogs.map(log => (
                    <div key={log.id} style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: log.severity === "critical" ? "#ef4444" : "#4f46e5", marginTop: "6px", flexShrink: 0 }}></div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: "11px", marginBottom: "2px" }}>
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontWeight: 500, color: "#111827", marginBottom: "2px" }}>{log.description}</div>
                        <div style={{ color: "#4b5563", fontSize: "12px" }}>By {log.actorName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      </div>
    </Seller2026Shell>
  );
}
