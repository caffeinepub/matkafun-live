import { useEffect, useState } from "react";

/**
 * Returns the current "matka time" — 7 hours behind real time.
 * Updates every second.
 */
export function useMatkaTime(): Date {
  const [matkaTime, setMatkaTime] = useState<Date>(
    () => new Date(Date.now() - 7 * 60 * 60 * 1000),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMatkaTime(new Date(Date.now() - 7 * 60 * 60 * 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return matkaTime;
}
