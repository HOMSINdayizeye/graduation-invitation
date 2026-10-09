import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clipboard,
  Download,
  ExternalLink,
  FileDown,
  Gift,
  GraduationCap,
  ImagePlus,
  Link2,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  QrCode,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { canShare, canShareFiles, copyText, downloadBlob, downloadCsv, letterToPng, qrDataUrl, qrPosterBlob, shareFile, shareLink, shrinkImage, slug } from "@/lib/share";
import { playSound } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { isValidRwandaMobile } from "@shared/gradinvite";
import { DEFAULT_TEMPLATES } from "@shared/templates";
import { trpc } from "@/lib/trpc";
import Admin from "./Admin";
import { useAuth } from "@/_core/hooks/useAuth";
import Login from "./Login";

type TemplateItem = (typeof DEFAULT_TEMPLATES)[number];

// Templates come from MongoDB (admin-editable); the built-in list is the fallback while loading or offline.
function useTemplates(includeHidden = false): TemplateItem[] {
  const query = trpc.templates.list.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const list = (query.data as TemplateItem[] | undefined) ?? DEFAULT_TEMPLATES;
  return includeHidden ? list : list.filter((item) => item.active !== false);
}

// Every invitee gets a unique id so a guest link can be matched exactly.
const createInvitee = () => ({ id: crypto.randomUUID(), name: "", phone: "" });

// A verified email gets a 24h token, kept in localStorage so returning creators are not asked for a new code.
const TOKEN_KEY = "gradinvite-creator-token";
type CreatorSession = { token: string; email: string };
const setCreatorToken = (token?: string) => { if (!token) return; try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ } };
const clearCreatorSession = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* nothing to clear */ } };
// Reads the email and expiry from the token payload, so an expired token is ignored without a server call.
const getCreatorSession = (): CreatorSession | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.email || (payload.exp && payload.exp * 1000 < Date.now())) return null;
    return { token, email: String(payload.email) };
  } catch { return null; }
};
const getCreatorToken = () => getCreatorSession()?.token ?? "";

function saveLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app remains usable if browser storage is unavailable.
  }
}

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  if (!value) return "Saturday, 12 December 2026";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function TemplateMiniCard({ template, selected, onClick }: { template: TemplateItem; selected?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`template-mini ${template.className} ${selected ? "is-selected" : ""}`}>
      <div className="mini-topline"><span>GRADUATION</span><span>2026</span></div>
      {template.sampleImage ? <img className="mini-photo" src={template.sampleImage} alt="" /> : <div className="mini-monogram">{template.monogram}</div>}
      <div className="mini-name">{template.sampleName}</div>
      <div className="mini-rule" style={{ backgroundColor: template.accent }} />
      <div className="mini-meta">A day worth remembering</div>
      {selected && <span className="selected-check"><Check size={14} /></span>}
    </button>
  );
}

function PublicNav({ onCreate }: { onCreate: () => void }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  return (
    <header className="site-nav">
      <Link href="/" className="brand-lockup">
        <span className="brand-mark"><Sparkles size={15} /></span>
        <span>grad<span>invite</span></span>
      </Link>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
      <nav className={`nav-links ${open ? "nav-open" : ""}`}>
        <a href="#templates" onClick={() => setOpen(false)}>Templates</a>
        <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
        <button className="nav-text-button" onClick={() => { navigate("/view"); setOpen(false); }}>View my creations</button>
        {user?.role === "admin" && <Button className="nav-cta nav-dashboard" onClick={() => { navigate("/admin"); setOpen(false); }}><LockKeyhole size={14} /> Dashboard</Button>}
        {user ? <button className="nav-text-button" onClick={() => { logout(); toast.success("Signed out"); setOpen(false); }}>Sign out ({user.name.split(" ")[0]})</button> : <button className="nav-text-button" onClick={() => { navigate("/login"); setOpen(false); }}>Sign in</button>}
        <Button className="nav-cta" onClick={() => { onCreate(); setOpen(false); }}>Create invitation <ArrowRight size={15} /></Button>
      </nav>
    </header>
  );
}

// White snowy edge with drips along the top of the hero.
function SnowTop() {
  return (
    <svg className="snow-top" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#fff" d="M0 0h1440v38c-30 18-58 40-90 36-36-4-40-50-80-46-40 4-44 60-84 56-36-4-46-46-86-40-40 6-46 70-96 64-44-6-50-60-100-56-50 4-60 42-104 44-50 2-66-36-112-40-52-4-70 48-120 50-48 2-60-36-100-40-44-4-64 30-110 34-48 4-58-30-100-32-44-2-54 34-100 36-46 2-56-32-98-32-40 0-50 20-70 20V0z" />
      <circle cx="310" cy="112" r="9" fill="#fff" /><circle cx="760" cy="118" r="7" fill="#fff" /><circle cx="1140" cy="110" r="8" fill="#fff" />
    </svg>
  );
}

// Soft pine silhouettes along the bottom corners, as in the reference banner.
function WinterTrees() {
  const tree = (x: number, h: number) => <path key={`${x}-${h}`} d={`M${x} 160 L${x - h * 0.45} 160 L${x} ${160 - h} L${x + h * 0.45} 160 Z`} />;
  return (
    <svg className="winter-trees" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
      <g fill="#c9bdf2">{tree(70, 110)}{tree(150, 150)}{tree(240, 100)}{tree(1230, 120)}{tree(1320, 155)}{tree(1400, 105)}</g>
      <g fill="#bfb2ee">{tree(110, 80)}{tree(200, 70)}{tree(1280, 85)}{tree(1370, 70)}</g>
    </svg>
  );
}

// Illustrated storefront, chart and control cards; the person image is supplied by the project owner at /hero-person.png.
function HeroWinterArt() {
  const [hasPerson, setHasPerson] = useState(true);
  return (
    <div className="hero-winter-art" aria-hidden="true">
      <span className="flake flake-a">❄</span><span className="flake flake-b">❄</span><span className="flake flake-c">❄</span>
      <div className="wc-store">
        <div className="wc-store-bar"><i /><i /><i /></div>
        <div className="wc-awning">{Array.from({ length: 7 }).map((_, i) => <span key={i} />)}</div>
        <div className="wc-store-body"><div className="wc-chart"><svg viewBox="0 0 160 70" preserveAspectRatio="none"><path d="M0 60 L30 48 L60 54 L95 28 L125 36 L160 8 V70 H0Z" fill="#f4b23c" /><path d="M0 60 L30 48 L60 54 L95 28 L125 36 L160 8" fill="none" stroke="#5b43c4" strokeWidth="3" /></svg></div></div>
      </div>
      <div className="wc-badge"><GraduationCap size={28} /></div>
      <div className="wc-card wc-card-lines"><span className="wc-line wide" /><span className="wc-line" /><span className="wc-line short" /></div>
      <div className="wc-card wc-card-download"><ArrowRight size={16} className="wc-down" /></div>
      <div className="wc-card wc-card-stars"><div className="wc-avatar"><Users size={14} /></div><div><span className="wc-dots" /><span className="wc-dots red" /></div></div>
      <div className="wc-card wc-card-controls">
        <div className="wc-slider"><span /></div>
        <div className="wc-tiles"><div className="wc-tile"><ArrowRight size={14} className="wc-down" /></div><div className="wc-tile"><ArrowRight size={14} className="wc-down" /></div></div>
      </div>
      {hasPerson ? (
        <img className="hero-winter-person" src="/hero-person.jpg" alt="" onError={() => setHasPerson(false)} />
      ) : (
        <div className="hero-winter-person placeholder"><span>Add your image at<br />public/hero-person.jpg</span></div>
      )}
    </div>
  );
}

function HomePage({ onCreate }: { onCreate: (templateId?: string) => void }) {
  const templates = useTemplates();
  return (
    <div className="public-page">
      <div className="hero-winter">
        <SnowTop />
        <PublicNav onCreate={() => onCreate()} />
        <section className="hero-winter-inner">
          <div className="hero-winter-copy">
            <h1>Graduation<br />Invites 2026<br />Edition</h1>
            <p className="hero-winter-sub">Complete toolkit for<br /><strong>Your Big Celebration</strong></p>
            <div className="hero-winter-actions">
              <Button className="hero-winter-cta" onClick={() => onCreate()}>Choose a template <ArrowRight size={16} /></Button>
              <a className="hero-winter-link" href="#how-it-works">See how it works</a>
            </div>
            <div className="hero-winter-trust"><span><ShieldCheck size={14} /> No password needed</span><span><Sparkles size={14} /> Ready to share</span></div>
            <span className="hero-winter-site">{typeof window === "undefined" ? "" : window.location.hostname}</span>
          </div>
          <HeroWinterArt />
        </section>
        <WinterTrees />
      </div>
      <main>

        <section className="feature-strip"><div><span className="feature-number">01</span><strong>Choose your style</strong><span>Start with a design that feels like you.</span></div><div><span className="feature-number">02</span><strong>Make it yours</strong><span>Add your story, dates and places.</span></div><div><span className="feature-number">03</span><strong>Send with ease</strong><span>Every guest gets their own invitation.</span></div></section>

        <section className="templates-section" id="templates">
          <div className="section-heading"><div><Badge className="eyebrow">THE COLLECTION</Badge><h2>Pick the feeling<br /><em>you want to share.</em></h2></div><p>Each template is designed to make the important details feel effortless — from the first look to the last RSVP.</p></div>
          <div className="template-grid">{templates.map((template) => <div className="template-showcase" key={template.id}><TemplateMiniCard template={template} onClick={() => onCreate(template.id)} /><div className="template-caption"><div><strong>{template.name}</strong><span>{template.subtitle}</span></div><button onClick={() => onCreate(template.id)} aria-label={`Use ${template.name}`}><ArrowRight size={17} /></button></div></div>)}</div>
        </section>

        <section className="how-section" id="how-it-works"><div className="how-intro"><Badge className="eyebrow">SIMPLE BY DESIGN</Badge><h2>Your invitation,<br /><em>without the fuss.</em></h2><p>There are no passwords to remember and no app to download. Just a beautiful way to bring your people together.</p><Button className="secondary-button" onClick={() => onCreate()}>Start creating <ArrowRight size={15} /></Button></div><div className="steps-list"><div className="step-item"><span>01</span><div><strong>Choose a template</strong><p>Browse the collection and choose the look that fits your celebration.</p></div></div><div className="step-item"><span>02</span><div><strong>Verify your email</strong><p>We send a one-time code. No account and no password required.</p></div></div><div className="step-item"><span>03</span><div><strong>Tell your story</strong><p>Add your details, both venues and the people you want to invite.</p></div></div><div className="step-item"><span>04</span><div><strong>Share your way</strong><p>Generate a personal link, a QR code, or both for every guest.</p></div></div></div></section>

        <section className="closing-section"><div className="closing-quote">“The best celebrations<br /><em>start with an invitation.”</em></div><div className="closing-side"><span className="closing-star">✦</span><p>Your graduation is a milestone. Let the invitation feel like one too.</p><Button className="primary-button" onClick={() => onCreate()}>Create yours <ArrowRight size={16} /></Button></div></section>
      </main>
      <footer className="site-footer"><div className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></div><span>Made for the people who made it possible.</span><span>© 2026 GradInvite</span></footer>
    </div>
  );
}

type OtpResult = { bypass: boolean; reason?: string; expiresInMinutes?: number; accessToken?: string };

function OtpStep({ email, setEmail, templateId, onVerified, onBack }: { email: string; setEmail: (s: string) => void; templateId: string; onVerified: () => void; onBack: () => void }) {
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const request = trpc.otp.request.useMutation({
    onSuccess: (result) => {
      const r = result as OtpResult;
      if (r.bypass) { setCreatorToken(r.accessToken); toast.info(r.reason); onVerified(); return; }
      setSent(true); setOtp(""); toast.success(`Code sent to ${email}`, { description: `It expires in ${r.expiresInMinutes} minutes.` });
    },
    onError: (e) => { playSound("error"); setError(e.message); },
  });
  // Email verified plays the confirm sound; a wrong or expired code plays the error sound.
  const verify = trpc.otp.verify.useMutation({ onSuccess: (r) => { setCreatorToken((r as { accessToken?: string }).accessToken); playSound("confirm"); onVerified(); }, onError: (e) => { playSound("error"); setError(e.message); } });
  const busy = request.isPending || verify.isPending;
  const requestOtp = () => {
    if (!email.includes("@")) { playSound("error"); setError("Enter a valid email address."); return; }
    setError(""); request.mutate({ email, templateId, purpose: "create" });
  };
  const verifyOtp = () => {
    if (otp.length !== 6) { playSound("error"); setError("Enter the 6-digit code from your email."); return; }
    setError(""); verify.mutate({ email, code: otp });
  };
  return <div className="auth-panel" id="otp-panel"><button className="back-button" onClick={onBack}><ChevronLeft size={16} /> Back to templates</button><div className="auth-icon"><Mail size={22} /></div><Badge className="eyebrow">ONE-TIME ACCESS</Badge><h2>Let’s make it yours.</h2><p>Enter your email and we’ll send a one-time code. No password, no account setup.</p><label>Email address</label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" disabled={sent} />{!sent ? <Button className="primary-button full-button" onClick={requestOtp} disabled={busy}>{request.isPending ? "Sending" : "Send me a code"} <ArrowRight size={16} /></Button> : <><div className="otp-sent"><Check size={15} /> Code sent to {email}</div><label>Enter your code</label><Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" inputMode="numeric" autoFocus /><Button className="primary-button full-button" onClick={verifyOtp} disabled={busy}>{verify.isPending ? "Checking" : "Continue"} <ArrowRight size={16} /></Button><button className="resend-button" onClick={requestOtp} disabled={busy}>Resend code</button><button className="resend-button" onClick={() => { setSent(false); setOtp(""); setError(""); }}>Use a different email</button></>}{error && <div className="form-error">{error}</div>}</div>;
}

function CreationForm({ email, template, onDone, onBack }: { email: string; template: TemplateItem; onDone: (campaign: Campaign) => void; onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [graduate, setGraduate] = useState({ name: "", nickname: "", phone: "", email, date: "2026-12-12", message: "I would love for you to join me as I celebrate this special milestone." });
  const [ceremony, setCeremony] = useState({ name: "University of Rwanda — Main Campus", location: "Kigali, Rwanda", directions: "" });
  const [celebration, setCelebration] = useState({ name: "The Garden Terrace", location: "Nyarugenge, Kigali", directions: "" });
  const [invitees, setInvitees] = useState([createInvitee()]);
  const [delivery, setDelivery] = useState<"link" | "qr" | "both">("both");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const canContinueDetails = graduate.name.trim() && ceremony.name.trim() && celebration.name.trim();
  const addInvitee = () => setInvitees([...invitees, createInvitee()]);
  const updateInvitee = (id: string, field: "name" | "phone", value: string) => setInvitees(invitees.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const removeInvitee = (id: string) => setInvitees(invitees.length === 1 ? invitees : invitees.filter((item) => item.id !== id));
  const goNext = () => {
    setError("");
    if (step === 1 && !canContinueDetails) { setError("Add the graduate’s name and both venue names to continue."); return; }
    if (step === 2) {
      const valid = invitees.every((item) => item.name.trim() && isValidRwandaMobile(item.phone));
      if (!valid) { setError("Every invitee needs a name and a valid Rwanda number beginning with 072, 073, 078 or 079."); return; }
    }
    setStep(step + 1);
  };
  const fileChange = (file?: File) => { if (!file) return; shrinkImage(file).then(setImage).catch(() => toast.error("That image could not be used")); };
  // The invitation is stored on the server (guest links open on any phone) and cached locally for the creator.
  const save = trpc.campaigns.create.useMutation({
    onSuccess: (_saved, campaign) => { const existing = getLocal<Campaign[]>("gradinvite-campaigns", []); saveLocal("gradinvite-campaigns", [campaign as Campaign, ...existing.filter((item) => item.id !== campaign.id)]); onDone(campaign as Campaign); },
    onError: (e) => { playSound("error"); setError(e.message || "Could not save your invitation. Check your connection and try again."); },
  });
  const createCampaign = () => {
    setError("");
    save.mutate({ id: `campaign-${crypto.randomUUID()}`, email, templateId: template.id, graduate, ceremony, celebration, invitees, delivery, image, createdAt: new Date().toISOString() });
  };
  return <div className="creator-shell"><div className="creator-top"><button className="back-button" onClick={onBack}><ChevronLeft size={16} /> Back</button><div className="creator-progress"><span className={step >= 1 ? "active" : ""}>Details</span><i /><span className={step >= 2 ? "active" : ""}>Invitees</span><i /><span className={step >= 3 ? "active" : ""}>Share</span></div><span className="creator-email">{email}</span></div><div className="creator-body"><div className="creator-form"><Badge className="eyebrow">{step === 1 ? "YOUR GRADUATION" : step === 2 ? "YOUR GUEST LIST" : "READY TO SHARE"}</Badge>{step === 1 && <><h2>Set the scene.</h2><p className="form-intro">Start with the details your guests will want to remember.</p><div className="image-upload"><input id="graduate-image" type="file" accept="image/*" onChange={(e) => fileChange(e.target.files?.[0])} /><label htmlFor="graduate-image">{image ? <img src={image} alt="Graduate preview" /> : <><span className="upload-icon"><ImagePlus size={21} /></span><strong>Add a graduate photo</strong><small>JPG or PNG · optional</small></>}</label></div><div className="form-grid"><div className="field full"><label>Graduate’s full name *</label><Input value={graduate.name} onChange={(e) => setGraduate({ ...graduate, name: e.target.value })} placeholder="e.g. Aline Mukamana" /></div><div className="field"><label>Nickname</label><Input value={graduate.nickname} onChange={(e) => setGraduate({ ...graduate, nickname: e.target.value })} placeholder="What friends call you" /></div><div className="field"><label>Graduation date</label><Input type="date" value={graduate.date} onChange={(e) => setGraduate({ ...graduate, date: e.target.value })} /></div><div className="field"><label>Your phone</label><Input value={graduate.phone} onChange={(e) => setGraduate({ ...graduate, phone: e.target.value })} placeholder="07…" /></div><div className="field"><label>Your email</label><Input value={graduate.email} onChange={(e) => setGraduate({ ...graduate, email: e.target.value })} /></div><div className="field full"><label>Personal message</label><Textarea value={graduate.message} onChange={(e) => setGraduate({ ...graduate, message: e.target.value })} rows={3} /></div></div><div className="venue-grid"><VenueCard title="Graduation ceremony" icon={<CalendarDays size={16} />} value={ceremony} setValue={setCeremony} /><VenueCard title="Celebration venue" icon={<Gift size={16} />} value={celebration} setValue={setCelebration} /></div></>}{step === 2 && <><h2>Bring your people.</h2><p className="form-intro">Add everyone who should receive their own invitation. We’ll create one link per person.</p><div className="invitee-toolbar"><span><Users size={17} /> {invitees.length} invitation{invitees.length === 1 ? "" : "s"} so far</span><button onClick={addInvitee}><span>+</span> Add invitee</button></div><div className="invitee-list">{invitees.map((item, index) => <div className="invitee-row" key={item.id}><span className="invitee-index">{String(index + 1).padStart(2, "0")}</span><Input value={item.name} onChange={(e) => updateInvitee(item.id, "name", e.target.value)} placeholder="Invitee full name" /><div className="phone-input"><Phone size={14} /><Input value={item.phone} onChange={(e) => updateInvitee(item.id, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="079…" /></div><button className="icon-button" onClick={() => removeInvitee(item.id)} aria-label="Remove invitee"><X size={16} /></button></div>)}</div><div className="privacy-note"><ShieldCheck size={17} /><span>Each guest gets a private invitation link. You can choose whether their name appears on it.</span></div></>}{step === 3 && <><h2>Choose how to share.</h2><p className="form-intro">Every invitee gets their own invitation. Choose what you’d like to send them.</p><div className="delivery-options">{(["link", "qr", "both"] as const).map((option) => <button key={option} className={`delivery-card ${delivery === option ? "selected" : ""}`} onClick={() => setDelivery(option)}><div className="delivery-icon">{option === "link" ? <Link2 size={20} /> : option === "qr" ? <QrCode size={20} /> : <><Link2 size={15} /><QrCode size={15} /></>}</div><strong>{option === "link" ? "Clickable link" : option === "qr" ? "QR code" : "Both"}</strong><span>{option === "link" ? "Easy to send by WhatsApp or email" : option === "qr" ? "Perfect for printed cards" : "The most flexible option"}</span>{delivery === option && <span className="delivery-check"><Check size={13} /></span>}</button>)}</div><div className="share-summary"><div className="summary-icon"><Send size={18} /></div><div><strong>Ready to create {invitees.length} invitation{invitees.length === 1 ? "" : "s"}</strong><p>Each one will include {graduate.name || "your graduate"}’s details and the two venue locations.</p></div></div></>}{error && <div className="form-error">{error}</div>}<div className="form-actions"><Button className="primary-button" onClick={step < 3 ? goNext : createCampaign} disabled={save.isPending}>{step < 3 ? <>Continue <ArrowRight size={16} /></> : save.isPending ? <>Saving</> : <>Create invitations <Sparkles size={16} /></>}</Button>{step > 1 && <button className="back-button" onClick={() => setStep(step - 1)}>Back</button>}</div></div><div className="live-preview"><span className="preview-label">LIVE PREVIEW</span><div className={`preview-card ${template.className}`}><div className="preview-top"><span>GRADUATION</span><span>{graduate.date ? graduate.date.replaceAll("-", ".") : "12.12.26"}</span></div>{image ? <img className="preview-image" src={image} alt="" /> : <label htmlFor="graduate-image" className="preview-initial" title="Add a graduate photo">{graduate.name ? graduate.name.charAt(0).toUpperCase() : template.monogram}<small>Add photo</small></label>}<div className="preview-kicker">A NEW CHAPTER</div><div className="preview-name">{graduate.name || template.sampleName}</div><div className="preview-line" /><p>{graduate.message || "A day worth remembering."}</p><div className="preview-date"><CalendarDays size={13} /> {formatDate(graduate.date)}</div><div className="preview-venue"><MapPin size={13} /> {ceremony.name || "Ceremony venue"}</div><div className="preview-footer">YOU ARE INVITED</div></div><p className="preview-caption">Your guests will see this invitation when they open their personal link or scan their QR code.</p></div></div></div>;
}

function VenueCard({ title, icon, value, setValue }: { title: string; icon: ReactNode; value: { name: string; location: string; directions: string }; setValue: (v: { name: string; location: string; directions: string }) => void }) {
  return <div className="venue-card"><div className="venue-card-title">{icon}<strong>{title}</strong></div><Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} placeholder="Venue name" /><Input value={value.location} onChange={(e) => setValue({ ...value, location: e.target.value })} placeholder="Address or location" /><div className="venue-directions"><MapPin size={14} /><Input value={value.directions} onChange={(e) => setValue({ ...value, directions: e.target.value })} placeholder="Directions link (optional)" /></div></div>;
}

type Campaign = { id: string; email: string; templateId: string; graduate: { name: string; nickname: string; phone: string; email: string; date: string; message: string }; ceremony: { name: string; location: string; directions: string }; celebration: { name: string; location: string; directions: string }; invitees: { id: string; name: string; phone: string }[]; delivery: "link" | "qr" | "both"; image: string | null; createdAt: string };

function CreatorPage({ initialTemplate }: { initialTemplate?: string }) {
  const [, navigate] = useLocation();
  const templates = useTemplates();
  const [templateId, setTemplateId] = useState(initialTemplate || templates[0].id);
  const session = getCreatorSession();
  const [email, setEmail] = useState(session?.email ?? "");
  const [verified, setVerified] = useState(Boolean(session));
  const [chosen, setChosen] = useState(Boolean(session && initialTemplate));
  const template = templates.find((item) => item.id === templateId) || templates[0];
  // On narrow screens the email panel sits below the templates, so a tap scrolls to it and focuses the email field.
  const pickTemplate = (id: string) => {
    setTemplateId(id);
    if (window.innerWidth > 900) return;
    const panel = document.getElementById("otp-panel");
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => panel?.querySelector<HTMLInputElement>("input[type=email]")?.focus({ preventScroll: true }), 450);
  };
  return <div className="creator-page"><header className="minimal-nav"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><span className="minimal-label">Create an invitation</span></header>{!(verified && chosen) ? <div className="creator-auth-wrap"><div className="template-pick-side"><span className="preview-label">START WITH A STYLE</span><h1>A little look<br /><em>goes a long way.</em></h1><div className="creator-template-list">{templates.map((item) => <TemplateMiniCard key={item.id} template={item} selected={item.id === templateId} onClick={() => pickTemplate(item.id)} />)}</div></div>{verified ? <div className="auth-panel" id="otp-panel"><button className="back-button" onClick={() => navigate("/")}><ChevronLeft size={16} /> Home</button><div className="auth-icon"><Check size={22} /></div><Badge className="eyebrow">VERIFIED</Badge><h2>Welcome back.</h2><p>You are verified as <strong>{email}</strong>. Pick a style and continue, no new code needed.</p><Button className="primary-button full-button" onClick={() => setChosen(true)}>Continue with {template.name} <ArrowRight size={16} /></Button><button className="resend-button" onClick={() => navigate("/view")}>View my creations</button><button className="resend-button" onClick={() => { clearCreatorSession(); setVerified(false); setChosen(false); setEmail(""); }}>Use a different email</button></div> : <OtpStep email={email} setEmail={setEmail} templateId={templateId} onVerified={() => { setVerified(true); setChosen(true); }} onBack={() => navigate("/")} />}</div> : <CreationForm email={email} template={template} onBack={() => setChosen(false)} onDone={(campaign) => navigate(`/created/${campaign.id}`)} />}</div>;
}

type Invitee = Campaign["invitees"][number];

const inviteShareText = (campaign: Campaign, guest: Invitee) => `${guest.name ? `${guest.name}, you` : "You"} are invited to ${campaign.graduate.name}'s graduation on ${formatDate(campaign.graduate.date)}.`;

async function copyLink(link: string) {
  if (await copyText(link)) toast.success("Invitation link copied");
  else toast.error("Could not copy automatically. Long-press the link to copy it.", { description: link });
}

// Copy link always works; the Share button appears on phones and opens WhatsApp, SMS or email.
function ShareButtons({ link, campaign, guest }: { link: string; campaign: Campaign; guest: Invitee }) {
  const share = async () => { if (!(await shareLink({ title: "Graduation invitation", text: inviteShareText(campaign, guest), url: link }))) copyLink(link); };
  return <><button type="button" onClick={() => copyLink(link)}><Link2 size={15} /> Copy link</button>{canShare() && <button type="button" onClick={share}><Share2 size={15} /> Share</button>}</>;
}

// The QR encodes the guest's private invitation link; tapping it opens a large version that can be downloaded.
function InviteQr({ link, campaign, guest }: { link: string; campaign: Campaign; guest: Invitee }) {
  const [src, setSrc] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { let alive = true; qrDataUrl(link, 512).then((url) => { if (alive) setSrc(url); }).catch(() => {}); return () => { alive = false; }; }, [link]);
  const lines = [campaign.graduate.name, guest.name ? `Invitation for ${guest.name}` : "Graduation invitation", formatDate(campaign.graduate.date)];
  const download = async () => {
    try { downloadBlob(await qrPosterBlob(link, lines), `invitation-${(guest.name || "guest").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`); toast.success("QR code downloaded"); }
    catch { toast.error("Could not build the QR image"); }
  };
  return <>
    <button type="button" className="qr-thumb" onClick={() => setOpen(true)} aria-label={`Enlarge QR code for ${guest.name || "guest"}`}>{src ? <img src={src} alt={`QR code for ${guest.name || "guest"}`} /> : <QrCode size={22} />}</button>
    {open && <div className="modal-backdrop" onClick={() => setOpen(false)}><div className="feedback-modal qr-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setOpen(false)}><X size={18} /></button><Badge className="eyebrow">SCAN TO OPEN</Badge><h2>{guest.name || "Your guest"}</h2><p>Scanning opens {campaign.graduate.name}'s invitation with the date and both venues.</p>{src && <img className="qr-large" src={src} alt={`QR code for ${guest.name || "guest"}`} />}<div className="link-chip">{link}</div><div className="qr-actions"><Button className="primary-button" onClick={download}><Download size={15} /> Download PNG</Button><button type="button" className="text-link-button" onClick={() => copyLink(link)}><Link2 size={15} /> Copy link</button></div></div></div>}
  </>;
}

// The letter itself, shared by the public page and the offscreen renderer used for downloads.
function InviteLetter({ campaign, guest }: { campaign: Campaign; guest?: Invitee }) {
  return <article className="invite-letter"><span className="letter-seal" aria-hidden="true">{campaign.graduate.name.charAt(0)}</span><div className="letter-head"><span>{formatDate(campaign.graduate.date)}</span><span>You are invited</span></div><div className="invite-ornament">✦</div><span className="invite-kicker">YOU ARE INVITED TO CELEBRATE</span><h1>{campaign.graduate.name}</h1>{campaign.image ? <img className="invite-photo" src={campaign.image} alt={campaign.graduate.name} /> : <div className="invite-photo-placeholder">{campaign.graduate.name.charAt(0)}</div>}<p className="invite-guest">Dear {(guest?.name || "friend").replace(/^dears+/i, "")},</p><p className="invite-message">{campaign.graduate.message}</p><div className="invite-date-block"><span>{formatDate(campaign.graduate.date)}</span><i /> <span>2026</span></div><div className="invite-locations"><div><span className="location-label"><CalendarDays size={14} /> Graduation ceremony</span><strong>{campaign.ceremony.name}</strong><span>{campaign.ceremony.location}</span>{campaign.ceremony.directions && <a href={campaign.ceremony.directions} target="_blank" rel="noreferrer">View directions <ExternalLink size={12} /></a>}</div><div><span className="location-label"><Gift size={14} /> Celebration</span><strong>{campaign.celebration.name}</strong><span>{campaign.celebration.location}</span>{campaign.celebration.directions && <a href={campaign.celebration.directions} target="_blank" rel="noreferrer">View directions <ExternalLink size={12} /></a>}</div></div><div className="invite-footer-note">It would mean so much to have you there.</div><div className="letter-signature"><span>With love,</span><strong>{campaign.graduate.name}{campaign.graduate.nickname ? ` · ${campaign.graduate.nickname}` : ""}</strong></div></article>;
}

// Turns a rendered letter into a PNG and either downloads it or hands it to the phone's share sheet.
async function exportLetter(node: HTMLElement, campaign: Campaign, guest: Invitee | undefined, share: boolean) {
  try {
    const blob = await letterToPng(node);
    const name = `invitation-${slug(campaign.graduate.name)}-${slug(guest?.name || "guest")}.png`;
    if (share && (await shareFile(blob, name, `Invitation from ${campaign.graduate.name}`))) { toast.success("Invitation letter shared"); return; }
    downloadBlob(blob, name);
    toast.success("Invitation letter downloaded");
  } catch (e) { toast.error(e instanceof Error ? e.message : "Could not build the letter image"); }
}

// Download or send one guest's letter from the created page; the letter is rendered offscreen for the snapshot.
function LetterActions({ campaign, guest, template }: { campaign: Campaign; guest: Invitee; template: TemplateItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const run = async (share: boolean) => { if (!ref.current) return; setBusy(true); await exportLetter(ref.current, campaign, guest, share); setBusy(false); };
  return <>
    <button type="button" onClick={() => run(false)} disabled={busy}><FileDown size={15} /> {busy ? "Preparing" : "Letter"}</button>
    {canShareFiles() && <button type="button" onClick={() => run(true)} disabled={busy}><Send size={15} /> Send letter</button>}
    <div className="letter-offscreen" aria-hidden="true"><div ref={ref} className={`letter-shot public-invite ${template.className}`}><InviteLetter campaign={campaign} guest={guest} /></div></div>
  </>;
}

// One CSV with every guest across the given invitations: graduate, date, guest, phone and private link.
function downloadGuestList(campaigns: Campaign[]) {
  const base = `${window.location.origin}/invite`;
  const rows: (string | number)[][] = [["Graduate", "Graduation date", "Guest", "Phone", "Invitation link"]];
  for (const c of campaigns) for (const g of c.invitees) rows.push([c.graduate.name, c.graduate.date, g.name, g.phone ? `="${g.phone}"` : "", `${base}/${c.id}-${g.id}`]);
  if (rows.length === 1) { toast.error("There are no guests to export yet"); return; }
  downloadCsv(rows, `gradinvite-guests-${new Date().toISOString().slice(0, 10)}.csv`);
  toast.success("Guest list downloaded");
}

function CreatedPage({ campaignId }: { campaignId: string }) {
  const [, navigate] = useLocation();
  const local = getLocal<Campaign[]>("gradinvite-campaigns", []).find((item) => item.id === campaignId);
  const templates = useTemplates(true);
  const remote = trpc.campaigns.get.useQuery({ id: campaignId, token: getCreatorToken() || undefined }, { enabled: !local, retry: false });
  const campaign = local ?? (remote.data as Campaign | undefined);
  if (!campaign) return remote.isLoading ? <div className="empty-screen"><Sparkles size={25} /><h2>Loading your invitations</h2></div> : <EmptyState title="No invitation found" action={() => navigate("/")} />;
  const template = templates.find((item) => item.id === campaign.templateId) || templates[0];
  const baseUrl = `${window.location.origin}/invite`;
  return <div className="created-page"><header className="minimal-nav"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><Badge className="success-badge"><Check size={13} /> CREATED</Badge></header><main className="created-main"><div className="created-intro"><span className="success-mark"><Check size={24} /></span><Badge className="eyebrow">READY TO SHARE</Badge><h1>{campaign.invitees.length} beautiful invitation{campaign.invitees.length === 1 ? " is" : "s are"}<br /><em>waiting for your people.</em></h1><p>Every guest has their own private link. Copy it, share it, or tap a QR code to enlarge and download it.</p></div><div className="created-list">{campaign.invitees.map((invitee, index) => { const link = `${baseUrl}/${campaign.id}-${invitee.id}`; return <div className="created-invitee" key={invitee.id}><div className="created-number">{String(index + 1).padStart(2, "0")}</div><div className="created-person"><strong>{invitee.name}</strong><span>{invitee.phone}</span></div><div className="created-delivery">{(campaign.delivery === "qr" || campaign.delivery === "both") && <InviteQr link={link} campaign={campaign} guest={invitee} />}{(campaign.delivery === "link" || campaign.delivery === "both") && <ShareButtons link={link} campaign={campaign} guest={invitee} />}<LetterActions campaign={campaign} guest={invitee} template={template} /></div><a href={link} target="_blank" rel="noreferrer" className="open-invite" aria-label="Open invitation"><ExternalLink size={15} /></a></div>; })}</div><div className="created-actions"><Button className="primary-button" onClick={() => navigate(`/invite/${campaign.id}-${campaign.invitees[0].id}`)}>Preview invitation <ArrowRight size={16} /></Button><button className="text-link-button" onClick={() => downloadGuestList([campaign])}><Download size={15} /> Download guest list</button><button className="text-link-button" onClick={() => navigate("/view")}>View all my creations <ArrowRight size={15} /></button></div></main></div>;
}

const DEMO_CAMPAIGN: Campaign = { id: "demo", email: "", templateId: "terracotta", graduate: { name: "Aline Mukamana", nickname: "", phone: "", email: "", date: "2026-12-12", message: "I would love for you to join me as I celebrate this special milestone." }, ceremony: { name: "University of Rwanda — Main Campus", location: "Kigali, Rwanda", directions: "" }, celebration: { name: "The Garden Terrace", location: "Nyarugenge, Kigali", directions: "" }, invitees: [{ id: "guest", name: "friend", phone: "" }], delivery: "both" as const, image: null, createdAt: "" };

// Guest ids are UUIDs, so the campaign id is everything before the final 36-character segment.
const campaignIdFromInvite = (inviteId: string) => { const m = inviteId.match(/^(.*)-([0-9a-f-]{36})$/i); return m ? m[1] : inviteId; };

function PublicInvite({ inviteId }: { inviteId: string }) {
  const templates = useTemplates(true);
  const isDemo = inviteId === "demo" || inviteId.startsWith("demo-");
  const local = getLocal<Campaign[]>("gradinvite-campaigns", []).find((item) => inviteId.startsWith(`${item.id}-`));
  // Guests open links on their own phones, so anything not cached here is fetched from the server.
  const remote = trpc.campaigns.get.useQuery({ id: campaignIdFromInvite(inviteId) }, { enabled: !local && !isDemo, retry: false, staleTime: 5 * 60_000 });
  const campaign: Campaign | undefined = isDemo ? DEMO_CAMPAIGN : local ?? (remote.data as Campaign | undefined);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [validated, setValidated] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const validatePhone = () => { if (!isValidRwandaMobile(phone)) { toast.error("Enter a valid Rwanda mobile number", { description: "Use 10 digits starting with 072, 073, 078 or 079." }); setValidated(false); return; } setValidated(true); toast.success("Phone number validated"); };
  const submitFeedback = () => { if (!validated || rating === 0 || !message.trim()) { toast.error("Complete your rating, message and phone validation first"); return; } saveLocal("gradinvite-feedback", [{ rating, message, phone, invitationId: inviteId, createdAt: new Date().toISOString() }, ...getLocal("gradinvite-feedback", [])]); toast.success("Thank you for sharing your feedback"); setFeedbackOpen(false); };
  if (!campaign) return remote.isLoading ? <div className="empty-screen"><Sparkles size={25} /><h2>Opening your invitation</h2></div> : <EmptyState title="This invitation link is not valid or has been removed." action={() => window.location.assign("/")} />;
  const guest = campaign.invitees.find((item) => inviteId === `${campaign.id}-${item.id}`) || campaign.invitees[0];
  const template = templates.find((item) => item.id === campaign.templateId) || templates[0];
  return <div className={`public-invite ${template.className}`}><div className="invite-topbar"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={14} /></span><span>grad<span>invite</span></span></Link><div className="invite-topbar-actions"><button onClick={() => { const node = document.querySelector<HTMLElement>(".invite-letter-wrap"); if (node) exportLetter(node, campaign, guest, false); }} className="feedback-trigger"><Download size={15} /> Save letter</button><button onClick={() => setFeedbackOpen(true)} className="feedback-trigger"><MessageCircle size={15} /> Leave feedback</button></div></div><main className="invite-main invite-letter-wrap"><InviteLetter campaign={campaign} guest={guest} /><p className="letter-brand">Sent with GradInvite</p></main>{feedbackOpen && <div className="modal-backdrop" onClick={() => setFeedbackOpen(false)}><div className="feedback-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setFeedbackOpen(false)}><X size={18} /></button><Badge className="eyebrow">A QUICK NOTE</Badge><h2>How did this invitation feel?</h2><p>Your feedback helps us make every celebration a little better.</p><div className="stars">{[1,2,3,4,5].map((n) => <button key={n} className={rating >= n ? "star-active" : ""} onClick={() => setRating(n)}><Star size={24} fill="currentColor" /></button>)}</div><label>Phone number</label><div className="validate-row"><Input value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setValidated(false); }} placeholder="079 000 0000" /><Button variant="outline" onClick={validatePhone}>{validated ? <Check size={15} /> : "Validate"}</Button></div><label>Your message</label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us what you loved…" /><Button className="primary-button full-button" onClick={submitFeedback}>Send feedback <Send size={15} /></Button></div></div>}</div>;
}

function ViewCreations() {
  const [, navigate] = useLocation();
  const session = getCreatorSession();
  const [email, setEmail] = useState(session?.email ?? ""); const [otp, setOtp] = useState(""); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  const [token, setToken] = useState(session?.token ?? "");
  const [unlocked, setUnlocked] = useState(Boolean(session));
  const switchEmail = () => { clearCreatorSession(); setToken(""); setUnlocked(false); setSent(false); setOtp(""); setEmail(""); };
  // The server list is the source of truth; invitations cached in this browser fill in if the server is unreachable.
  const mine = trpc.campaigns.listMine.useQuery({ token }, { enabled: unlocked && Boolean(token), retry: false });
  const localMine = getLocal<Campaign[]>("gradinvite-campaigns", []).filter((item) => !email || item.email.toLowerCase() === email.toLowerCase());
  const campaigns: Campaign[] = (mine.data as Campaign[] | undefined) ?? (unlocked && !mine.isLoading ? localMine : []);
  const unlock = (accessToken?: string) => { setCreatorToken(accessToken); setToken(accessToken ?? getCreatorToken()); setUnlocked(true); };
  const requestMutation = trpc.otp.request.useMutation({
    onSuccess: (result) => { const r = result as OtpResult; if (r.bypass) { toast.info(r.reason); unlock(r.accessToken); return; } setSent(true); toast.success(`Code sent to ${email}`); },
    onError: (e) => { playSound("error"); setError(e.message); },
  });
  const verifyMutation = trpc.otp.verify.useMutation({ onSuccess: (r) => { playSound("confirm"); unlock((r as { accessToken?: string }).accessToken); }, onError: (e) => { playSound("error"); setError(e.message); } });
  const request = () => { if (!email.includes("@")) { playSound("error"); setError("Enter the email you used to create your invitations."); return; } setError(""); requestMutation.mutate({ email, purpose: "view" }); };
  const verify = () => { if (otp.length !== 6) { playSound("error"); setError("Enter the 6-digit code from your email."); return; } setError(""); verifyMutation.mutate({ email, code: otp }); };
  const guestCount = campaigns.reduce((n, c) => n + c.invitees.length, 0);
  const baseUrl = `${window.location.origin}/invite`;
  return <div className="simple-page"><header className="minimal-nav"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><button className="back-button" onClick={() => navigate("/")}><ChevronLeft size={16} /> Home</button></header><main className="view-main"><div className="view-heading"><Badge className="eyebrow">YOUR SPACE</Badge><h1>Welcome back<br /><em>to your creations.</em></h1><p>{unlocked ? "Every invitation you sent, with each guest, their phone number and their private link." : "Enter the email you used before. We’ll send a one-time code so you can pick up where you left off."}</p></div>
    {!unlocked ? <div className="view-auth"><Mail size={21} /><label>Email address</label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />{!sent ? <Button className="primary-button full-button" onClick={request} disabled={requestMutation.isPending}>{requestMutation.isPending ? "Sending" : "Send me a code"} <ArrowRight size={16} /></Button> : <><div className="otp-sent"><Check size={15} /> Code sent to {email}</div><Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit code" inputMode="numeric" autoFocus /><Button className="primary-button full-button" onClick={verify} disabled={verifyMutation.isPending}>{verifyMutation.isPending ? "Checking" : "View my creations"} <ArrowRight size={16} /></Button></>}{error && <div className="form-error">{error}</div>}</div>
    : mine.isLoading ? <div className="empty-screen" style={{ minHeight: 200 }}><Sparkles size={25} /><h2>Loading your invitations</h2></div>
    : <div className="my-campaigns"><div className="campaigns-top"><strong>{campaigns.length} invitation{campaigns.length === 1 ? "" : "s"} · {guestCount} guest{guestCount === 1 ? "" : "s"}</strong><div className="campaigns-actions"><Button className="primary-button" onClick={() => downloadGuestList(campaigns)} disabled={guestCount === 0}><Download size={15} /> Download list</Button><Button className="primary-button" onClick={() => navigate("/create")}>New invitation <ArrowRight size={15} /></Button></div></div>{email && <p className="form-intro" style={{ marginTop: 12 }}>Signed in as {email}. <button type="button" className="resend-button" style={{ display: "inline", margin: 0 }} onClick={switchEmail}>Use a different email</button></p>}
      {mine.error && <div className="form-error">{mine.error.message} Showing what is saved on this device.</div>}
      {campaigns.length === 0 && <p className="form-intro">No invitations were found for this email yet.</p>}
      {campaigns.map((campaign) => <div className="campaign-block" key={campaign.id}><div className="campaign-row"><div className={`campaign-swatch ${campaign.templateId}`} /><div><strong>{campaign.graduate.name}</strong><span>{campaign.invitees.length} guest{campaign.invitees.length === 1 ? "" : "s"} · {formatDate(campaign.graduate.date)} · {campaign.ceremony.name}</span></div><button onClick={() => navigate(`/created/${campaign.id}`)} aria-label="Open sharing page"><ArrowRight size={17} /></button></div>
        <table className="guest-table"><thead><tr><th>#</th><th>Guest</th><th>Phone</th><th>Link</th></tr></thead><tbody>{campaign.invitees.map((guest, index) => { const link = `${baseUrl}/${campaign.id}-${guest.id}`; return <tr key={guest.id}><td>{index + 1}</td><td>{guest.name || "Guest"}</td><td>{guest.phone || "—"}</td><td><button type="button" onClick={() => copyLink(link)}><Link2 size={13} /> Copy</button> <a href={link} target="_blank" rel="noreferrer" aria-label="Open invitation"><ExternalLink size={13} /></a></td></tr>; })}</tbody></table></div>)}
    </div>}</main></div>;
}

// Only signed-in administrators may open the admin panel; everyone else is sent to sign in.
function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  if (loading) return <div className="empty-screen"><Sparkles size={25} /><h2>Checking your access</h2></div>;
  if (!user) return null;
  if (user.role !== "admin") return <EmptyState title="This area is for administrators only." action={() => window.location.assign("/")} />;
  return <>{children}</>;
}

function EmptyState({ title, action }: { title: string; action: () => void }) { return <div className="empty-screen"><Sparkles size={25} /><h2>{title}</h2><Button className="primary-button" onClick={action}>Go home <ArrowRight size={16} /></Button></div>; }

export default function Home() {
  const [matchInvite, paramsInvite] = useRoute("/invite/:id");
  const [matchCreated, paramsCreated] = useRoute("/created/:id");
  const [matchAdmin] = useRoute("/admin");
  const [matchCreate] = useRoute("/create");
  const [matchView] = useRoute("/view");
  const [matchLogin] = useRoute("/login");
  const [location, navigate] = useLocation();
  const initialTemplate = new URLSearchParams(window.location.search).get("template") || undefined;
  useEffect(() => { document.title = location.startsWith("/invite") ? "You’re invited · GradInvite" : "GradInvite Graduation invitations, made personal"; }, [location]);
  if (matchInvite && paramsInvite?.id) return <PublicInvite inviteId={paramsInvite.id} />;
  if (matchCreated && paramsCreated?.id) return <CreatedPage campaignId={paramsCreated.id} />;
  if (matchLogin) return <Login />;
  if (matchAdmin) return <AdminGate><Admin /></AdminGate>;
  if (matchCreate) return <CreatorPage initialTemplate={initialTemplate} />;
  if (matchView) return <ViewCreations />;
  return <HomePage onCreate={(templateId) => navigate(templateId ? `/create?template=${templateId}` : "/create")} />;
}
