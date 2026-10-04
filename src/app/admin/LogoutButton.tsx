"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading,setLoading]=useState(false);
  async function logout() {
    setLoading(true);
    await fetch("/api/v1/auth/logout",{method:"POST"});
    window.location.href="/admin/login";
  }
  return <button type="button" onClick={logout} disabled={loading}>{loading?"در حال خروج…":"خروج"}</button>;
}