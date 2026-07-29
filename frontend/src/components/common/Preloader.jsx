import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setPreloaderDone } from "@store/index";

export default function Preloader() {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2400;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(
        Math.floor((elapsed / duration) * 100),
        100,
      );
      setProgress(currentProgress);

      if (currentProgress >= 100) clearInterval(timer);
    }, 16);

    const t = setTimeout(() => {
      setVisible(false);
      dispatch(setPreloaderDone());
    }, 2800);

    return () => {
      clearInterval(timer);
      clearTimeout(t);
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

  // Ultra-Premium 3D Cinematic Letter Variant
  const letter3DVariants = {
    hidden: {
      rotateX: -105,
      rotateY: 45,
      z: -300,
      opacity: 0,
      filter: "blur(12px)",
      scale: 0.7,
    },
    visible: {
      rotateX: 0,
      rotateY: 0,
      z: 0,
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        duration: 1.4,
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
          initial={{ opacity: 1 }}
          exit={{
            clipPath: "inset(0% 0% 100% 0%)",
            transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-12 px-8 bg-[#05070c] overflow-hidden select-none"
        >
          {/* Dynamic 3D Perspective Canvas */}
          <div className="absolute inset-0 perspective-[1200px] pointer-events-none overflow-hidden">
            {/* Original Ambient Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-brand-500/10 rounded-full blur-[140px]" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />

            {/* Light Flare Sweep Across Center */}
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: [0, 0.4, 0], x: "100%" }}
              transition={{ duration: 2.2, delay: 0.8, ease: "easeInOut" }}
              className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white to-transparent blur-xs"
            />
          </div>

          {/* Architectural Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.07]">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white to-transparent"
                style={{ left: `${(i + 1) * 16.66}%` }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  delay: i * 0.06,
                  duration: 1.4,
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
          <div className="relative z-10 text-center my-auto perspective-[1000px]">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center transform-style-3d"
            >
              {/* "ONE" - Metallic White 3D Text */}
              <div className="flex justify-center font-display font-black text-7xl md:text-[11rem] tracking-tight leading-none transform-style-3d py-2">
                {textOne.map((char, index) => (
                  <motion.span
                    key={index}
                    variants={letter3DVariants}
                    className="inline-block relative transform-gpu text-white"
                    style={{
                      transformStyle: "preserve-3d",
                      textShadow: `
                        0 1px 0 #ffffff,
                        0 2px 0 #cccccc,
                        0 3px 0 #bbbbbb,
                        0 4px 0 #aaaaaa,
                        0 10px 20px rgba(0,0,0,0.8),
                        0 20px 40px rgba(0,0,0,0.6)
                      `,
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>

              {/* "PIECE" - Original Brand Palette 3D Text */}
              <div className="flex justify-center font-display font-black text-7xl md:text-[11rem] tracking-tight leading-none transform-style-3d -mt-2 md:-mt-6 py-2">
                {textPiece.map((char, index) => (
                  <motion.span
                    key={index}
                    variants={letter3DVariants}
                    className="inline-block relative transform-gpu text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-brand-400 to-brand-300"
                    style={{
                      transformStyle: "preserve-3d",
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
                    delay: 1.2,
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

          {/* Bottom Bar: Loading Bar */}
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
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-400 to-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
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
