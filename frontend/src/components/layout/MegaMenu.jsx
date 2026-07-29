import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SHOP_MENU } from "@constants";
import { NavLink } from "react-router-dom";

export default function MegaMenu() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, x: "-50%" }}
      animate={{ opacity: 1, y: 0, x: "-50%" }}
      exit={{ opacity: 0, y: 10, x: "-50%" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-full left-1/2 mt-4 w-[800px] p-8 rounded-3xl bg-white border border-gray-100 shadow-2xl z-50"
    >
      {/* Updated to grid-cols-3 to fit 3 link columns cleanly */}
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
                    key={item.href}
                    to={item.href}
                    className="group flex items-center justify-between rounded-xl px-3 py-2 transition-all duration-200 hover:bg-brand-50 hover:text-brand-700"
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
