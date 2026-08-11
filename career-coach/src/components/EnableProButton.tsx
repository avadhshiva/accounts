"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnableProButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      className="btn btn-primary text-sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/test/pro", { method: "POST" });
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? "Enabling..." : "Enable Pro for testing"}
    </button>
  );
}
