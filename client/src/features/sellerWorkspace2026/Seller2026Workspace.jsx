import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSellerWorkspace2026Overview } from "./hooks/useSellerWorkspace2026Overview.js";
import { useSellerWorkspace2026StoreProfile } from "./hooks/useSellerWorkspace2026StoreProfile.js";
import Seller2026Workspace from "../seller2026/Seller2026Workspace.jsx"; // fallback to existing component for other sections

/**
 * Preview version of Seller2026Workspace that wires live data hooks for Overview and Store Profile.
 * Props match the original component: { section, mode, storeContext }.
 * For sections other than dashboard/storefront, it delegates to the original workspace component.
 */
export default function Seller2026WorkspacePreview({ section = "dashboard", mode = "standalone", storeContext = null, productionMode = false }) {
  const { storeSlug } = useParams(); // may be undefined in preview routes
  const overviewStoreSlug = section === "dashboard" ? storeSlug : null;
  const storeProfileSlug = section === "storefront" ? storeSlug : null;

  // Overview hook
  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    usingFallback: overviewUsingFallback,
    refetch: overviewRefetch,
  } = useSellerWorkspace2026Overview(overviewStoreSlug);

  const {
    data: storeProfileData,
    form: storeProfileForm,
    setForm: storeProfileSetForm,
    loading: storeProfileLoading,
    saving: storeProfileSaving,
    error: storeProfileError,
    saveResult: storeProfileSaveResult,
    usingFallback: storeProfileUsingFallback,
    validation: storeProfileValidation,
    saveProfile: storeProfileSaveProfile,
    refetch: storeProfileRefetch,
  } = useSellerWorkspace2026StoreProfile(storeProfileSlug);

  // Determine which data/state to pass based on section
  const dashboardProps = section === "dashboard"
    ? {
        dashboardData: overviewData,
        dashboardState: {
          isLoading: overviewLoading,
          isError: !!overviewError,
          error: overviewError,
          refetch: overviewRefetch,
        },
      }
    : {};

      const storefrontProps = section === "storefront"
    ? {
        storefrontData: storeProfileData,
        storefrontForm: storeProfileForm,
        storefrontState: {
          isLoading: storeProfileLoading,
          isSaving: storeProfileSaving,
          isError: !!storeProfileError,
          error: storeProfileError,
          saveResult: storeProfileSaveResult,
          usingFallback: storeProfileUsingFallback,
          validation: storeProfileValidation,
          refetch: storeProfileRefetch,
        },
        storefrontMutation: {
          canUpdate: !storeProfileUsingFallback,
          isSubmitting: storeProfileSaving,
          submit: async (payload) => {
            await storeProfileSaveProfile(payload);
          },
          error: storeProfileError || (storeProfileSaveResult?.success === false ? storeProfileSaveResult : null),
        },
      }
    : {};

  // Render the original workspace with injected props for the relevant sections.
  return (
    <Seller2026Workspace
      section={section}
      mode={mode}
      storeContext={storeContext}
      productionMode={productionMode}
      {...dashboardProps}
      {...storefrontProps}
    />
  );
}
