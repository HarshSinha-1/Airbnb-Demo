"use client";

import { ListingForm, type ListingFormValues } from "@/components/host/ListingForm";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { ApiError, type ListingDetail } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { showToast } = useToast();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid listing");
      setLoading(false);
      return;
    }
    api
      .getListing(id)
      .then(setListing)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load listing"))
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (values: ListingFormValues) => {
    setSaving(true);
    setFormError(null);
    try {
      await api.updateListing(id, values);
      showToast("Changes saved");
      router.push("/host");
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to edit this listing."
          : err instanceof Error
            ? err.message
            : "Could not save changes";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.deleteListing(id);
      showToast("Listing deleted");
      router.push("/host");
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 403
          ? "You don't have permission to delete this listing."
          : err instanceof Error
            ? err.message
            : "Could not delete listing";
      showToast(message, "error");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[760px] py-16">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-8 h-40" />
      </div>
    );
  }

  if (error || !listing) {
    return <ErrorState message={error ?? "Listing not found"} />;
  }

  return (
    <>
      <ListingForm
        initial={listing}
        submitLabel="Save changes"
        onSubmit={submit}
        onDelete={() => setConfirmDelete(true)}
        saving={saving}
        error={formError}
      />
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this listing?"
        width="max-w-[440px]"
        footer={
          <>
            <button type="button" className="font-semibold underline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <Button variant="danger" disabled={deleting} onClick={() => void remove()}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-text-secondary">
          This action can&apos;t be undone. Guests will no longer be able to find this listing.
        </p>
      </Modal>
    </>
  );
}
