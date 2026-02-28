import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Profile page removed — redirects to home
export function ProfilePage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);
  return null;
}
