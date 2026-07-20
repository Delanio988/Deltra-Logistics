"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importPackagesFromOx, syncCustomersToOx } from "@/lib/actions/ox-sync";
import MagneticButton from "@/components/ui/MagneticButton";
import Toast from "@/components/ui/Toast";

/** Both OX sync actions are manual/on-demand only — no scheduled job. */
export default function OxSyncPanel() {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setImportSummary(null);
    const result = await importPackagesFromOx();
    setIsImporting(false);

    if (!result.success) {
      setToastMessage(result.error);
      return;
    }
    setImportSummary(
      `Fetched ${result.totalFetched} · ${result.created} new · ${result.statusUpdated} status updates · ` +
        `${result.unmatchedMailbox} unmatched mailbox · ${result.invalidWeight} invalid weight · ${result.conflicts} conflicts`
    );
    router.refresh();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSummary(null);
    const result = await syncCustomersToOx();
    setIsSyncing(false);

    if (!result.success) {
      setToastMessage(result.error);
      return;
    }
    const failedText =
      result.failed.length > 0 ? ` · ${result.failed.length} failed (${result.failed.map((f) => f.name).join(", ")})` : "";
    setSyncSummary(`${result.synced}/${result.attempted} customers synced${failedText}`);
  };

  return (
    <div className="rounded-2xl border border-fg/8 bg-surface p-6 shadow-card sm:p-8">
      <h3 className="text-sm font-bold text-fg">Sync with Kajay Warehousing (OX)</h3>
      <p className="mt-1 text-xs text-fg/50">
        Both actions run on demand — nothing syncs automatically. Link a customer to their OX mailbox number below
        before either action can match their packages or profile.
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
          <p className="text-sm font-semibold text-fg">Import packages from OX</p>
          <p className="mt-1 text-xs text-fg/50">
            Pulls every OX package, matches it to a linked customer by mailbox number, and adds or updates it in
            Deltra.
          </p>
          <MagneticButton
            type="button"
            onClick={handleImport}
            disabled={isImporting}
            cursorLabel="Import"
            className="mt-3 border border-fg/15 text-fg hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {isImporting ? "Importing…" : "Import packages"}
          </MagneticButton>
          {importSummary && <p className="mt-3 text-xs text-fg/60">{importSummary}</p>}
        </div>

        <div className="flex-1 rounded-xl border border-fg/10 bg-fg/5 px-5 py-4">
          <p className="text-sm font-semibold text-fg">Sync customers to OX</p>
          <p className="mt-1 text-xs text-fg/50">
            Pushes every linked customer&rsquo;s name up to OX under their mailbox number.
          </p>
          <MagneticButton
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            cursorLabel="Sync"
            className="mt-3 border border-fg/15 text-fg hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {isSyncing ? "Syncing…" : "Sync customers"}
          </MagneticButton>
          {syncSummary && <p className="mt-3 text-xs text-fg/60">{syncSummary}</p>}
        </div>
      </div>

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
