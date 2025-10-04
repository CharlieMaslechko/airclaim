import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@vector/ui/lib/utils";

const shapeVariants: Variants = {
  float: (duration: number) => ({
    y: [0, -20, 0],
    transition: {
      duration,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  }),
};

// === Extracted Classes ===
const containerClasses = cn(
  "relative flex flex-1 flex-col justify-center overflow-hidden",
  "bg-gradient-to-br from-[--primary] to-[color:oklch(from_var(--primary)_l_c_h_/_0.8)]",
  "absolute inset-0"
);

const topRightShapeClasses = cn(
  "absolute z-0 rounded-full",
  "-right-24 -top-24 sm:-right-12 sm:-top-12",
  "h-72 w-72 sm:h-36 sm:w-36 md:h-48 md:w-48",
  "bg-[oklch(from_var(--primary-foreground)_l_c_h_/_0.1)]"
);

const bottomLeftShapeClasses = cn(
  "absolute z-0 rounded-full",
  "-bottom-12 -left-12 sm:-bottom-8 sm:-left-8",
  "h-48 w-48 sm:h-36 sm:w-36 md:h-48 md:w-48",
  "bg-[oklch(from_var(--primary-foreground)_l_c_h_/_0.08)]"
);

const dotsGridClasses = cn(
  "absolute bottom-4 left-4 z-0",
  "grid grid-cols-4 gap-1.5",
  "sm:bottom-6 sm:left-6 sm:grid-cols-5 sm:gap-2",
  "md:bottom-8 md:left-8"
);

const dotClasses = cn(
  "h-1.5 w-1.5 rounded-full",
  "bg-[oklch(from_var(--primary-foreground)_l_c_h_/_0.3)]",
  "sm:h-2 sm:w-2"
);

// === Floating Shape Reusable ===
const FloatingShape = ({
  className,
  duration,
}: {
  className: string;
  duration: number;
}) => (
  <motion.div
    aria-hidden="true"
    variants={shapeVariants}
    animate="float"
    custom={duration}
    className={className}
  />
);

// === Main Component ===
const FloatingShapeBackground: React.FC = () => {
  return (
    <div data-testid="login-hero-section" className={containerClasses}>
      {/* Decorative Shapes */}
      <FloatingShape className={topRightShapeClasses} duration={12} />
      <FloatingShape className={bottomLeftShapeClasses} duration={10} />
      {/* Decorative Dots */}
      <div aria-hidden="true" className={dotsGridClasses}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={dotClasses} />
        ))}
      </div>
    </div>
  );
};

export default FloatingShapeBackground;
