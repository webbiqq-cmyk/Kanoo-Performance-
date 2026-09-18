import type { Customer, QuoteLineSnapshot, Vehicle, VehiclePackage } from "../../lib/types";
import { formatBHD } from "../../lib/money";

interface DocumentLike {
  ref: string;
  lines: QuoteLineSnapshot[];
  subtotalFils: number;
  taxBps: number;
  taxFils: number;
  totalFils: number;
  notes?: string;
  createdAt: number;
}

interface Props {
  quote: DocumentLike;
  customer: Customer;
  vehicle: Vehicle;
  pkg: VehiclePackage;
  kind: "Quotation" | "Invoice";
  invoiceRef?: string;
  paidFils?: number;
}

export function QuoteDocument({ quote, customer, vehicle, pkg, kind, invoiceRef, paidFils }: Props) {
  const balance = paidFils !== undefined ? quote.totalFils - paidFils : undefined;
  return (
    <div id="print-root" className="fixed left-[-9999px] top-0 w-[800px] bg-white p-10 text-[#0a0a0c]">
      <div className="flex items-start justify-between border-b border-[#d0d0d5] pb-6">
        <div>
          <div className="text-xl font-bold tracking-wide">KANOO PERFORMANCE</div>
          <div className="mt-1 text-xs text-[#55555f]">Building 800, Road 123, Block 701, Tubli, Manama, Kingdom of Bahrain</div>
          <div className="text-xs text-[#55555f]">+973 1778 0555 · kanooperformance.com</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{kind}</div>
          <div className="text-sm text-[#55555f]">{invoiceRef ?? quote.ref}</div>
          <div className="text-xs text-[#55555f]">{new Date(quote.createdAt).toLocaleDateString("en-GB")}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8 text-sm">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a92]">Customer</div>
          <div className="mt-1 font-medium">{customer.name}</div>
          <div className="text-[#55555f]">{customer.phone}</div>
          <div className="text-[#55555f]">{customer.email}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a92]">Vehicle</div>
          <div className="mt-1 font-medium">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
          <div className="text-[#55555f]">{pkg.name}</div>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#d0d0d5] text-left text-[11px] uppercase tracking-wider text-[#8a8a92]">
            <th className="py-2">Item</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.id} className="border-b border-[#eceef0]">
              <td className="py-2.5">
                {l.brand && <span className="text-[#8a8a92]">{l.brand} · </span>}
                {l.name}
              </td>
              <td className="py-2.5 text-right tabular-nums">{l.qty}</td>
              <td className="py-2.5 text-right tabular-nums">{formatBHD(l.unitPriceFils)}</td>
              <td className="py-2.5 text-right tabular-nums">{formatBHD(l.lineTotalFils)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-64 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-[#55555f]">Subtotal</span>
          <span className="tabular-nums">{formatBHD(quote.subtotalFils)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-[#55555f]">Tax ({(quote.taxBps / 100).toFixed(1)}%, assumption)</span>
          <span className="tabular-nums">{formatBHD(quote.taxFils)}</span>
        </div>
        <div className="flex justify-between border-t border-[#0a0a0c] py-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatBHD(quote.totalFils)}</span>
        </div>
        {paidFils !== undefined && (
          <>
            <div className="flex justify-between py-1 text-[#2fb872]">
              <span>Paid</span>
              <span className="tabular-nums">{formatBHD(paidFils)}</span>
            </div>
            <div className="flex justify-between py-1 font-semibold">
              <span>Balance due</span>
              <span className="tabular-nums">{formatBHD(balance ?? 0)}</span>
            </div>
          </>
        )}
      </div>

      {quote.notes && (
        <div className="mt-8 text-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a92]">Notes</div>
          <p className="mt-1 text-[#333338]">{quote.notes}</p>
        </div>
      )}

      <div className="mt-10 border-t border-[#d0d0d5] pt-4 text-[10px] leading-relaxed text-[#8a8a92]">
        Performance figures, availability and pricing are illustrative demo data and do not represent a confirmed
        order or a certified tax invoice. Generated by the Kanoo Performance Studio interactive demo — WebiQQ.
      </div>
    </div>
  );
}
