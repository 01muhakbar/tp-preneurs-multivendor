import { useState, useEffect, useCallback } from "react";
import { fetchSellerWorkspace2026Team } from "../adapters/sellerWorkspace2026TeamAdapter.js";
import { getTeamFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

export function useSellerWorkspace2026Team(storeSlug) {
  const [data, setData] = useState(getTeamFallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [actionState, setActionState] = useState({
    isUpdating: false,
    error: null,
    successMessage: null
  });

  const fetchData = useCallback(async () => {
    if (!storeSlug) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSellerWorkspace2026Team(storeSlug);
      setData(result);
    } catch (err) {
      console.error("Team Hook Error:", err);
      setError(err);
      const fallback = getTeamFallback();
      fallback.meta.usingLiveData = false;
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [storeSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    usingFallback: !data.meta.usingLiveData,
    selectedMemberId,
    setSelectedMemberId,
    refetch: fetchData,
    actions: {
      inviteMember: async () => {
        setActionState({ isUpdating: false, error: "Team mutations will be connected after permission workflow validation.", successMessage: null });
      },
      updateMemberRole: async () => {
        setActionState({ isUpdating: false, error: "Team mutations will be connected after permission workflow validation.", successMessage: null });
      },
      deactivateMember: async () => {
        setActionState({ isUpdating: false, error: "Member access changes require backend permission validation and confirmation.", successMessage: null });
      },
      resendInvite: async () => {
        setActionState({ isUpdating: false, error: "Team mutations will be connected after permission workflow validation.", successMessage: null });
      }
    },
    actionState
  };
}
