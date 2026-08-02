import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiEye, FiCopy } from "react-icons/fi";
import { orderAPI } from "@services/api";
import { formatPrice, formatDate, getOrderStatusConfig } from "@utils/helpers";
import PageLoader from "@components/ui/PageLoader";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "return_requested", label: "Return Req." },
];

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [payment, setPayment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", search, status, page, payment],

    queryFn: () =>
      orderAPI
        .getAllAdmin({
          search,
          status: status || undefined,
          page,
          limit: 20,
          paymentStatus: payment || undefined,
        })
        .then((r) => r.data),
    staleTime: 0,
    keepPreviousData: true,
  });

  const orders = data?.orders || [];
  const pages = data?.pages || 1;
  const copyShippingAddress = async (order) => {
    const address = `
${order.shippingAddress?.name}
${order.shippingAddress?.phone}

${order.shippingAddress?.line1}
${order.shippingAddress?.line2 || ""}

${order.shippingAddress?.city}, ${order.shippingAddress?.state}
${order.shippingAddress?.pincode}
${order.shippingAddress?.country || "India"}
`.trim();

    try {
      await navigator.clipboard.writeText(address);
      alert("Shipping address copied!");
    } catch {
      alert("Failed to copy address");
    }
  };

  return (
    <>
      <Helmet>
        <title>Orders | Admin</title>
      </Helmet>
      <div className="space-y-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-brand-900">
            Orders
          </h1>
          <p className="text-sm text-gray-400">{data?.total || 0} total</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${status === tab.value ? "bg-brand-800 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-400"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex gap-3 flex-wrap mb-5">
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input pl-9 text-sm py-2"
                placeholder="Order number, name, phone…"
              />
            </div>
            <select
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value);
                setPage(1);
              }}
              className="input text-sm py-2 w-40"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[
                        "Order #",
                        "Customer",
                        "Items",
                        "Total",
                        "Payment",
                        "Status",
                        "Date",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide pb-3 pr-3"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orders.map((order, i) => {
                      const cfg = getOrderStatusConfig(order.orderStatus);
                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-gray-50/60 transition-colors group"
                        >
                          <td className="py-3 pr-3">
                            <Link
                              to={`/admin/orders/${order._id}`}
                              className="font-mono font-bold text-brand-700 hover:text-brand-900 text-xs"
                            >
                              #{order.orderNumber}
                            </Link>
                          </td>
                          <td className="py-3 pr-3">
                            <p className="font-medium text-xs text-gray-900">
                              {order.user?.name ||
                                order.guestInfo?.name ||
                                "Guest"}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {order.shippingAddress?.phone}
                            </p>
                          </td>
                          <td className="py-3 pr-3 text-gray-500 text-xs">
                            {order.items?.length || 0}
                          </td>
                          <td className="py-3 pr-3 font-bold text-brand-900 text-xs">
                            {formatPrice(order.pricing?.total)}
                          </td>
                          <td className="py-3 pr-3">
                            <span
                              className={`badge text-[10px] ${order.paymentInfo?.status === "paid" ? "bg-green-100 text-green-700" : order.paymentInfo?.status === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {order.paymentInfo?.status || "pending"}
                            </span>
                          </td>
                          <td className="py-3 pr-3">
                            <span className={cfg.color}>{cfg.label}</span>
                          </td>
                          <td className="py-3 pr-3 text-gray-400 text-xs whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2 transition-all">
                              <button
                                onClick={() => copyShippingAddress(order)}
                                title="Copy Shipping Address"
                                className="btn-icon hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              >
                                <FiCopy size={14} />
                              </button>

                              <Link
                                to={`/admin/orders/${order._id}`}
                                className="btn-icon hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                title="View Order"
                              >
                                <FiEye size={14} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!orders.length && (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-12 text-gray-400 text-sm"
                        >
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {pages > 1 && (
                <div className="flex justify-center gap-2 mt-5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-500 px-3 flex items-center">
                    Page {page} of {pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
