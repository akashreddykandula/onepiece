import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setPreloaderDone } from "@store/index";

export default function Preloader() {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 2400; // 2.4 seconds loading cycle

    // Smooth High-FPS Progress Counter via requestAnimationFrame
    const updateProgress = (now) => {
      const elapsed = now - startTime;
      const calculated = Math.min(Math.floor((elapsed / duration) * 100), 100);

      setProgress(calculated);

      if (calculated < 100) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);

    // Trigger exit transition
    const timeoutId = setTimeout(() => {
      setVisible(false);
      dispatch(setPreloaderDone());
    }, 2800);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutId);
    };
  }, [dispatch]);

  // Stagger Container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  // Ultra-Smooth 3D Cinematic Letter Variant
  const letter3DVariants = {
    hidden: {
      rotateX: -90,
      rotateY: 30,
      z: -200,
      opacity: 0,
      filter: "blur(10px)",
      scale: 0.8,
    },
    visible: {
      rotateX: 0,
      rotateY: 0,
      z: 0,
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1], // Custom luxury cubic-bezier
      },
    },
  };

  const textOne = "ONE".split("");
  const textPiece = "PIECE".split("");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{
            opacity: 0,
            clipPath: "inset(0% 0% 100% 0%)",
            transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-8 bg-[#05070c] overflow-hidden select-none"
          style={{
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Dynamic Ambient Background & Light Effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Glow Orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] transform-gpu" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] transform-gpu" />

            {/* Light Flare Sweep Across Center */}
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: [0, 0.5, 0], x: "100%" }}
              transition={{ duration: 2.2, delay: 0.8, ease: "easeInOut" }}
              className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent blur-[1px] transform-gpu"
            />
          </div>

          {/* Architectural Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white to-transparent transform-gpu"
                style={{ left: `${(i + 1) * 16.66}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: i * 0.06,
                  duration: 1.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>

          {/* Top Bar */}
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

          {/* Main 3D Logo Centerpiece */}
          <div
            className="relative z-10 text-center my-auto"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center"
              style={{
                transformStyle: "preserve-3d",
                WebkitTransformStyle: "preserve-3d",
              }}
            >
              {/* "ONE" - Metallic White 3D Text */}
              <div
                className="flex justify-center font-display font-black text-7xl md:text-[11rem] tracking-tight leading-none py-2"
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
              >
                {textOne.map((char, index) => (
                  <motion.span
                    key={index}
                    variants={letter3DVariants}
                    className="inline-block relative text-white transform-gpu will-change-transform"
                    style={{
                      transformStyle: "preserve-3d",
                      WebkitTransformStyle: "preserve-3d",
                      textShadow: `
                        0 1px 0 #ffffff,
                        0 2px 0 #cccccc,
                        0 3px 0 #bbbbbb,
                        0 4px 0 #aaaaaa,
                        0 10px 20px rgba(0,0,0,0.8)
                      `,
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* "PIECE" - Brand Gradient 3D Text */}
              <div
                className="flex justify-center font-display font-black text-7xl md:text-[11rem] tracking-tight leading-none -mt-2 md:-mt-6 py-2"
                style={{
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d",
                }}
              >
                {textPiece.map((char, index) => (
                  <motion.span
                    key={index}
                    variants={letter3DVariants}
                    className="inline-block relative transform-gpu will-change-transform text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-brand-400 to-brand-300"
                    style={{
                      transformStyle: "preserve-3d",
                      WebkitTransformStyle: "preserve-3d",
                      filter: "drop-shadow(0px 15px 25px rgba(0,0,0,0.9))",
                      WebkitTextStroke: "1px rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* Tagline */}
              <div className="overflow-hidden mt-6">
                <motion.p
                  initial={{ y: "100%", opacity: 0, letterSpacing: "0.2em" }}
                  animate={{ y: "0%", opacity: 0.6, letterSpacing: "0.6em" }}
                  transition={{
                    delay: 1.1,
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

          {/* Bottom Bar: Progress Tracking */}
          <div className="w-full max-w-sm z-10 flex flex-col items-center gap-3">
            <div className="w-full flex justify-between items-center text-white/50 text-[10px] font-mono tracking-widest">
              <span>LOADING</span>
              <span className="text-white">
                {String(progress).padStart(3, "0")}%
              </span>
            </div>

            {/* Ultra-Fine Track */}
            <div className="w-full h-[1.5px] bg-white/10 relative overflow-hidden rounded-full">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transform-gpu"
                style={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
