import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";
import { registerUser, clearAuthError } from "@store/index";
import { authAPI } from "@services/api";
import { isValidEmail, isValidPhone, isValidPassword } from "@utils/helpers";
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
    </div>
  );
}

// ─── RegisterPage ─────────────────────────────────────────────────────────────
export function RegisterPage() {
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
    const result = await dispatch(
      registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      }),
    );
    if (registerUser.fulfilled.match(result)) {
      toast.success("Account created! Welcome to ONE PIECE 🎉");
      navigate(redirect, { replace: true });
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Account | ONE PIECE</title>
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
            {/* Left Side Desktop Banner */}
            <div className="hidden md:flex md:col-span-2 bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 p-8 text-white flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <Link to="/">
                  <BrandHeader light />
                </Link>
              </div>

              <div className="my-auto py-8 text-center relative z-10">
                <h2 className="font-display font-bold text-2xl lg:text-3xl mb-2.5 leading-tight">
                  Already Registered?
                </h2>
                <p className="text-blue-200/90 text-xs max-w-xs mx-auto leading-relaxed mb-6 font-medium">
                  Log in to access your orders, saved addresses, and profile
                  details.
                </p>
                <Link
                  to={`/login${redirect !== "/" ? `?redirect=${redirect}` : ""}`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl px-7 py-2.5 text-xs tracking-wider uppercase transition-all shadow-sm"
                >
                  <FiArrowLeft size={14} /> Sign In
                </Link>
              </div>

              <div className="text-[10px] text-blue-200/60 text-center relative z-10 font-medium">
                © ONE PIECE Official Store
              </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="md:col-span-3 p-5 sm:p-8 md:p-10 flex flex-col justify-center bg-white">
              <div className="mb-4 sm:mb-5">
                <h1 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-tight mb-1">
                  Create Account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Sign up in seconds to start shopping.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200/80 text-red-600 text-xs rounded-xl p-3 mb-4 flex items-start gap-2">
                  <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Name Field */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <FiUser
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      {...register("name", {
                        required: "Name is required",
                        minLength: { value: 2, message: "Too short" },
                      })}
                      className={`w-full bg-slate-50 border ${
                        errors.name
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                      } rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                      placeholder="Your name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

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
                      {...register("email", {
                        required: "Email is required",
                        validate: (v) => isValidEmail(v) || "Invalid email",
                      })}
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

                {/* Phone Field */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      {...register("phone", {
                        validate: (v) =>
                          !v ||
                          isValidPhone(v) ||
                          "Enter valid 10-digit number",
                      })}
                      className={`w-full bg-slate-50 border ${
                        errors.phone
                          ? "border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                      } rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                      placeholder="10-Digit Mobile"
                      maxLength={10}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <FiLock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      {...register("password", {
                        required: "Password is required",
                        validate: (v) =>
                          isValidPassword(v) || "Min 8 characters",
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
                        Creating...
                      </span>
                    ) : (
                      "Sign Up"
                    )}
                  </button>
                </div>
              </form>

              <p className="text-[11px] text-slate-400 text-center mt-3 font-medium">
                By registering you agree to our{" "}
                <Link
                  to="/pages/terms"
                  className="text-blue-600 hover:underline"
                >
                  Terms
                </Link>{" "}
                &{" "}
                <Link
                  to="/pages/privacy"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>

              {/* Mobile Sign In Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center md:hidden">
                <p className="text-xs text-slate-500 font-medium">
                  Already have an account?{" "}
                  <Link
                    to={`/login${
                      redirect !== "/" ? `?redirect=${redirect}` : ""
                    }`}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
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

// ─── ForgotPasswordPage ───────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password | ONE PIECE</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-3 sm:p-6 md:p-8">
        <div className="max-w-md mx-auto w-full flex items-center justify-between pb-3 md:hidden">
          <Link to="/">
            <BrandHeader />
          </Link>
        </div>

        <div className="my-auto w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-5 sm:p-8"
          >
            <div className="mb-5 flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="hidden md:block">
                <BrandHeader />
              </div>
              <span className="text-xs font-bold text-slate-900 md:hidden">
                Reset Password
              </span>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors"
              >
                <FiArrowLeft size={14} /> Back
              </Link>
            </div>

            {submitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiCheck size={24} />
                </div>
                <h2 className="font-display font-bold text-lg text-slate-900 mb-1">
                  Check your inbox
                </h2>
                <p className="text-slate-500 text-xs leading-relaxed">
                  If this email is registered, you'll receive a password reset
                  link shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="font-display font-black text-xl text-slate-900 mb-1">
                    Forgot Password?
                  </h2>
                  <p className="text-slate-500 text-xs font-medium">
                    Enter your email address and we'll send a password reset
                    link.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
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
                        {...register("email", {
                          required: "Email is required",
                          validate: (v) => isValidEmail(v) || "Invalid email",
                        })}
                        type="email"
                        className={`w-full bg-slate-50 border ${
                          errors.email
                            ? "border-red-400"
                            : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                        } rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all ${
                      loading ? "opacity-70" : ""
                    }`}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>

        <div className="hidden md:block text-center text-xs text-slate-400 font-medium pt-4">
          Protected by 256-Bit SSL Encryption
        </div>
      </div>
    </>
  );
}

// ─── ResetPasswordPage ────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      await authAPI.resetPassword(token, password);
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Reset link is invalid or expired",
      );
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password | ONE PIECE</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-3 sm:p-6 md:p-8">
        <div className="max-w-md mx-auto w-full flex items-center justify-between pb-3 md:hidden">
          <Link to="/">
            <BrandHeader />
          </Link>
        </div>

        <div className="my-auto w-full flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-5 sm:p-8"
          >
            <div className="mb-5 flex justify-center pb-3 border-b border-slate-100">
              <BrandHeader />
            </div>

            {done ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiCheck size={24} />
                </div>
                <h2 className="font-display font-bold text-lg text-slate-900 mb-1">
                  Password Reset!
                </h2>
                <p className="text-slate-500 text-xs">
                  Redirecting you to sign in...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="font-display font-black text-xl text-slate-900 mb-1">
                    Set New Password
                  </h2>
                  <p className="text-slate-500 text-xs font-medium">
                    Choose a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <FiLock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        {...register("password", {
                          required: "Required",
                          validate: (v) =>
                            isValidPassword(v) || "Min 8 characters",
                        })}
                        type={showPass ? "text" : "password"}
                        className={`w-full bg-slate-50 border ${
                          errors.password
                            ? "border-red-400"
                            : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                        } rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                        placeholder="Min 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPass ? (
                          <FiEyeOff size={15} />
                        ) : (
                          <FiEye size={15} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <FiLock
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        {...register("confirmPassword", {
                          required: "Required",
                          validate: (v) =>
                            v === watch("password") || "Passwords do not match",
                        })}
                        type={showPass ? "text" : "password"}
                        className={`w-full bg-slate-50 border ${
                          errors.confirmPassword
                            ? "border-red-400"
                            : "border-slate-200 focus:border-blue-600 focus:ring-blue-100"
                        } rounded-xl py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:ring-4 transition-all`}
                        placeholder="Repeat password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-[11px] font-medium mt-1 pl-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all ${
                      isSubmitting ? "opacity-70" : ""
                    }`}
                  >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>

        <div className="hidden md:block text-center text-xs text-slate-400 font-medium pt-4">
          Protected by 256-Bit SSL Encryption
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
