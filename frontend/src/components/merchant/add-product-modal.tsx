"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { createProduct } from "@/lib/actions/products";

export function AddProductModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after the product is actually persisted — the caller re-fetches
   *  (router.refresh()) rather than optimistically patching local state,
   *  since the derived stock/status now lives server-side. */
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [details, setDetails] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setPrice("");
    setStock("");
    setDetails("");
    setPhoto(null);
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setError(null);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 250);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  async function submit(status: "draft" | "listed") {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("meta", details.trim() || "—");
      formData.set("priceUsd", String(Math.max(0, parseFloat(price) || 0)));
      formData.set("stock", String(Math.max(0, parseInt(stock, 10) || 0)));
      formData.set("isDraft", String(status === "draft"));
      if (photo) formData.set("photo", photo);

      await createProduct(formData);
      onCreated();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that product. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="rounded-[28px] border border-border-soft bg-surface-solid p-7">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-semibold tracking-tight text-ink">Add a product</h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-fill transition-colors hover:bg-border-soft"
          >
            <X size={16} strokeWidth={1.8} className="text-ink-faint" />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-border-strong bg-surface py-9 text-center transition-colors hover:border-primary"
        >
          {photoPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreviewUrl} alt="Product photo preview" className="h-24 w-24 rounded-xl object-cover" />
          ) : (
            <>
              <ImagePlus size={24} strokeWidth={1.6} className="text-ink-quiet" />
              <p className="text-[15px] font-semibold text-ink">Drop a photo, or browse</p>
              <p className="text-[13px] text-ink-faint">A clean shot on white works best</p>
            </>
          )}
        </button>

        <div className="mt-5">
          <FieldLabel>Name</FieldLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Butter dish, lidded"
            className="w-full rounded-2xl border border-border bg-surface-solid px-[16px] py-[13px] text-[15px] text-ink outline-none focus:border-primary"
          />
        </div>

        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <FieldLabel>Price</FieldLabel>
            <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface-solid px-[16px] py-[13px] focus-within:border-primary">
              <span className="text-[15px] text-ink-faint">$</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="44.00"
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none"
              />
            </div>
          </div>
          <div className="flex-1">
            <FieldLabel>Starting stock</FieldLabel>
            <input
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="24"
              inputMode="numeric"
              className="w-full rounded-2xl border border-border bg-surface-solid px-[16px] py-[13px] text-[15px] text-ink outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-4">
          <FieldLabel>
            Details <span className="font-normal text-ink-faint">(optional)</span>
          </FieldLabel>
          <input
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder='6" · matte white · dishwasher safe'
            className="w-full rounded-2xl border border-border bg-surface-solid px-[16px] py-[13px] text-[15px] text-ink outline-none focus:border-primary"
          />
        </div>

        {error && <p className="mt-4 text-[13px] text-error-fg">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => submit("draft")} disabled={submitting} className="px-6 py-3.5 text-[15px]">
            Save as draft
          </Button>
          <Button fullWidth onClick={() => submit("listed")} disabled={submitting} className="py-3.5 text-[15px]">
            {submitting ? "Adding…" : "Add to stall"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[14px] font-semibold text-ink">{children}</p>;
}
