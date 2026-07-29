import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setPreloaderDone } from "@store/index";

export default function Preloader() {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth high-fps luxury counter
    const startTime = Date.now();
    const duration = 2200;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(
        Math.floor((elapsed / duration) * 100),
        100,
      );
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timer);
      }
    }, 16);

    const t = setTimeout(() => {
      setVisible(false);
      dispatch(setPreloaderDone());
    }, 2500);

    return () => {
      clearInterval(timer);
      clearTimeout(t);
    };
  }, [dispatch]);

  // Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  };

  const charVariants = {
    hidden: {
      y: "110%",
      rotateX: -80,
      opacity: 0,
      filter: "blur(8px)",
    },
    visible: {
      y: "0%",
      rotateX: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1], // Custom cinematic spring bezier
      },
    },
  };

  const textOne = "ONE".split("");
  const textPiece = "PIECE".split("");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            clipPath: "inset(0% 0% 100% 0%)",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-8 bg-[#05070c] overflow-hidden select-none"
        >
          {/* Ambient Luxury Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Architectural Grid Lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white to-transparent"
                style={{ left: `${(i + 1) * 16.66}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: i * 0.08,
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>

          {/* Top Bar: Brand Identifier */}
          <div className="w-full max-w-7xl flex justify-between items-center text-white/40 text-[10px] font-mono tracking-[0.3em] uppercase z-10">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              ONE PIECE FASHIONS
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Collection 2026
            </motion.span>
          </div>

          {/* Main Logo Centerpiece */}
          <div className="relative z-10 text-center my-auto perspective-1000">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
            >
              {/* "ONE" - Masked Reveal */}
              <div className="overflow-hidden py-1">
                <div className="flex justify-center font-display font-black text-white text-7xl md:text-[11rem] tracking-tight leading-none">
                  {textOne.map((char, index) => (
                    <motion.span
                      key={index}
                      variants={charVariants}
                      className="inline-block transform-gpu"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* "PIECE" - Masked Reveal */}
              <div className="overflow-hidden py-1 -mt-2 md:-mt-6">
                <div className="flex justify-center font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-brand-400 to-brand-300 text-7xl md:text-[11rem] tracking-tight leading-none">
                  {textPiece.map((char, index) => (
                    <motion.span
                      key={index}
                      variants={charVariants}
                      className="inline-block transform-gpu"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Minimalist Subtitle */}
              <div className="overflow-hidden mt-6">
                <motion.p
                  initial={{ y: "100%", opacity: 0, letterSpacing: "0.2em" }}
                  animate={{ y: "0%", opacity: 0.6, letterSpacing: "0.6em" }}
                  transition={{
                    delay: 1.0,
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="text-white text-[10px] md:text-xs uppercase font-sans font-light pl-[0.6em]"
                >
                  Your Statement. Your Style.
                </motion.p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar: High-End Progress Tracker */}
          <div className="w-full max-w-sm z-10 flex flex-col items-center gap-3">
            <div className="w-full flex justify-between items-center text-white/50 text-[10px] font-mono tracking-widest">
              <span>LOADING</span>
              <span>{String(progress).padStart(3, "0")}%</span>
            </div>

            {/* Ultra-Fine Progress Track */}
            <div className="w-full h-[1.5px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-white rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
