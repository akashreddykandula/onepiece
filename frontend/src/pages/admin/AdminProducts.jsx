// AdminProducts.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import { productAPI } from "@services/api";
import { formatPrice, formatDate } from "@utils/helpers";
import PageLoader from "@components/ui/PageLoader";
import toast from "react-hot-toast";

export function AdminProducts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isActiveFilter, setIsActiveFilter] = useState("");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search, page, isActiveFilter],
    queryFn: async () => {
      const res = await productAPI.getAllAdmin({
        search,
        page,
        limit: 20,
        isActive: isActiveFilter,
      });
      return res.data;
    },
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productAPI.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-products"],
      });
      toast.success("Product deleted successfully");
    },
    onError: () => toast.error("Failed to delete product"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-products"],
      });
      toast.success("Product updated");
    },
    onError: () => {
      toast.error("Failed to update product");
    },
  });

  return (
    <>
      <Helmet>
        <title>Products | Admin</title>
      </Helmet>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl text-brand-900">
              Products
            </h1>
            <p className="text-sm text-gray-400">
              {data?.total || 0} total products
            </p>
          </div>
          <Link to="/admin/products/new" className="btn-primary">
            <FiPlus size={16} /> Add Product
          </Link>
        </div>

        <div className="card p-5">
          <div className="flex gap-3 flex-wrap mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input pl-10 text-sm py-2.5"
                placeholder="Search by name or SKU…"
              />
            </div>
            <select
              value={isActiveFilter}
              onChange={(e) => {
                setIsActiveFilter(e.target.value);
                setPage(1);
              }}
              className="input text-sm py-2.5 max-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {[
                      "Product",
                      "SKU",
                      "Price",
                      "Stock",
                      "Status",
                      "Sold",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide pb-3 pr-4 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.products?.map((p) => (
                    <tr
                      key={p._id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                            {p.images?.[0]?.url && (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1 max-w-[160px]">
                              {p.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {p.category?.name}
                            </p>
                            <div className="flex gap-1 mt-0.5">
                              <button
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: p._id,
                                    data: {
                                      isFeatured: !p.isFeatured,
                                    },
                                  })
                                }
                                className={`badge text-[9px] cursor-pointer transition-all hover:scale-105 ${
                                  p.isFeatured
                                    ? "bg-brand-100 text-brand-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {p.isFeatured ? "Featured" : "Not Featured"}
                              </button>
                              <button
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: p._id,

                                    data: {
                                      isNewArrival: !p.isNewArrival,
                                    },
                                  })
                                }
                                className={`badge text-[9px] cursor-pointer transition-all hover:scale-105 ${
                                  p.isNewArrival
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {p.isNewArrival ? "New" : "Not New"}
                              </button>
                              <button
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: p._id,
                                    data: {
                                      isTrending: !p.isTrending,
                                    },
                                  })
                                }
                                className={`badge text-[9px] cursor-pointer transition-all hover:scale-105 ${
                                  p.isTrending
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {p.isTrending ? "Trending" : "Not Trending"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-400 font-mono text-xs">
                        {p.sku}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-brand-900">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-sm font-semibold ${p.stock <= 5 ? "text-red-500" : "text-green-600"}`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              id: p._id,
                              data: {
                                isActive: !p.isActive,
                              },
                            })
                          }
                          className={`badge cursor-pointer transition-all hover:scale-105 ${
                            p.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {p.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {p.soldCount || 0}
                      </td>
                      <td className="py-3">
                        {/* <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"> */}
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/product/${p._id}`}
                            target="_blank"
                            className="btn-icon"
                            title="Preview"
                          >
                            <FiEye size={15} />
                          </Link>
                          <Link
                            to={`/admin/products/${p._id}`}
                            className="btn-icon"
                            title="Edit"
                          >
                            <FiEdit2 size={15} />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm("Deactivate this product?"))
                                deleteMutation.mutate(p._id);
                            }}
                            className="btn-icon text-red-400 hover:text-red-600 hover:bg-red-50"
                            title="Deactivate"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data?.products?.length && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-10 text-gray-400"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data?.pages > 1 && (
            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-2 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="flex items-center text-sm text-gray-500 px-3">
                Page {page} of {data.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="btn-secondary text-sm py-2 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export default AdminProducts;
