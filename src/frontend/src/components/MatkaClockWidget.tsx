import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

export function MatkaClockWidget() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subtract 7 hours
  const adjustedTime = new Date(time.getTime() - 7 * 60 * 60 * 1000);

  const hh = String(adjustedTime.getHours()).padStart(2, "0");
  const mm = String(adjustedTime.getMinutes()).padStart(2, "0");
  const ss = String(adjustedTime.getSeconds()).padStart(2, "0");

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayName = dayNames[adjustedTime.getDay()];
  const date = adjustedTime.getDate();
  const month = monthNames[adjustedTime.getMonth()];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border/50">
      <Clock className="w-3.5 h-3.5 text-fire shrink-0" />
      <div className="flex flex-col items-start leading-none">
        <span className="font-mono text-sm font-bold text-gold tracking-wider number-glow">
          {hh}:{mm}:{ss}
        </span>
        <span className="text-[10px] text-muted-foreground font-body">
          {dayName}, {date} {month} · IST−7h
        </span>
      </div>
    </div>
  );
}
