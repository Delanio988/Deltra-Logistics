import type { OxPackage, OxCustomer } from "@/lib/ox-api";

type OxReadOnlyViewProps = {
  packages: OxPackage[];
  packagesError: string | null;
  customers: OxCustomer[];
  customersError: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Raw OX data, unfiltered — mainly so an admin can cross-reference a
 *  customer's real mailbox number here before linking it in the table above. */
export default function OxReadOnlyView({ packages, packagesError, customers, customersError }: OxReadOnlyViewProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">OX packages (read-only)</h3>
        {packagesError ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-600 dark:text-red-400">
            {packagesError}
          </div>
        ) : packages.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-fg/8 bg-surface p-6 text-center text-sm text-fg/50 shadow-card">
            No packages at OX yet.
          </div>
        ) : (
          <div className="mt-3 max-h-[28rem] overflow-auto rounded-2xl border border-fg/8 bg-surface shadow-card">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-fg/8 text-xs font-semibold uppercase tracking-widest text-fg/50">
                  <th scope="col" className="px-4 py-3">
                    Tracking #
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Recipient
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Mailbox
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Received
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.trackingNo} className="border-b border-fg/8 text-fg/70 last:border-0">
                    <td className="px-4 py-3 font-mono text-fg">{pkg.trackingNo}</td>
                    <td className="px-4 py-3">
                      {pkg.recipient.firstName} {pkg.recipient.lastName}
                    </td>
                    <td className="px-4 py-3">{pkg.recipient.mailboxNumber}</td>
                    <td className="px-4 py-3">{pkg.status}</td>
                    <td className="px-4 py-3">{formatDate(pkg.createdOn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-fg/50">OX customers (read-only)</h3>
        {customersError ? (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-4 text-sm text-red-600 dark:text-red-400">
            {customersError}
          </div>
        ) : customers.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-fg/8 bg-surface p-6 text-center text-sm text-fg/50 shadow-card">
            No customers at OX yet.
          </div>
        ) : (
          <div className="mt-3 max-h-[28rem] overflow-auto rounded-2xl border border-fg/8 bg-surface shadow-card">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-fg/8 text-xs font-semibold uppercase tracking-widest text-fg/50">
                  <th scope="col" className="px-4 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Mailbox
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.mailboxNumber} className="border-b border-fg/8 text-fg/70 last:border-0">
                    <td className="px-4 py-3 text-fg">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="px-4 py-3">{customer.mailboxNumber}</td>
                    <td className="px-4 py-3">{customer.code}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
