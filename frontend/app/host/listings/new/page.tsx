"use client";

import { ListingForm, type ListingFormValues } from "@/components/host/ListingForm";
import { ErrorState } from "@/components/ui/ErrorState";
import { useCurrentUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { ApiError } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewListingPage() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) {
    return <ErrorState message="Pick a mock host in the account menu before creating a listing." />;
  }
  if (!currentUser.is_host) {
    return <ErrorState message="Switch to a host user (or become a host from the dashboard) to create listings." />;
  }

  const submit = async (values: ListingFormValues) => {
    setSaving(true);
    setError(null);
    try {
      await api.createListing(values);
      showToast("Listing published");
      router.push("/host");
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to create a listing."
          : err instanceof Error
            ? err.message
            : "Could not publish listing";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ListingForm
      submitLabel="Publish listing"
      onSubmit={submit}
      saving={saving}
      error={error}
    />
  );
}
