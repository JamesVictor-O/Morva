"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import type { MerchantProduct } from "@/lib/types";

export function AddProductModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (product: MerchantProduct) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [details, setDetails] = useState("");

  function reset() {
    setName("");
    setPrice("");
    setStock("");
    setDetails("");
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 250);
  }

  function submit(status: "draft" | "listed") {
    if (!name.trim()) return;
    const stockNum = Math.max(0, parseInt(stock, 10) || 0);
    const priceNum = Math.max(0, parseFloat(price) || 0);

    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      meta: details.trim() || "—",
      priceUsd: priceNum,
      stock: stockNum,
      status: status === "draft" ? "draft" : stockNum > 0 ? "in-stock" : "out-of-stock",
    });
    handleClose();
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

        <div className="mt-5 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface py-9 text-center">
          <ImagePlus size={24} strokeWidth={1.6} className="text-ink-quiet" />
          <p className="text-[15px] font-semibold text-ink">Drop a photo, or browse</p>
          <p className="text-[13px] text-ink-faint">A clean shot on white works best</p>
        </div>

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

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => submit("draft")} className="px-6 py-3.5 text-[15px]">
            Save as draft
          </Button>
          <Button fullWidth onClick={() => submit("listed")} className="py-3.5 text-[15px]">
            Add to stall
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[14px] font-semibold text-ink">{children}</p>;
}
