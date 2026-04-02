import { useEffect, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
  decimals?: number;
}

const AnimatedCounter = ({
  target,
  suffix = "",
  prefix = "",
  label,
  duration = 2000,
  decimals = 0,
}: AnimatedCounterProps) => {
  const { ref, isVisible } = useScrollAnimation(0.3);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isVisible, target, duration]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="text-3xl font-extrabold text-primary">
        {prefix}
        {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
        {suffix}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};

export default AnimatedCounter;
