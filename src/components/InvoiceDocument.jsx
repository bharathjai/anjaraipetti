import BrandHatMark from "./BrandHatMark";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export default function InvoiceDocument({ order }) {
  const createdDate = new Date(order.createdAt || Date.now());
  const invoiceNumber = order.invoiceNumber || `INV-${createdDate.getFullYear()}-001`;
  const productName = order.productName || "Anjaraipetti Biryani Masala";
  const subtotal = Number(order.subtotal || 0);
  const grandTotal = Number(order.grandTotal || order.total || subtotal);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-truffle/20 bg-gradient-to-br from-[#fcfbf9] to-[#f5f1eb] p-8 shadow-2xl md:p-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-[0.03] grayscale">
        <BrandHatMark />
      </div>

      <div className="relative flex flex-wrap items-start justify-between gap-6 border-b border-truffle/20 pb-8">
        <div>
          <div className="mb-6 h-14 w-40 opacity-90 drop-shadow-sm">
            <BrandHatMark />
          </div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-cocoa/70">Namma Veetu</p>
          <p className="mt-1 font-display text-4xl leading-normal text-espresso drop-shadow-sm">Anjaraipetti</p>
          <p className="text-sm font-medium tracking-wide text-truffle/80">Premium Kitchen Essentials</p>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.25em] text-cocoa/60">Invoice Number</p>
          <p className="mt-1 font-mono text-lg font-medium text-espresso">{invoiceNumber}</p>
          <p className="mt-4 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-cocoa/60">Invoice Date</p>
          <p className="mt-1 font-medium text-espresso">{createdDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="relative mt-8 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-truffle/15 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-cocoa/30" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cocoa">Billed To</p>
          </div>
          <p className="font-display text-xl text-espresso">{order.customer.name}</p>
          <div className="mt-3 space-y-1 text-sm text-truffle">
            <p>{order.customer.phone}</p>
            <p className="pt-2">{order.address.line1}</p>
            {order.address.line2 ? <p>{order.address.line2}</p> : null}
            {order.address.landmark ? <p>{order.address.landmark}</p> : null}
            <p>
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-truffle/15 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-cocoa/30" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cocoa">Order Details</p>
          </div>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-truffle/60">Payment Method</p>
              <p className="mt-1 font-medium text-truffle">{String(order.payment.method).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-truffle/60">Payment Status</p>
              <p className="mt-1 font-medium text-truffle">{order.payment.status}</p>
            </div>
            {order.payment.razorpayPaymentId && (
              <div className="col-span-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-truffle/60">Transaction ID</p>
                <p className="mt-1 font-mono text-xs text-truffle">{order.payment.razorpayPaymentId}</p>
              </div>
            )}
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-truffle/60">Order Status</p>
              <p className="mt-1 font-medium text-truffle">{order.status}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-truffle/60">Estimated Delivery</p>
              <p className="mt-1 font-medium text-truffle">{order.eta}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mt-10 overflow-hidden rounded-2xl border border-truffle/15 bg-white/80 shadow-sm">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-truffle/15 bg-gradient-to-r from-porcelain to-white">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-cocoa">Item Description</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.15em] text-cocoa">Qty</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.15em] text-cocoa">Rate</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.15em] text-cocoa">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-truffle/10">
            <tr className="transition-colors hover:bg-white/50">
              <td className="px-6 py-5 font-medium text-espresso">{productName}</td>
              <td className="px-6 py-5 text-center font-medium text-truffle">{order.quantity}</td>
              <td className="px-6 py-5 text-right font-medium text-truffle">{formatINR(order.unitPrice)}</td>
              <td className="px-6 py-5 text-right font-medium text-espresso">{formatINR(subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="relative mt-8 flex flex-col items-end">
        <div className="w-full max-w-sm rounded-2xl border border-truffle/15 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between text-sm text-truffle">
            <span className="font-medium">Subtotal</span>
            <span className="font-medium">{formatINR(subtotal)}</span>
          </div>
          <div className="my-4 border-t border-dashed border-truffle/20" />
          <div className="flex items-end justify-between">
            <div>
              <span className="block text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cocoa/70">Total Due</span>
              <span className="font-display text-2xl text-espresso">Grand Total</span>
            </div>
            <span className="font-display text-3xl text-cocoa drop-shadow-sm">{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-12 flex flex-col items-center justify-center border-t border-truffle/15 pt-8 text-center">
        <div className="mb-3 h-8 w-8 opacity-40">
          <BrandHatMark />
        </div>
        <p className="font-display text-xl italic text-espresso/80">Thank you for choosing authenticity.</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-truffle/60">Your support keeps tradition alive</p>
      </div>
    </div>
  );
}
