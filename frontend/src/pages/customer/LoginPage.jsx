import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiLoader,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";
import { FaFacebookF, FaGoogle, FaLinkedinIn } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearAuthError } from "@store/index";
import toast from "react-hot-toast";

// ─── Brand Header Component ──────────────────────────────────────────────────
function BrandHeader({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/oplogo.jpeg"
        alt="ONE PIECE Logo"
        className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div></div>
    </div>
  );
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [showPass, setShowPass] = useState(false);
  const { loading, error } = useSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    dispatch(clearAuthError());
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      toast.success("Welcome back!");
      navigate(redirect, { replace: true });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | ONE PIECE</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-3 sm:p-6 md:p-8">
        {/* Mobile Header Bar */}
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-3 md:hidden">
          <Link to="/">
            <BrandHeader />
          </Link>
        </div>

        {/* Split Auth Card Container */}
        <div className="my-auto w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-5"
          >
            {/* Left Side: Sign In Form */}
            <div className="md:col-span-3 p-5 sm:p-8 md:p-10 flex flex-col justify-center bg-white order-2 md:order-1">
              <div className="mb-5 sm:mb-6">
                <h1 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-tight mb-1">
                  Welcome Back
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Please log in to manage your orders & account.
                </p>

                {/* Social Login Buttons */}

                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    continue with email
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200/80 text-red-600 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
                  <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                {/* Email Field */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <FiMail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      {...register("email", { required: "Email is required" })}
                      type="email"
                      className={`w-full bg-slate-50 border ${
                        errors.email
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                      } rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                      placeholder="your@gmail.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                      Password *
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-blue-600 hover:underline font-bold transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FiLock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      {...register("password", {
                        required: "Password is required",
                      })}
                      type={showPass ? "text" : "password"}
                      className={`w-full bg-slate-50 border ${
                        errors.password
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                      } rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all ${
                      loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiLoader size={16} className="animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              {/* Mobile Mobile Sign Up Link */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center md:hidden">
                <p className="text-xs text-slate-500 font-medium">
                  Don't have an account?{" "}
                  <Link
                    to={`/register${
                      redirect !== "/" ? `?redirect=${redirect}` : ""
                    }`}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Side Desktop Banner */}
            <div className="hidden md:flex md:col-span-2 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-8 text-white flex-col justify-between relative overflow-hidden order-1 md:order-2">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <Link to="/">
                  <BrandHeader light />
                </Link>
              </div>

              <div className="my-auto py-8 text-center relative z-10">
                <h2 className="font-display font-bold text-2xl lg:text-3xl mb-2.5 leading-tight">
                  New to ONE PIECE?
                </h2>
                <p className="text-blue-200/90 text-xs max-w-xs mx-auto leading-relaxed mb-6 font-medium">
                  Join us today to unlock exclusive rewards, order tracking, and
                  fast checkout.
                </p>
                <Link
                  to={`/register${
                    redirect !== "/" ? `?redirect=${redirect}` : ""
                  }`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl px-7 py-2.5 text-xs tracking-wider uppercase transition-all shadow-sm"
                >
                  Create Account <FiArrowRight size={14} />
                </Link>
              </div>

              <div className="text-[10px] text-blue-200/60 text-center relative z-10 font-medium">
                © ONE PIECE Official Store
              </div>
            </div>
          </motion.div>
        </div>

        {/* Desktop Bottom Footer Text */}
        <div className="hidden md:block text-center text-xs text-slate-400 font-medium pt-4">
          Protected by 256-Bit SSL Encryption
        </div>
      </div>
    </>
  );
}

export default LoginPage;
