import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SHOP_MENU } from "@constants";

export default function MegaMenu() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-[750px] rounded-3xl bg-white border border-gray-100 shadow-2xl p-8 z-50"
    >
      <nav aria-label="Shop Menu" className="grid grid-cols-3 gap-8">
        {SHOP_MENU.map((section) => (
          <div key={section.title} className="flex flex-col space-y-4">
            <h3 className="font-bold text-brand-900 text-sm uppercase tracking-wider">
              {section.title}
            </h3>

            <ul className="space-y-2.5">
              {section.links.map((item) => (
                <li key={item.href || item.label}>
                  <Link
                    to={item.href}
                    className="group flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200 hover:bg-brand-50 hover:text-brand-700 text-sm text-gray-700"
                  >
                    <span>{item.label}</span>
                    <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </motion.div>
  );
}
