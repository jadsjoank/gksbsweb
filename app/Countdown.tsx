"use client";

import { useState, useEffect } from "react";

interface EventItem {
  id: string;
  title: string;
  start_date: string;
}

export function Countdown({ events }: { events: EventItem[] }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [eventTitle, setEventTitle] = useState<string>("");

  useEffect(() => {
    if (!events || events.length === 0) {
      setTimeLeft("");
      setEventTitle("");
      return;
    }

    const calculateCountdown = () => {
      const now = new Date();
      const nextEvent = events[0];
      const eventDateTime = new Date(nextEvent.start_date);

      if (eventDateTime < now) {
        setTimeLeft("");
        setEventTitle("");
        return;
      }

      const diff = eventDateTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days} hari - ${hours} jam - ${minutes} menit`);
      setEventTitle(nextEvent.title);
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 60000);
    return () => clearInterval(timer);
  }, [events]);

  if (!timeLeft) return null;

  return (
    <p>{timeLeft} — {eventTitle}</p>
  );
}
