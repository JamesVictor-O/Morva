"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Topbar } from "@/components/layout/topbar";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { AddProductModal } from "@/components/merchant/add-product-modal";
import { updateProductPrice, restockProduct } from "@/lib/actions/products";
import type { Accent, MerchantProduct, MerchantProductStatus } from "@/lib/types";

const STATUS_LABEL: Record<MerchantProductStatus, string> = {
  "in-stock": "In stock",
  "low-stock": "Low",
  "out-of-stock": "Out of stock",
  draft: "Draft — not listed",
};

const DEFAULT_RESTOCK = 20;
const RESTOCK_STEP = 10;

export function ProductsPageClient({
  products,
  stallInitial,
  stallAccent,
}: {
  products: MerchantProduct[];
  stallInitial: string;
  stallAccent: Accent;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [restockAmounts, setRestockAmounts] = useState<Record<string, number>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const lowCount = products.filter((p) => p.status === "low-stock").length;
  const outCount = products.filter((p) => p.status === "out-of-stock").length;

  function startEdit(product: MerchantProduct) {
    setEditingId(product.id);
    setDraftPrice(product.priceUsd.toFixed(2));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    const parsed = parseFloat(draftPrice);
    setEditingId(null);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setPendingId(id);
    try {
      await updateProductPrice(id, parsed);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  function restockAmountFor(id: string): number {
    return restockAmounts[id] ?? DEFAULT_RESTOCK;
  }

  function adjustRestock(id: string, delta: number) {
    setRestockAmounts((prev) => ({
      ...prev,
      [id]: Math.max(RESTOCK_STEP, restockAmountFor(id) + delta),
    }));
  }

  async function commitRestock(id: string) {
    const amount = restockAmountFor(id);
    setPendingId(id);
    try {
      await restockProduct(id, amount);
      setRestockAmounts((prev) => ({ ...prev, [id]: DEFAULT_RESTOCK }));
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AppShell variant="merchant">
      <Topbar
        left={<p className="text-[20px] font-semibold text-ink">Products</p>}
        right={
          <>
            <Button onClick={() => setAddOpen(true)} className="px-5 py-2.5 text-[14px]">
              <Plus size={16} strokeWidth={2} />
              Add product
            </Button>
            <AvatarTile label={stallInitial} accent={stallAccent} size="lg" className="rounded-full" />
          </>
        }
      />

      <main className="px-5 py-8 sm:px-8 lg:px-[34px] lg:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[15px] text-ink-faint">{products.length} products</p>
          {lowCount > 0 && <StatusPill tone="warning">{lowCount} low</StatusPill>}
          {outCount > 0 && <StatusPill tone="error">{outCount} out of stock</StatusPill>}
        </div>

        <div className="mt-5 rounded-[26px] border border-border-soft bg-surface-solid">
          <div className="hidden gap-4 px-6 pt-5 text-[13px] text-ink-faint sm:flex">
            <span className="w-[60px] flex-none" />
            <span className="flex-1">Product</span>
            <span className="w-[110px] flex-none">Price</span>
            <span className="w-[200px] flex-none">Stock</span>
          </div>

          <div className="px-6">
            {products.map((product, i) => (
              <ProductRow
                key={product.id}
                product={product}
                withDivider={i > 0}
                editing={editingId === product.id}
                pending={pendingId === product.id}
                draftPrice={draftPrice}
                onDraftPriceChange={setDraftPrice}
                onStartEdit={() => startEdit(product)}
                onCancelEdit={cancelEdit}
                onSaveEdit={() => saveEdit(product.id)}
                restockAmount={restockAmountFor(product.id)}
                onAdjustRestock={(delta) => adjustRestock(product.id, delta)}
                onCommitRestock={() => commitRestock(product.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={() => router.refresh()} />
    </AppShell>
  );
}

function ProductRow({
  product,
  withDivider,
  editing,
  pending,
  draftPrice,
  onDraftPriceChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  restockAmount,
  onAdjustRestock,
  onCommitRestock,
}: {
  product: MerchantProduct;
  withDivider: boolean;
  editing: boolean;
  pending: boolean;
  draftPrice: string;
  onDraftPriceChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  restockAmount: number;
  onAdjustRestock: (delta: number) => void;
  onCommitRestock: () => void;
}) {
  const needsRestock = product.status === "low-stock" || product.status === "out-of-stock";
  const tone =
    product.status === "in-stock" ? "success" : product.status === "low-stock" ? "warning" : product.status === "out-of-stock" ? "error" : "neutral";
  const stockLabel =
    product.status === "low-stock" ? `${STATUS_LABEL[product.status]} · ${product.stock} left` : STATUS_LABEL[product.status];

  return (
    <div className={`flex flex-wrap items-center gap-4 py-4 ${withDivider ? "border-t border-divider" : ""} ${pending ? "opacity-60" : ""}`}>
      <div className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl bg-fill font-mono text-[11px] text-ink-quiet">
        shot
      </div>

      <div className="min-w-[160px] flex-1">
        <p className={`truncate text-[16px] font-semibold ${product.status === "draft" ? "text-ink-faint" : "text-ink"}`}>
          {product.name}
        </p>
        <p className="truncate text-[13px] text-ink-faint">{product.meta}</p>
      </div>

      <div className="w-[110px] flex-none">
        {editing ? (
          <div className="flex items-center gap-1 rounded-xl border border-primary px-3 py-2">
            <span className="text-[14px] text-ink-faint">$</span>
            <input
              autoFocus
              value={draftPrice}
              onChange={(e) => onDraftPriceChange(e.target.value)}
              inputMode="decimal"
              className="w-full min-w-0 bg-transparent text-[15px] font-semibold text-ink outline-none"
            />
          </div>
        ) : (
          <p className="text-[16px] font-semibold text-ink">${product.priceUsd.toFixed(2)}</p>
        )}
      </div>

      <div className="flex w-full flex-none items-center gap-2.5 sm:w-[200px]">
        {product.status !== "draft" && (
          <span className="text-[15px] font-semibold text-ink">{product.stock}</span>
        )}
        <StatusPill tone={tone}>{stockLabel}</StatusPill>
      </div>

      {needsRestock && (
        <div className="flex flex-none items-center gap-1 rounded-full border border-border bg-surface-solid px-1.5 py-1.5">
          <button
            onClick={() => onAdjustRestock(-10)}
            aria-label="Decrease restock amount"
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-fill"
          >
            <Minus size={13} strokeWidth={2} />
          </button>
          <span className="min-w-[38px] text-center text-[13px] font-semibold text-ink">
            +{restockAmount}
          </span>
          <button
            onClick={() => onAdjustRestock(10)}
            aria-label="Increase restock amount"
            className="flex h-6 w-6 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-fill"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      <div className="ml-auto flex flex-none items-center gap-4">
        {editing ? (
          <>
            <button onClick={onCancelEdit} className="text-[14px] text-ink-faint">
              Cancel
            </button>
            <button onClick={onSaveEdit} className="text-[14px] font-semibold text-primary">
              Save
            </button>
          </>
        ) : needsRestock ? (
          <button onClick={onCommitRestock} disabled={pending} className="text-[14px] font-semibold text-ink">
            Restock
          </button>
        ) : (
          <button onClick={onStartEdit} className="text-[14px] text-ink-faint">
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
