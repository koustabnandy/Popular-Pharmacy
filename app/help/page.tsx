"use client"

import Link from "next/link"

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Help & User Guide</h1>
      <p className="text-muted-foreground mt-2">How to use the Pharmacy website</p>

      <section className="mt-6 space-y-4 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-medium">Authentication</h2>
          <p>
            Use the demo accounts to sign in. Owner can access Admin and Inventory; Worker can access Billing and
            Inventory (read/add where allowed).
          </p>
        </div>
        <div>
          <h2 className="text-lg font-medium">Billing</h2>
          <p>
            Select medicines using the search. Quantities cannot exceed stock. Default GST is 15% per item (modifiable).
            Process a mock payment to record a sale.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-medium">Inventory</h2>
          <p>
            Add new medicines with supplier, cost, price, quantity, and threshold. Search quickly and watch for
            low/out-of-stock alerts in Admin.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-medium">Admin Dashboard</h2>
          <p>View daily and monthly P&amp;L, best sellers by quantity, and a chart of sales trends.</p>
        </div>
        <div>
          <h2 className="text-lg font-medium">Security</h2>
          <p>
            Passwords are hashed locally using SHA-256 before storage. Payment is mocked; no sensitive data is collected
            in this demo.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-medium">Data & Persistence</h2>
          <p>
            All data is stored locally (localStorage). For production, replace the data layer with MySQL/Postgres and
            real payments.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/" className="underline">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  )
}
