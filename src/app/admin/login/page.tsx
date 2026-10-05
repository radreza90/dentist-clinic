"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(event:FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response=await fetch("/api/v1/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password}),
      });
      const payload=await response.json();
      if(!response.ok||!payload.success) {
        setError(payload.error?.message||"ورود ناموفق بود.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f7f8fa",fontFamily:"var(--font-vazirmatn),sans-serif"}}>
      <form onSubmit={submit} style={{width:"100%",maxWidth:420,padding:28,border:"1px solid #ddd",borderRadius:16,background:"#fff"}}>
        <h1 style={{marginTop:0}}>ورود به پنل مدیریت</h1>
        <label style={{display:"grid",gap:8,marginBottom:16}}>ایمیل<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" required style={{padding:12}} /></label>
        <label style={{display:"grid",gap:8,marginBottom:16}}>رمز عبور<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" minLength={8} required style={{padding:12}} /></label>
        {error && <p style={{color:"#b42318"}}>{error}</p>}
        <button disabled={loading} type="submit" style={{width:"100%",padding:12}}>{loading?"در حال ورود…":"ورود"}</button>
      </form>
    </main>
  );
}