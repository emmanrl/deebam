import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingBag, ShieldCheck, MapPin, Sparkles, Timer } from 'lucide-react';

interface Slide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  bgGradient: string;
  icon: React.ReactNode;
  featureList: string[];
}

export const HeroCarousel: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  const [current, setCurrent] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      badge: "Premium UK Grocery Delivery 🌾",
      title: "Authentic African Flavors, Delivered Fresh Daily.",
      subtitle: "Shop high-quality Yam tubers, sweet plantains, authentic flours, original spices, and premium grocery staples at Deebam Afromart.",
      buttonText: "Shop Fresh Produce",
      bgGradient: "from-earth-green-700 via-earth-green-800 to-earth-green-950",
      icon: <ShoppingBag className="h-16 w-16 text-warm-gold-500 mx-auto stroke-[1.2] animate-bounce" />,
      featureList: ["100% Authentic Quality", "Direct Import", "Secure SSL Payments"]
    },
    {
      id: 2,
      badge: "Flat 15% Off This Week 🍲",
      title: "Savor Traditional Soups & Spices!",
      subtitle: "Get exclusive discounts on white Gari, Palm Oil, whole Egusi seeds, Stockfish, and premium ground pepper. Sourced directly from our trusted partners.",
      buttonText: "Explore Weekly Specials",
      bgGradient: "from-amber-800 via-amber-900 to-slate-950",
      icon: <Sparkles className="h-16 w-16 text-warm-gold-400 mx-auto stroke-[1.2]" />,
      featureList: ["No artificial colors", "Hand-picked spices", "Traditional recipes"]
    },
    {
      id: 3,
      badge: "UK Mainland Same-Day Dispatch 🚚",
      title: "Doorstep Delivery Across The United Kingdom.",
      subtitle: "Get same-day dispatch on orders placed before 12:00 PM. Safely packaged, tracked, and delivered with standard ambient and thermal preservation.",
      buttonText: "Track Your Order",
      bgGradient: "from-emerald-800 via-emerald-900 to-slate-950",
      icon: <Timer className="h-16 w-16 text-emerald-400 mx-auto stroke-[1.2]" />,
      featureList: ["Mainland Shipping", "Insulated packaging", "Flexible timeslots"]
    }
  ];

  // Auto-play interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white select-none rounded-3xl" id="hero-carousel-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`bg-gradient-to-br ${slides[current].bgGradient} relative min-h-[460px] flex items-center`}
        >
          {/* Radial decorative highlight overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_50%)]" />

          <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 lg:px-16 py-14 sm:py-20 flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            {/* Slide Information */}
            <div className="max-w-xl space-y-6 text-center md:text-left flex-1">
              <motion.span
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center px-4 py-1.5 bg-white/10 backdrop-blur-md text-warm-gold-400 border border-white/5 rounded-full text-xs font-extrabold tracking-wider uppercase shadow-md"
              >
                {slides[current].badge}
              </motion.span>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display font-black text-3xl sm:text-5xl tracking-tight text-white leading-[1.12]"
              >
                {slides[current].title}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-lg font-medium"
              >
                {slides[current].subtitle}
              </motion.p>

              {/* Badges / bullet lists */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-semibold text-slate-100"
              >
                {slides[current].featureList.map((feat, index) => (
                  <span key={index} className="flex items-center space-x-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
                    <ShieldCheck className="h-4 w-4 text-warm-gold-500 flex-shrink-0" />
                    <span>{feat}</span>
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-2"
              >
                <button
                  onClick={onExplore}
                  className="px-8 py-3.5 bg-warm-gold-500 text-earth-green-950 font-extrabold rounded-2xl hover:bg-warm-gold-400 hover:scale-102 hover:shadow-lg hover:shadow-warm-gold-500/10 active:scale-98 transition-all text-sm cursor-pointer"
                >
                  {slides[current].buttonText}
                </button>
              </motion.div>
            </div>

            {/* Illustration Section */}
            <div className="hidden lg:block relative w-[320px] flex-shrink-0" id={`slide-illustration-${slides[current].id}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl text-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                {slides[current].icon}
                <h3 className="font-display font-extrabold text-white text-xl mt-6">Deebam Afromart</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed px-2">Premium quality West African & Caribbean grocery items delivered UK-wide.</p>
                <div className="mt-4 inline-flex items-center space-x-1 text-xs text-warm-gold-400 font-bold">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>United Kingdom Store</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/15 border border-white/5 hover:bg-black/30 text-white/70 hover:text-white transition-all cursor-pointer z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/15 border border-white/5 hover:bg-black/30 text-white/70 hover:text-white transition-all cursor-pointer z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Navigation Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              current === idx ? 'w-8 bg-warm-gold-500' : 'w-2.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
