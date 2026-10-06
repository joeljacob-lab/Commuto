import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoveRight, Car } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

export function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => [
      "fairly",
      "together",
      "safely",
      "seamlessly",
      "reliably"
    ],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2400);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full relative overflow-hidden bg-background">
      {/* Ambient background glow and grid */}
      <div className="absolute inset-0 theme-glow-warm pointer-events-none" />
      <div className="absolute inset-0 theme-dot-pattern opacity-60 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex gap-8 pt-26 pb-20 lg:pt-42 lg:pb-36 items-center justify-center flex-col">
          
          {/* Headline with dynamic rotating title */}
          <div className="flex gap-5 flex-col items-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl max-w-4xl tracking-tighter text-center font-serif text-foreground leading-[1.15]">
              <span>Split daily campus fuel</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center h-[1.3em] font-sans">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={titleNumber}
                    className="absolute text-primary font-bold italic"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  >
                    {titles[titleNumber]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Turn your college&apos;s fixed timetable into an internal transit network. 
              Verified classmates traveling the same corridor split fuel cost through the transparent 
              <strong className="text-foreground font-semibold"> Equal Split Model</strong> and automated escrow.
            </p>
          </div>

          {/* Action CTAs */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto items-center justify-center pt-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link to="/search-rides" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-3 text-sm sm:text-base font-semibold shadow-md">
                Find a Campus Ride <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2.5 text-sm sm:text-base">
                <Car className="w-4 h-4 text-primary" />
                Drive &amp; Offer Seats
              </Button>
            </Link>
          </motion.div>

          {/* Live Micro-Stats Bar */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4.5 w-full max-w-3xl mt-6 pt-6 border-t border-border/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* Card 1 */}
            <div className="group relative bg-white/40 dark:bg-stone-900/40 backdrop-blur-md hover:backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-white/60 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(155,44,44,0.06)] hover:shadow-[0_12px_28px_-4px_rgba(155,44,44,0.18)] hover:-translate-y-1.5 hover:scale-[1.03] transition-all duration-300 ease-out text-center cursor-default overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-xl sm:text-2xl font-black font-mono text-primary tracking-tight group-hover:scale-105 transition-transform duration-300">
                  100%
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1 tracking-tight leading-snug group-hover:text-foreground transition-colors">
                  College Domain Verified
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-white/40 dark:bg-stone-900/40 backdrop-blur-md hover:backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-white/60 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(155,44,44,0.06)] hover:shadow-[0_12px_28px_-4px_rgba(155,44,44,0.18)] hover:-translate-y-1.5 hover:scale-[1.03] transition-all duration-300 ease-out text-center cursor-default overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                  Equal Split
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1 tracking-tight leading-snug group-hover:text-foreground transition-colors">
                  Driver + Rider Shared
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-white/40 dark:bg-stone-900/40 backdrop-blur-md hover:backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-white/60 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(155,44,44,0.06)] hover:shadow-[0_12px_28px_-4px_rgba(155,44,44,0.18)] hover:-translate-y-1.5 hover:scale-[1.03] transition-all duration-300 ease-out text-center cursor-default overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-xl sm:text-2xl font-black font-mono text-primary tracking-tight group-hover:scale-105 transition-transform duration-300">
                  9:00 PM
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1 tracking-tight leading-snug group-hover:text-foreground transition-colors">
                  Automated Roster Lock
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="group relative bg-white/40 dark:bg-stone-900/40 backdrop-blur-md hover:backdrop-blur-lg p-4 sm:p-5 rounded-xl border border-white/60 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(155,44,44,0.06)] hover:shadow-[0_12px_28px_-4px_rgba(155,44,44,0.18)] hover:-translate-y-1.5 hover:scale-[1.03] transition-all duration-300 ease-out text-center cursor-default overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative z-10">
                <div className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight group-hover:text-primary group-hover:scale-105 transition-all duration-300">
                  Zero Cash
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1 tracking-tight leading-snug group-hover:text-foreground transition-colors">
                  Protected Escrow Wallet
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

export default Hero;