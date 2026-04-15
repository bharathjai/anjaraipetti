import BrandHatMark from "./BrandHatMark";

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export default function InvoiceDocument({ order }) {
  const createdDate = new Date(order.createdAt || Date.now());
  const invoiceNumber = order.invoiceNumber || `INV-${createdDate.getFullYear()}-001`;
  const productName = order.productName || "Anjaraipetti Biryani Masala";
  const subtotal = Number(order.subtotal || 0);
  const tax = Number(order.tax || 0);
  const shipping = Number(order.shipping || 0);
  const grandTotal = Number(order.grandTotal || order.total || subtotal + tax + shipping);
  const taxPercent = Number(order.taxRate || 0.05) * 100;

  return (
    <div className="rounded-2xl border border-truffle/15 bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-truffle/15 pb-5">
        <div>
          <div className="h-12 w-36 opacity-90">
            <BrandHatMark />
          </div>
          <p className="mt-2 font-display text-3xl text-espresso">Anjaraipetti</p>
          <p className="text-sm text-truffle/80">Premium Indian Masala</p>
        </div>
        <div className="text-right text-sm text-truffle/85">
          <p className="font-semibold text-cocoa">Invoice Number</p>
          <p>{invoiceNumber}</p>
          <p className="mt-2 font-semibold text-cocoa">Invoice Date</p>
          <p>{createdDate.toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-truffle/10 bg-porcelain p-4 text-sm text-truffle/85">
          <p className="font-semibold uppercase tracking-[0.18em] text-cocoa/80">Bill To</p>
          <p className="mt-2 font-semibold text-truffle">{order.customer.name}</p>
          <p>{order.customer.phone}</p>
          <p>{order.address.line1}</p>
          {order.address.line2 ? <p>{order.address.line2}</p> : null}
          {order.address.landmark ? <p>{order.address.landmark}</p> : null}
          <p>
            {order.address.city}, {order.address.state} - {order.address.pincode}
          </p>
        </div>
        <div className="rounded-xl border border-truffle/10 bg-porcelain p-4 text-sm text-truffle/85">
          <p className="font-semibold uppercase tracking-[0.18em] text-cocoa/80">Payment</p>
          <p className="mt-2">Method: {String(order.payment.method).toUpperCase()}</p>
          <p>Status: {order.payment.status}</p>
          <p className="mt-2">ETA: {order.eta}</p>
          <p>Status: {order.status}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-y border-truffle/20 bg-porcelain">
              <th className="px-4 py-3 font-semibold text-cocoa">Product</th>
              <th className="px-4 py-3 font-semibold text-cocoa">Qty</th>
              <th className="px-4 py-3 font-semibold text-cocoa">Unit Price</th>
              <th className="px-4 py-3 text-right font-semibold text-cocoa">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-truffle/15">
              <td className="px-4 py-3 text-truffle">{productName}</td>
              <td className="px-4 py-3 text-truffle">{order.quantity}</td>
              <td className="px-4 py-3 text-truffle">{formatINR(order.unitPrice)}</td>
              <td className="px-4 py-3 text-right text-truffle">{formatINR(subtotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 ml-auto w-full max-w-sm rounded-xl border border-truffle/15 bg-porcelain p-4 text-sm text-truffle/90">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Tax ({taxPercent.toFixed(0)}%)</span>
          <span>{formatINR(tax)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span>Shipping</span>
          <span>{formatINR(shipping)}</span>
        </div>
        <div className="mt-3 border-t border-truffle/20 pt-3 text-base font-semibold text-cocoa">
          <div className="flex items-center justify-between">
            <span>Grand Total</span>
            <span>{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-truffle/15 pt-4 text-center text-sm text-truffle/80">Thank you for your purchase</div>
    </div>
  );
}
