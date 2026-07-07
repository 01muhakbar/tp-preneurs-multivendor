import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAddress,
  deleteAddress,
  getDefaultAddress,
  listAddresses,
  updateAddress,
} from "../../api/userAddresses.ts";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../utils/idRegions.ts";
import AccountShippingAddress2026View from "./AccountShippingAddress2026View.jsx";
import {
  buildShippingAddressPayloadFrom2026Form,
  getEmptyShippingAddress2026,
  getShippingAddress2026FormFromAddress,
  normalizeShippingAddressesFor2026,
  validateShippingAddress2026Form,
} from "./accountShippingAddress2026Adapter.js";

const EMPTY_FIELD_ERRORS = {
  firstName: "",
  lastName: "",
  emailAddress: "",
  phoneNumber: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  streetName: "",
  houseNumber: "",
};

const getRequestMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function AccountShippingAddressPage() {
  const queryClient = useQueryClient();
  const { user: accountUser } = useOutletContext() || {};
  const accountEmail = String(accountUser?.email || "").trim();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("saved");
  const [formState, setFormState] = useState(() =>
    getEmptyShippingAddress2026(accountEmail)
  );
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS);
  const [status, setStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const addressesQuery = useQuery({
    queryKey: ["user", "addresses"],
    queryFn: listAddresses,
    retry: false,
  });
  const defaultAddressQuery = useQuery({
    queryKey: ["user", "addresses", "default"],
    queryFn: () => getDefaultAddress().catch(() => null),
    retry: false,
  });

  const addressList = Array.isArray(addressesQuery.data) ? addressesQuery.data : [];
  const defaultAddress =
    defaultAddressQuery.data ||
    addressList.find((item) => Boolean(item?.isPrimary)) ||
    null;
  const provinceOptions = useMemo(
    () => getProvinceOptions(formState.province),
    [formState.province]
  );
  const cityOptions = useMemo(
    () => getCityOptions(formState.province, formState.city),
    [formState.province, formState.city]
  );
  const districtOptions = useMemo(
    () => getDistrictOptions(formState.province, formState.city, formState.district),
    [formState.province, formState.city, formState.district]
  );
  const normalized = useMemo(
    () =>
      normalizeShippingAddressesFor2026({
        user: accountUser,
        profile: accountUser,
        addresses: addressList,
        defaultAddress,
        draft: formState,
        provinces: provinceOptions,
        cities: cityOptions,
        districts: districtOptions,
      }),
    [
      accountUser,
      addressList,
      cityOptions,
      defaultAddress,
      districtOptions,
      formState,
      provinceOptions,
    ]
  );
  const isLoading = addressesQuery.isLoading || defaultAddressQuery.isLoading;
  const error = addressesQuery.isError
    ? getRequestMessage(addressesQuery.error, "Failed to load addresses.")
    : "";

  const refetchAddresses = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user", "addresses"] }),
      queryClient.invalidateQueries({ queryKey: ["user", "addresses", "default"] }),
    ]);
  };

  const clearIdParam = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("id");
      return next;
    });
  };

  const resetForm = (nextTab = "saved") => {
    setFormState(getEmptyShippingAddress2026(accountEmail));
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setStatus(null);
    clearIdParam();
    setActiveTab(nextTab);
  };

  useEffect(() => {
    if (!accountEmail) return;
    setFormState((prev) => ({ ...prev, emailAddress: accountEmail }));
  }, [accountEmail]);

  useEffect(() => {
    if (isLoading) return;
    const idParam = Number(searchParams.get("id"));
    if (!Number.isFinite(idParam) || idParam <= 0 || formState.id === idParam) return;
    const target = addressList.find((item) => Number(item.id) === idParam);
    if (!target) return;
    setFormState(getShippingAddress2026FormFromAddress(target, accountEmail));
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setStatus(null);
    setActiveTab("form");
  }, [accountEmail, addressList, formState.id, isLoading, searchParams]);

  const handleFormChange = (field, value) => {
    setStatus(null);
    setFieldErrors((prev) => {
      const next = { ...prev, [field]: "" };
      if (field === "province") {
        next.city = "";
        next.district = "";
      }
      if (field === "city") next.district = "";
      return next;
    });
    setFormState((prev) => {
      if (field === "province") {
        return {
          ...prev,
          province: String(value || ""),
          city: "",
          district: "",
        };
      }
      if (field === "city") {
        return {
          ...prev,
          city: String(value || ""),
          district: "",
        };
      }
      if (field === "postalCode") {
        return {
          ...prev,
          postalCode: String(value || "").replace(/\D/g, "").slice(0, 5),
        };
      }
      return {
        ...prev,
        [field]: typeof value === "boolean" ? value : String(value || ""),
      };
    });
  };

  const handleFocusForm = () => {
    setActiveTab("form");
  };

  const handleEditAddress = (item) => {
    const id = Number(item?.id || 0);
    if (!id) return;
    setFormState(getShippingAddress2026FormFromAddress(item, accountEmail));
    setFieldErrors(EMPTY_FIELD_ERRORS);
    setStatus(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("id", String(id));
      return next;
    });
    setActiveTab("form");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    const validation = validateShippingAddress2026Form(formState);
    setFieldErrors(validation.errors);
    if (!validation.isValid) {
      setStatus({ type: "error", message: "Please complete required fields correctly." });
      setActiveTab("form");
      return;
    }

    const payload = buildShippingAddressPayloadFrom2026Form(formState);
    setIsSaving(true);
    try {
      if (formState.id) {
        await updateAddress(Number(formState.id), payload);
        setStatus({ type: "success", message: "Address updated successfully." });
      } else {
        await createAddress(payload);
        setStatus({ type: "success", message: "Address created successfully." });
      }
      await refetchAddresses();
      setFormState(getEmptyShippingAddress2026(accountEmail));
      setFieldErrors(EMPTY_FIELD_ERRORS);
      clearIdParam();
      setActiveTab("saved");
    } catch (requestError) {
      setStatus({
        type: "error",
        message: getRequestMessage(requestError, "Failed to save address."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (item) => {
    const id = Number(item?.id || 0);
    if (!id) return;
    if (item?.isPrimary || id === Number(defaultAddress?.id)) {
      setStatus({
        type: "error",
        message: "Cannot delete default shipping address. Please set another address as default first.",
      });
      return;
    }
    setStatus(null);
    setIsSaving(true);
    try {
      await deleteAddress(id);
      await refetchAddresses();
      if (Number(formState.id) === id) {
        setFormState(getEmptyShippingAddress2026(accountEmail));
        clearIdParam();
      }
      setStatus({ type: "success", message: "Address deleted successfully." });
      setActiveTab("saved");
    } catch (requestError) {
      setStatus({
        type: "error",
        message: getRequestMessage(requestError, "Failed to delete address."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMakePrimary = async (item) => {
    const id = Number(item?.id || 0);
    if (!id) return;
    const primaryForm = getShippingAddress2026FormFromAddress(item, accountEmail);
    const payload = buildShippingAddressPayloadFrom2026Form({
      ...primaryForm,
      isPrimary: true,
    });
    setStatus(null);
    setIsSaving(true);
    try {
      await updateAddress(id, payload);
      await refetchAddresses();
      setStatus({ type: "success", message: "Primary shipping address updated." });
      setActiveTab("saved");
    } catch (requestError) {
      setStatus({
        type: "error",
        message: getRequestMessage(requestError, "Failed to update primary address."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AccountShippingAddress2026View
      account={normalized.account}
      addresses={normalized.addresses}
      form={formState}
      fieldErrors={fieldErrors}
      provinceOptions={normalized.provinceOptions}
      cityOptions={normalized.cityOptions}
      districtOptions={normalized.districtOptions}
      activeTab={activeTab}
      isLoading={isLoading}
      isSaving={isSaving}
      error={error}
      status={status}
      LinkComponent={Link}
      onTabChange={setActiveTab}
      onFocusForm={handleFocusForm}
      onResetForm={resetForm}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
      onEditAddress={handleEditAddress}
      onDeleteAddress={handleDeleteAddress}
      onMakePrimary={handleMakePrimary}
    />
  );
}
