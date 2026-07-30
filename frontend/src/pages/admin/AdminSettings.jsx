import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiSave,
  FiShield,
  FiBell,
  FiGlobe,
  FiDollarSign,
} from "react-icons/fi";
import { useAuth } from "@hooks/index";
import { authAPI } from "@services/api";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [showPass, setShowPass] = useState(false);

  const { register: regGeneral, handleSubmit: submitGeneral } = useForm({
    defaultValues: {
      siteName: "ONE PIECE",
      tagline: "Your Statement. Your Style.",
      supportEmail: "onepiece.fashion99@gmail.com",
      supportPhone: "+91 81212 18099",
      whatsappNumber: "9181212180990",
      freeShippingAbove: 999,
      codEnabled: true,
    },
  });
  const {
    register: regPass,
    handleSubmit: submitPass,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm();

  const onSaveGeneral = (data) => {
    toast.success("Settings saved!");
  };
  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated!");
      resetPass();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const TABS = [
    { id: "general", label: "General", icon: FiGlobe },
    { id: "security", label: "Security", icon: FiShield },
    { id: "payments", label: "Payments", icon: FiDollarSign },
    { id: "notifications", label: "Notifications", icon: FiBell },
  ];

  return (
    <>
      <Helmet>
        <title>Settings | Admin</title>
      </Helmet>
      <div className="space-y-5 max-w-3xl">
        <div>
          <h1 className="font-display font-bold text-2xl text-brand-900">
            Settings
          </h1>
          <p className="text-sm text-gray-400">
            Manage your store configuration
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${activeTab === tab.id ? "bg-brand-800 text-white shadow-brand-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-brand-400"}`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <form
            onSubmit={submitGeneral(onSaveGeneral)}
            className="card p-6 space-y-5"
          >
            <h2 className="font-semibold text-gray-900">General Settings</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Store Name</label>
                <input {...regGeneral("siteName")} className="input" />
              </div>
              <div>
                <label className="label">Tagline</label>
                <input {...regGeneral("tagline")} className="input" />
              </div>
              <div>
                <label className="label">Support Email</label>
                <input
                  {...regGeneral("supportEmail")}
                  type="email"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Support Phone</label>
                <input {...regGeneral("supportPhone")} className="input" />
              </div>
              <div>
                <label className="label">
                  WhatsApp Number (with country code)
                </label>
                <input
                  {...regGeneral("whatsappNumber")}
                  className="input"
                  placeholder="9181212180990"
                />
              </div>
              <div>
                <label className="label">Free Shipping Above (₹)</label>
                <input
                  {...regGeneral("freeShippingAbove")}
                  type="number"
                  className="input"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              <FiSave size={15} /> Save General Settings
            </button>
          </form>
        )}

        {activeTab === "security" && (
          <div className="space-y-5">
            <form
              onSubmit={submitPass(onChangePassword)}
              className="card p-6 space-y-4"
            >
              <h2 className="font-semibold text-gray-900">
                Change Admin Password
              </h2>
              <div>
                <label className="label">Current Password</label>
                <input
                  {...regPass("currentPassword", { required: "Required" })}
                  type={showPass ? "text" : "password"}
                  className={`input ${passErrors.currentPassword ? "input-error" : ""}`}
                />
                {passErrors.currentPassword && (
                  <p className="error-msg">
                    {passErrors.currentPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">New Password (min 8 chars)</label>
                <input
                  {...regPass("newPassword", {
                    required: "Required",
                    minLength: { value: 8, message: "Min 8 chars" },
                  })}
                  type={showPass ? "text" : "password"}
                  className={`input ${passErrors.newPassword ? "input-error" : ""}`}
                />
                {passErrors.newPassword && (
                  <p className="error-msg">{passErrors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  {...regPass("confirmPassword", { required: "Required" })}
                  type={showPass ? "text" : "password"}
                  className={`input ${passErrors.confirmPassword ? "input-error" : ""}`}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPass}
                  onChange={(e) => setShowPass(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-gray-700">Show passwords</span>
              </label>
              <button type="submit" className="btn-primary">
                <FiShield size={15} /> Update Password
              </button>
            </form>
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Session Info</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-400">Logged in as</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Login</span>
                  <span className="font-medium">
                    {user?.lastLogin
                      ? new Date(user.lastLogin).toLocaleString("en-IN")
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="card p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">
              Payment Configuration
            </h2>
            <div className="p-4 bg-brand-50 rounded-2xl">
              <p className="text-sm text-brand-800 font-medium">
                ⚙️ Configure payment credentials in{" "}
                <code className="bg-white px-1.5 py-0.5 rounded text-xs font-mono">
                  backend/.env
                </code>
              </p>
            </div>
            {[
              {
                label: "Razorpay Key ID",
                env: "RAZORPAY_KEY_ID",
                sample: "rzp_live_xxx…",
              },
              {
                label: "Razorpay Secret",
                env: "RAZORPAY_KEY_SECRET",
                sample: "Hidden",
              },
              { label: "GST Rate (%)", env: "GST_RATE", sample: "18" },
            ].map((item) => (
              <div key={item.env}>
                <label className="label">{item.label}</label>
                <div className="input bg-gray-50 text-gray-500 cursor-not-allowed flex items-center justify-between">
                  <span className="font-mono text-xs">{item.env}</span>
                  <span className="text-xs text-gray-400">{item.sample}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Set via environment variable
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="card p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">
              Notification Settings
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: "Order Confirmation Email",
                  sub: "Send email to customer when order is placed",
                  checked: true,
                },
                {
                  label: "Shipping Notification",
                  sub: "Send email when order is shipped with tracking",
                  checked: true,
                },
                {
                  label: "Order Delivered Email",
                  sub: "Send email when order is delivered",
                  checked: true,
                },
                {
                  label: "Low Stock Alert",
                  sub: "Alert admin when product stock is low",
                  checked: true,
                },
                {
                  label: "New Review Alert",
                  sub: "Alert admin when a new review is submitted",
                  checked: false,
                },
                {
                  label: "Return Request Alert",
                  sub: "Alert admin when a return is requested",
                  checked: true,
                },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="w-4 h-4 accent-brand-600 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => toast.success("Notification settings saved!")}
              className="btn-primary"
            >
              <FiSave size={15} /> Save Preferences
            </button>
          </div>
        )}
      </div>
    </>
  );
}
