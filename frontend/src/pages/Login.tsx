import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, ChevronLeft, LockKeyhole, Mail, Sparkles, User, UserPlus } from "lucide-react";
import { toast } from "@/lib/toast";
import { playSound } from "@/lib/sounds";
import { Field, FormNotice, GiInput, PasswordInput, Spinner } from "@/components/forms";
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
  const [touched, setTouched] = useState(false);
  const next = new URLSearchParams(window.location.search).get("next") || "/";

  // Register and login return the same { token, user } payload, so one handler finishes either flow.
  const finish = async (data: { token: string; user: { name: string; role: string } }) => {
    setToken(data.token);
    await utils.auth.me.invalidate();
    toast.success(`Welcome, ${data.user.name}`);
    const explicitNext = next.startsWith("/") && !next.startsWith("/login") && next !== "/";
    navigate(explicitNext ? next : data.user.role === "admin" ? "/admin" : "/");
  };
  // A rejected sign-in or registration plays the error sound; success is sounded by the welcome toast.
  const fail = (e: { message: string }) => { playSound("error"); setError(e.message); };
  const login = trpc.auth.login.useMutation({ onSuccess: finish, onError: fail });
  const register = trpc.auth.register.useMutation({ onSuccess: finish, onError: fail });
  const pending = login.isPending || register.isPending;

  const fieldErrors = {
    name: touched && mode === "register" && !name.trim() ? "Enter your full name." : "",
    email: touched && !/^\S+@\S+\.\S+$/.test(email) ? "Enter a valid email address." : "",
    password: touched && password.length < 8 ? "At least 8 characters." : "",
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    setTouched(true);
    if ((mode === "register" && !name.trim()) || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) { playSound("error"); return; }
    if (mode === "login") login.mutate({ email, password });
    else register.mutate({ name, email, password });
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setTouched(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-bg" aria-hidden="true" />
      <div className="auth-page-center">
        <div className="auth-card">
          <div className="auth-card-top">
            <Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link>
            <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p>{mode === "login" ? "Please enter your credentials to continue." : "Your email and a password of at least 8 characters."}</p>
          </div>

          <form className="gi-form" onSubmit={submit} noValidate>
            {mode === "register" && (
              <Field label="Full name" required icon={<User size={18} />} htmlFor="auth-name" error={fieldErrors.name}>
                <GiInput id="auth-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aline Mukamana" autoComplete="name" />
              </Field>
            )}
            <Field label="Email address" required icon={<Mail size={18} />} htmlFor="auth-email" error={fieldErrors.email}>
              <GiInput id="auth-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. user@domain.example" autoComplete="email" />
            </Field>
            <Field label="Password" required icon={<LockKeyhole size={18} />} htmlFor="auth-password" error={fieldErrors.password}>
              <PasswordInput id="auth-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} />
            </Field>
            {error && <FormNotice>{error}</FormNotice>}
            <button type="submit" className="gi-btn-primary" disabled={pending}>
              {pending ? <><Spinner /> Please wait</> : mode === "login" ? <>Login <ArrowRight size={16} /></> : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-switch">
            <p>{mode === "login" ? "New here?" : "Already have an account?"}</p>
            <button type="button" className="gi-btn-outlined" onClick={switchMode} disabled={pending}>
              {mode === "login" ? <><UserPlus size={14} /> Create an account</> : <><LockKeyhole size={14} /> Sign in</>}
            </button>
          </div>

          <button type="button" className="back-button auth-back" onClick={() => navigate("/")}><ChevronLeft size={16} /> Back to home</button>
          <p className="auth-foot">© {new Date().getFullYear()} GradInvite. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
