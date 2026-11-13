"use client";

import { Shell } from "@/components/Shell";
import { InventoryPanel } from "@/components/InventoryPanel";

export default function InventoryPage() {
  return (
    <Shell>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold tracking-tight">Inventory</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add stock, or mark any variant instantly out of stock. Successful
          orders decrease stock automatically.
        </p>
      </div>
      <InventoryPanel />
    </Shell>
  );
}
