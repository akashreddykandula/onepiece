import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useSearchParams, Link } from "react-router-dom";
import MyCustomPrintOrders from "./MyCustomPrintOrders";
import {
  FiUser,
  FiLock,
  FiMapPin,
  FiStar,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiArrowRight,
  FiShield,
  FiPackage,
  FiPrinter,
  FiLogOut,
  FiAward,
} from "react-icons/fi";
import { authAPI } from "@services/api";
import { setUser } from "@store/index";
import { useAuth } from "@hooks/index";
import { formatPrice } from "@utils/helpers";
import { INDIA_STATES } from "@constants";
import toast from "react-hot-toast";

const TABS = [
  { id: "profile", label: "My Profile", icon: FiUser },
  { id: "security", label: "Security", icon: FiLock },
  { id: "addresses", label: "Addresses", icon: FiMapPin },
  // { id: "prints", label: "Custom Prints", icon: FiPrinter },
  // { id: "loyalty", label: "Loyalty Rewards", icon: FiStar },
];

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ user, dispatch }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      gender: user?.gender || "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      dispatch(setUser(res.data.user));
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Full Name *
          </label>
          <input
            {...register("name", { required: "Name is required" })}
            className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none ${
              errors.name
                ? "border-red-400 bg-red-50/30 focus:border-red-500"
                : "border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Phone Number
          </label>
          <input
            {...register("phone")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium transition-all outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            placeholder="10-digit number"
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Email Address
          </label>
          <input
            value={user?.email || ""}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Email address cannot be modified
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Gender
          </label>
          <select
            {...register("gender")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium transition-all outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-brand-900 text-white font-semibold text-sm rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? "Saving Changes…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();
  const [showPass, setShowPass] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully!");
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const fields = [
    {
      id: "currentPassword",
      label: "Current Password",
      key: "current",
      rules: { required: "Required" },
    },
    {
      id: "newPassword",
      label: "New Password",
      key: "new",
      rules: {
        required: "Required",
        minLength: { value: 8, message: "Min 8 characters" },
      },
    },
    {
      id: "confirmPassword",
      label: "Confirm Password",
      key: "confirm",
      rules: { required: "Required" },
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl flex items-start gap-3">
        <FiShield className="text-brand-600 mt-0.5 shrink-0" size={18} />
        <p className="text-xs text-brand-900 font-medium leading-relaxed">
          Ensure your account stays safe by using a strong password—at least 8
          characters with a mix of letters, numbers, and symbols.
        </p>
      </div>

      {fields.map((f) => (
        <div key={f.id}>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            {f.label}
          </label>
          <div className="relative">
            <input
              {...register(f.id, f.rules)}
              type={showPass[f.key] ? "text" : "password"}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none pr-12 ${
                errors[f.id]
                  ? "border-red-400 bg-red-50/30 focus:border-red-500"
                  : "border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => ({ ...p, [f.key]: !p[f.key] }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors"
            >
              {showPass[f.key] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {errors[f.id] && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors[f.id].message}
            </p>
          )}
        </div>
      ))}

      <div className="pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-brand-900 text-white font-semibold text-sm rounded-xl hover:bg-brand-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? "Updating Password…" : "Update Password"}
        </button>
      </div>
    </form>
  );
}

// ─── Addresses Tab ────────────────────────────────────────────────────────────
function AddressesTab({ user, dispatch }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const openNew = () => {
    reset();
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditId(addr._id);
    Object.entries(addr).forEach(([k, v]) => setValue(k, v));
    setShowForm(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      let res;
      if (editId) {
        res = await authAPI.updateAddress(editId, data);
      } else {
        res = await authAPI.addAddress(data);
      }
      dispatch(setUser({ ...user, addresses: res.data.addresses }));
      toast.success(editId ? "Address updated!" : "Address added!");
      setShowForm(false);
      setEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId) => {
    if (!confirm("Delete this address?")) return;
    try {
      await authAPI.deleteAddress(addressId);
      dispatch(
        setUser({
          ...user,
          addresses: user.addresses.filter((a) => a._id !== addressId),
        }),
      );
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Saved Addresses ({user?.addresses?.length || 0})
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-800 hover:bg-brand-100 text-xs font-bold rounded-xl transition-all"
        >
          <FiPlus size={14} /> Add New Address
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit(onSubmit)}
            className="p-6 bg-white rounded-2xl border-2 border-brand-200 shadow-sm space-y-4"
          >
            <h3 className="font-bold text-brand-900 text-base">
              {editId ? "Edit Address" : "Add New Address"}
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Tag Label
                </label>
                <select
                  {...register("label")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                >
                  {["Home", "Work", "Other"].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  {...register("name", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                  placeholder="Recipient name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Phone *
                </label>
                <input
                  {...register("phone", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                  placeholder="10-digit mobile"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Pincode *
                </label>
                <input
                  {...register("pincode", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Address Line 1 *
                </label>
                <input
                  {...register("line1", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                  placeholder="House no., Street, Area"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Address Line 2
                </label>
                <input
                  {...register("line2")}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                  placeholder="Landmark (optional)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  City *
                </label>
                <input
                  {...register("city", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  State *
                </label>
                <select
                  {...register("state", { required: true })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium outline-none focus:border-brand-500"
                >
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                {...register("isDefault")}
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Set as default address
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-brand-900 text-white font-semibold text-xs rounded-xl hover:bg-brand-800 transition-all disabled:opacity-60"
              >
                {saving
                  ? "Saving…"
                  : editId
                    ? "Update Address"
                    : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                }}
                className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
        {user?.addresses?.map((addr) => (
          <div
            key={addr._id}
            className={`p-5 rounded-2xl border bg-white relative transition-all duration-200 ${
              addr.isDefault
                ? "border-brand-400 shadow-sm"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                  addr.label === "Home"
                    ? "bg-emerald-50 text-emerald-700"
                    : addr.label === "Work"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {addr.label}
              </span>

              {addr.isDefault && (
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <FiCheck size={11} /> Default
                </span>
              )}
            </div>

            <p className="font-bold text-gray-900 text-sm">{addr.name}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {addr.line1}
              {addr.line2 && `, ${addr.line2}`}
              <br />
              {addr.city}, {addr.state} – {addr.pincode}
              <br />
              <span className="text-gray-700 font-medium">📞 {addr.phone}</span>
            </p>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
              <button
                onClick={() => openEdit(addr)}
                className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-semibold transition-colors"
              >
                <FiEdit2 size={13} /> Edit
              </button>
              <button
                onClick={() => deleteAddress(addr._id)}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors ml-auto"
              >
                <FiTrash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}

        {!user?.addresses?.length && !showForm && (
          <div className="md:col-span-2 text-center py-12 px-4 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-xs text-gray-400">
              <FiMapPin size={22} />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              No saved addresses yet
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Add an address to make checkout faster
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loyalty Tab ──────────────────────────────────────────────────────────────
function LoyaltyTab({ user }) {
  const tiers = [
    { name: "Silver", min: 0, max: 500, color: "bg-gray-400" },
    { name: "Gold", min: 500, max: 2000, color: "bg-amber-400" },
    { name: "Platinum", min: 2000, max: 5000, color: "bg-brand-500" },
    { name: "Diamond", min: 5000, max: null, color: "bg-purple-600" },
  ];
  const points = user?.loyaltyPoints || 0;
  const currentTier = tiers.reduce(
    (acc, t) => (points >= t.min ? t : acc),
    tiers[0],
  );
  const nextTier = tiers.find((t) => t.min > points);
  const progress = nextTier
    ? Math.min(
        ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100,
        100,
      )
    : 100;

  return (
    <div className="space-y-6">
      {/* Loyalty Banner Card */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <p className="text-xs uppercase font-extrabold tracking-widest text-brand-400 mb-1">
            Total Loyalty Points
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display font-black text-5xl tracking-tight">
              {points.toLocaleString("en-IN")}
            </span>
            <span className="text-gray-400 text-sm font-medium">
              ≈ {formatPrice(points)} value
            </span>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${currentTier.color}`}
            >
              {currentTier.name} Tier
            </span>
          </div>
        </div>

        {/* Ambient Overlay Design */}
        <div className="absolute right-[-20px] bottom-[-20px] text-white/5 pointer-events-none">
          <FiAward size={180} />
        </div>
      </div>

      {/* Progress Card */}
      {nextTier && (
        <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-gray-700">{currentTier.name}</span>
            <span className="text-brand-600">{nextTier.name}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={`h-full rounded-full ${currentTier.color}`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2.5 text-center font-medium">
            Earn{" "}
            <span className="font-bold text-gray-900">
              {nextTier.min - points}
            </span>{" "}
            more points to reach{" "}
            <span className="font-bold text-brand-600">{nextTier.name}</span>{" "}
            status
          </p>
        </div>
      )}

      {/* Earn Points Breakdown */}
      <div className="p-5 bg-white border border-gray-100 rounded-2xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
          Ways to Earn Rewards
        </h3>
        <div className="space-y-3">
          {[
            { action: "Make a purchase", points: "1 pt / ₹10" },
            { action: "Write a verified review", points: "50 pts" },
            { action: "Refer a friend", points: "200 pts" },
            { action: "Birthday bonus", points: "100 pts" },
          ].map((item) => (
            <div
              key={item.action}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-medium text-gray-600">
                {item.action}
              </span>
              <span className="bg-brand-50 text-brand-800 text-xs font-bold px-3 py-1 rounded-full">
                {item.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-900 text-white font-semibold text-sm rounded-xl hover:bg-brand-800 transition-all shadow-sm"
        >
          Shop Now & Earn Points <FiArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, handleLogout, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile",
  );

  const setTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const activeTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <>
      <Helmet>
        <title>My Account | ONE PIECE</title>
      </Helmet>

      {/* Top Banner Header */}
      <div className="bg-slate-950 text-white py-12 px-4 border-b border-gray-800 relative overflow-hidden">
        <div className="container-op relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20 shrink-0 shadow-xl">
              {user?.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt={user.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-brand-600 flex items-center justify-center font-display font-black text-3xl text-white">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                {user?.name}
              </h1>
              <p className="text-gray-400 text-sm font-medium mt-0.5">
                {user?.email}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-3">
                <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FiStar size={12} className="text-amber-400" />
                  {(user?.loyaltyPoints || 0).toLocaleString()} points
                </span>
                <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FiPackage size={12} className="text-brand-400" />
                  {user?.totalOrders || 0} orders
                </span>
              </div>
            </div>

            <Link
              to="/orders"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold text-xs transition-all backdrop-blur-md shrink-0"
            >
              View Orders History
            </Link>
          </div>
        </div>
      </div>

      <div className="container-op py-8 md:py-12">
        {/* Mobile Horizontal Scrollable Tab Menu */}
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 mb-6 border-b border-gray-100 scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-brand-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-xs space-y-1 sticky top-24">
              <p className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 px-4 py-2">
                Account Menu
              </p>

              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === id
                      ? "bg-brand-50 text-brand-900 shadow-xs"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    size={17}
                    className={
                      activeTab === id ? "text-brand-600" : "text-gray-400"
                    }
                  />
                  {label}
                </button>
              ))}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-brand-700 bg-brand-50/50 hover:bg-brand-100/60 transition-colors"
                >
                  <FiShield size={17} className="text-brand-600" />
                  Admin Panel
                </Link>
              )}

              <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={17} /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content Display Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs">
              <h2 className="font-display font-black text-xl md:text-2xl text-brand-900 mb-6 flex items-center gap-3 pb-4 border-b border-gray-100">
                <activeTabConfig.icon size={22} className="text-brand-500" />
                {activeTabConfig.label}
              </h2>

              {activeTab === "profile" && (
                <ProfileTab user={user} dispatch={dispatch} />
              )}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "addresses" && (
                <AddressesTab user={user} dispatch={dispatch} />
              )}
              {activeTab === "prints" && <MyCustomPrintOrders />}
              {activeTab === "loyalty" && <LoyaltyTab user={user} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
