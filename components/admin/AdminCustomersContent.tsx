"use client";

import { useMemo, useState } from "react";
import type { CustomerWithStats } from "@/lib/customers-data";
import ContactLinks from "@/components/admin/ContactLinks";

type SortKey = "name" | "accountCode" | "packageCount";

function SortButton({
  label,
  sortKey,
  activeKey,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor-hover="Sort"
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-fg/50 transition-colors hover:text-accent"
    >
      {label}
      {activeKey === sortKey && <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );
}

/** Searchable/sortable directory of every customer — the go-to place for an
 *  admin to look someone up and reach them (email/tel/WhatsApp), rather than
 *  digging through packages, invoices, or billing to find contact info. */
export default function AdminCustomersContent({ customers }: { customers: CustomerWithStats[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? customers.filter((c) => [c.name, c.accountCode, c.email, c.phone ?? ""].some((field) => field.toLowerCase().includes(q)))
      : customers;

    return [...rows].sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? a.name.localeCompare(b.name)
          : sortKey === "accountCode"
            ? a.accountCode.localeCompare(b.accountCode)
            : a.packageCount - b.packageCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [customers, query, sortKey, sortDir]);

  return (
    <div className="mt-10">
      <label htmlFor="customer-search" className="sr-only">
        Search customers
      </label>
      <input
        id="customer-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, account code, email, or phone…"
        className="mb-4 w-full max-w-md rounded-full border border-fg/15 bg-fg/5 px-5 py-3 text-sm text-fg outline-none transition-colors focus:border-accent"
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-fg/8 bg-surface p-8 text-center text-sm text-fg/50 shadow-card">
          {customers.length === 0 ? "No customers yet." : "No customers match your search."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-fg/8 bg-surface shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-fg/8">
                <th scope="col" className="px-6 py-4">
                  <SortButton label="Customer" sortKey="name" activeKey={sortKey} dir={sortDir} onClick={() => toggleSort("name")} />
                </th>
                <th scope="col" className="px-6 py-4">
                  <SortButton
                    label="Account code"
                    sortKey="accountCode"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={() => toggleSort("accountCode")}
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-fg/50">
                  Contact
                </th>
                <th scope="col" className="px-6 py-4">
                  <SortButton
                    label="Packages"
                    sortKey="packageCount"
                    activeKey={sortKey}
                    dir={sortDir}
                    onClick={() => toggleSort("packageCount")}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-fg/8 last:border-0">
                  <td className="px-6 py-4 font-medium text-fg">{customer.name}</td>
                  <td className="px-6 py-4 font-mono text-fg/70">{customer.accountCode}</td>
                  <td className="px-6 py-4">
                    <ContactLinks email={customer.email} phone={customer.phone} variant="full" />
                  </td>
                  <td className="px-6 py-4 text-fg/70">{customer.packageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
