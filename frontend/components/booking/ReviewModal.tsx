"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/types";
import { StarIcon } from "@/components/ui/Icons";

export function ReviewModal({
  bookingId,
  open,
  onClose,
  onSuccess
}: {
  bookingId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      showToast("Please provide a comment", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.createReview({ booking_id: bookingId, rating, comment });
      showToast("Review submitted successfully");
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showToast("You've already reviewed this stay.", "error");
        onClose(); // Automatically close the modal when it's a duplicate
      } else {
        const message = err instanceof Error ? err.message : "Could not submit review";
        showToast(message, "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Leave a review"
      width="max-w-[440px]"
      footer={
        <>
          <button type="button" className="font-semibold underline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <Button disabled={submitting || !comment.trim()} onClick={() => void handleSubmit()}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <StarIcon className={`h-8 w-8 ${star <= rating ? "text-text-primary" : "text-border-default"}`} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Comment</label>
          <textarea
            className="w-full rounded-lg border border-border-strong p-3 min-h-[120px]"
            placeholder="How was your stay?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
