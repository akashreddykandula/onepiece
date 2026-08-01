import { motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import { formatDateTime } from "@utils/helpers";

const RETURN_STEPS = [
  { key: "pending", label: "Return Requested" },
  { key: "approved", label: "Approved" },
  { key: "pickup_scheduled", label: "Pickup Scheduled" },
  { key: "picked_up", label: "Picked Up" },
  { key: "processing", label: "Processing" },
  { key: "refund_initiated", label: "Refund Initiated" },
  { key: "completed", label: "Refund Completed" },
];

export default function ReturnTimeline({ status, timeline = [] }) {
  const foundIndex = RETURN_STEPS.findIndex((s) => s.key === status);
  const currentIndex = foundIndex !== -1 ? foundIndex : 0;
  const isRejected = status === "rejected" || status === "cancelled";

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Return Progress
        </h3>
        {isRejected ? (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-600 uppercase border border-rose-100">
            Rejected
          </span>
        ) : status === "completed" ? (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 uppercase">
            Completed
          </span>
        ) : (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
            In Progress
          </span>
        )}
      </div>

      {/* Vertical Steps */}
      <div className="space-y-0">
        {RETURN_STEPS.map((step, index) => {
          const isFinalCompleted = status === "completed";

          const completed = !isRejected && index <= currentIndex;

          const active = false;
          const isLast = index === RETURN_STEPS.length - 1;
          const stepLog = timeline.find((t) => t.status === step.key);

          return (
            <div key={step.key} className="flex gap-3.5">
              {/* Node Column */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    completed
                      ? "bg-slate-900 text-white"
                      : active
                        ? "bg-white text-slate-900 ring-2 ring-slate-900 font-bold"
                        : "bg-white text-slate-300 border border-slate-200"
                  }`}
                >
                  {completed ? (
                    <FiCheck size={12} strokeWidth={2.5} />
                  ) : (
                    <span className="text-[10px]">{index + 1}</span>
                  )}
                </div>

                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[28px] my-1 ${
                      completed ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                )}
              </div>

              {/* Step Details */}
              <div className="pb-5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={`text-xs font-medium ${
                      active || completed ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>

                  {stepLog && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {formatDateTime(stepLog.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      {timeline.length > 0 && (
        <div className="mt-2 pt-5 border-t border-slate-200/60">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Activity Log
          </h4>

          <div className="space-y-2">
            {[...timeline].reverse().map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="flex items-start justify-between gap-3 text-xs p-3 rounded-xl bg-white border border-slate-100 shadow-2xs"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-800 capitalize block">
                    {event.status.replace(/_/g, " ")}
                  </span>
                  {event.message && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {event.message}
                    </p>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {formatDateTime(event.timestamp)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
