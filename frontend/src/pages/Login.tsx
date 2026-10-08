import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, LockKeyhole, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { setToken } from "@/const";

type Mode = "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const next = new URLSearchParams(window.location.search).get("next") || "/";

  // Register and login return the same { token, user } payload, so one handler finishes either flow.
  const finish = async (data: { token: string; user: { name: string; role: string } }) => {
    setToken(data.token);
    await utils.auth.me.invalidate();
    toast.success(`Welcome, ${data.user.name}`);
    const explicitNext = next.startsWith("/") && !next.startsWith("/login") && next !== "/";
    navigate(explicitNext ? next : data.user.role === "admin" ? "/admin" : "/");
  };
  const login = trpc.auth.login.useMutation({ onSuccess: finish, onError: (e) => setError(e.message) });
  const register = trpc.auth.register.useMutation({ onSuccess: finish, onError: (e) => setError(e.message) });
  const pending = login.isPending || register.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ name, email, password });
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="simple-page">
      <header className="minimal-nav">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link>
        <button className="back-button" onClick={() => navigate("/")}><ChevronLeft size={16} /> Home</button>
      </header>
      <main className="view-main">
        <div className="view-heading">
          <Badge className="eyebrow">{mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}</Badge>
          <h1>{mode === "login" ? <>Sign in<br /><em>to continue.</em></> : <>Join<br /><em>gradinvite.</em></>}</h1>
          <p>{mode === "login" ? "Use the email and password you registered with." : "Create an account with your email and a password of at least 8 characters."}</p>
        </div>
        <form className="view-auth" onSubmit={submit}>
          <LockKeyhole size={21} />
          {mode === "register" && (
            <>
              <label>Full name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aline Mukamana" autoComplete="name" required />
            </>
          )}
          <label>Email address</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <label>Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
          {error && <div className="form-error">{error}</div>}
          <Button type="submit" className="primary-button full-button" disabled={pending}>
            {pending ? "Please wait" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={16} />
          </Button>
          <button type="button" className="text-link-button" style={{ marginTop: 16 }} onClick={switchMode}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"} <ArrowRight size={15} />
          </button>
        </form>
      </main>
    </div>
  );
}
