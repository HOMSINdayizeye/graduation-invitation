import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  Clipboard,
  ExternalLink,
  Gift,
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
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { isValidRwandaMobile } from "@shared/gradinvite";

const templates = [
  {
    id: "terracotta",
    name: "Terracotta Toast",
    subtitle: "Warm, editorial and full of character",
    className: "template-terracotta",
    accent: "#d76b4f",
    monogram: "A",
    sampleName: "Aline Mukamana",
  },
  {
    id: "midnight",
    name: "Midnight Ceremony",
    subtitle: "A polished evening invitation",
    className: "template-midnight",
    accent: "#96c7c0",
    monogram: "J",
    sampleName: "Jean Claude Niyonzima",
  },
  {
    id: "garden",
    name: "Garden Gathering",
    subtitle: "Fresh, joyful and personal",
    className: "template-garden",
    accent: "#799c70",
    monogram: "M",
    sampleName: "Mireille Uwase",
  },
];

// Every invitee gets a unique id so a guest link can be matched exactly.
const createInvitee = () => ({ id: crypto.randomUUID(), name: "", phone: "" });

const demoOtp = "2026";

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

function TemplateMiniCard({ template, selected, onClick }: { template: typeof templates[number]; selected?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`template-mini ${template.className} ${selected ? "is-selected" : ""}`}>
      <div className="mini-topline"><span>GRADUATION</span><span>2026</span></div>
      <div className="mini-monogram">{template.monogram}</div>
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
        <Button className="nav-cta" onClick={() => { onCreate(); setOpen(false); }}>Create invitation <ArrowRight size={15} /></Button>
      </nav>
    </header>
  );
}

function HomePage({ onCreate }: { onCreate: (templateId?: string) => void }) {
  return (
    <div className="public-page">
      <PublicNav onCreate={() => onCreate()} />
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <Badge className="eyebrow"><span className="eyebrow-dot" /> MADE FOR THE MOMENT</Badge>
            <h1>Give your graduation<br /><em>a beautiful beginning.</em></h1>
            <p className="hero-lead">Create a digital invitation that feels personal, looks considered and gives every guest the details they need.</p>
            <div className="hero-actions">
              <Button className="primary-button" onClick={() => onCreate()}>Choose a template <ArrowRight size={16} /></Button>
              <a className="text-link" href="#how-it-works">See how it works <span>↘</span></a>
            </div>
            <div className="hero-trust"><span><ShieldCheck size={15} /> No password needed</span><span><Sparkles size={15} /> Ready to share</span></div>
          </div>
          <div className="hero-art" aria-label="Sample graduation invitation">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="hero-card template-terracotta">
              <div className="hero-card-top"><span>GRADUATION</span><span>12.12.26</span></div>
              <div className="hero-card-content"><div className="hero-card-kicker">A NEW CHAPTER</div><div className="hero-card-name">Aline<br /><em>Mukamana</em></div><div className="hero-card-line" /><p>Join me as I celebrate the close of one chapter and the beginning of another.</p><div className="hero-card-date"><CalendarDays size={14} /> Saturday, 12 December 2026</div></div>
              <div className="hero-card-footer">Rwanda  ·  Kigali</div>
            </div>
            <div className="art-note note-one"><QrCode size={17} /><span>Share by QR<br />or link</span></div>
            <div className="art-note note-two"><span className="note-star">✦</span><span>Made for<br />your people</span></div>
          </div>
        </section>

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

function OtpStep({ email, setEmail, onVerified, onBack }: { email: string; setEmail: (s: string) => void; onVerified: () => void; onBack: () => void }) {
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const requestOtp = () => {
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    setError(""); setSent(true); toast.success("Your one-time code is ready", { description: `Demo code: ${demoOtp}` });
  };
  const verify = () => {
    if (otp !== demoOtp) { setError("That code is not correct. Try the demo code shown in the notification."); return; }
    onVerified();
  };
  return <div className="auth-panel"><button className="back-button" onClick={onBack}><ChevronLeft size={16} /> Back to templates</button><div className="auth-icon"><Mail size={22} /></div><Badge className="eyebrow">ONE-TIME ACCESS</Badge><h2>Let’s make it yours.</h2><p>Enter your email and we’ll send a one-time code. No password, no account setup.</p><label>Email address</label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" />{!sent ? <Button className="primary-button full-button" onClick={requestOtp}>Send me a code <ArrowRight size={16} /></Button> : <><div className="otp-sent"><Check size={15} /> Code sent to {email}</div><label>Enter your code</label><Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="4-digit code" inputMode="numeric" /><Button className="primary-button full-button" onClick={verify}>Continue <ArrowRight size={16} /></Button><button className="resend-button" onClick={requestOtp}>Resend code</button></>}{error && <div className="form-error">{error}</div>}<p className="demo-hint">For this preview, use <strong>{demoOtp}</strong> as the code.</p></div>;
}

function CreationForm({ email, template, onDone, onBack }: { email: string; template: typeof templates[number]; onDone: (campaign: Campaign) => void; onBack: () => void }) {
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
  const fileChange = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setImage(String(reader.result)); reader.readAsDataURL(file); };
  const createCampaign = () => {
    const campaign: Campaign = { id: `campaign-${Date.now()}`, email, templateId: template.id, graduate, ceremony, celebration, invitees, delivery, image, createdAt: new Date().toISOString() };
    const existing = getLocal<Campaign[]>("gradinvite-campaigns", []); saveLocal("gradinvite-campaigns", [campaign, ...existing]); onDone(campaign);
  };
  return <div className="creator-shell"><div className="creator-top"><button className="back-button" onClick={onBack}><ChevronLeft size={16} /> Back</button><div className="creator-progress"><span className={step >= 1 ? "active" : ""}>Details</span><i /><span className={step >= 2 ? "active" : ""}>Invitees</span><i /><span className={step >= 3 ? "active" : ""}>Share</span></div><span className="creator-email">{email}</span></div><div className="creator-body"><div className="creator-form"><Badge className="eyebrow">{step === 1 ? "YOUR GRADUATION" : step === 2 ? "YOUR GUEST LIST" : "READY TO SHARE"}</Badge>{step === 1 && <><h2>Set the scene.</h2><p className="form-intro">Start with the details your guests will want to remember.</p><div className="image-upload"><input id="graduate-image" type="file" accept="image/*" onChange={(e) => fileChange(e.target.files?.[0])} /><label htmlFor="graduate-image">{image ? <img src={image} alt="Graduate preview" /> : <><span className="upload-icon"><ImagePlus size={21} /></span><strong>Add a graduate photo</strong><small>JPG or PNG · optional</small></>}</label></div><div className="form-grid"><div className="field full"><label>Graduate’s full name *</label><Input value={graduate.name} onChange={(e) => setGraduate({ ...graduate, name: e.target.value })} placeholder="e.g. Aline Mukamana" /></div><div className="field"><label>Nickname</label><Input value={graduate.nickname} onChange={(e) => setGraduate({ ...graduate, nickname: e.target.value })} placeholder="What friends call you" /></div><div className="field"><label>Graduation date</label><Input type="date" value={graduate.date} onChange={(e) => setGraduate({ ...graduate, date: e.target.value })} /></div><div className="field"><label>Your phone</label><Input value={graduate.phone} onChange={(e) => setGraduate({ ...graduate, phone: e.target.value })} placeholder="07…" /></div><div className="field"><label>Your email</label><Input value={graduate.email} onChange={(e) => setGraduate({ ...graduate, email: e.target.value })} /></div><div className="field full"><label>Personal message</label><Textarea value={graduate.message} onChange={(e) => setGraduate({ ...graduate, message: e.target.value })} rows={3} /></div></div><div className="venue-grid"><VenueCard title="Graduation ceremony" icon={<CalendarDays size={16} />} value={ceremony} setValue={setCeremony} /><VenueCard title="Celebration venue" icon={<Gift size={16} />} value={celebration} setValue={setCelebration} /></div></>}{step === 2 && <><h2>Bring your people.</h2><p className="form-intro">Add everyone who should receive their own invitation. We’ll create one link per person.</p><div className="invitee-toolbar"><span><Users size={17} /> {invitees.length} invitation{invitees.length === 1 ? "" : "s"} so far</span><button onClick={addInvitee}><span>+</span> Add invitee</button></div><div className="invitee-list">{invitees.map((item, index) => <div className="invitee-row" key={item.id}><span className="invitee-index">{String(index + 1).padStart(2, "0")}</span><Input value={item.name} onChange={(e) => updateInvitee(item.id, "name", e.target.value)} placeholder="Invitee full name" /><div className="phone-input"><Phone size={14} /><Input value={item.phone} onChange={(e) => updateInvitee(item.id, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="079…" /></div><button className="icon-button" onClick={() => removeInvitee(item.id)} aria-label="Remove invitee"><X size={16} /></button></div>)}</div><div className="privacy-note"><ShieldCheck size={17} /><span>Each guest gets a private invitation link. You can choose whether their name appears on it.</span></div></>}{step === 3 && <><h2>Choose how to share.</h2><p className="form-intro">Every invitee gets their own invitation. Choose what you’d like to send them.</p><div className="delivery-options">{(["link", "qr", "both"] as const).map((option) => <button key={option} className={`delivery-card ${delivery === option ? "selected" : ""}`} onClick={() => setDelivery(option)}><div className="delivery-icon">{option === "link" ? <Link2 size={20} /> : option === "qr" ? <QrCode size={20} /> : <><Link2 size={15} /><QrCode size={15} /></>}</div><strong>{option === "link" ? "Clickable link" : option === "qr" ? "QR code" : "Both"}</strong><span>{option === "link" ? "Easy to send by WhatsApp or email" : option === "qr" ? "Perfect for printed cards" : "The most flexible option"}</span>{delivery === option && <span className="delivery-check"><Check size={13} /></span>}</button>)}</div><div className="share-summary"><div className="summary-icon"><Send size={18} /></div><div><strong>Ready to create {invitees.length} invitation{invitees.length === 1 ? "" : "s"}</strong><p>Each one will include {graduate.name || "your graduate"}’s details and the two venue locations.</p></div></div></>}{error && <div className="form-error">{error}</div>}<div className="form-actions"><Button className="primary-button" onClick={step < 3 ? goNext : createCampaign}>{step < 3 ? <>Continue <ArrowRight size={16} /></> : <>Create invitations <Sparkles size={16} /></>}</Button>{step > 1 && <button className="back-button" onClick={() => setStep(step - 1)}>Back</button>}</div></div><div className="live-preview"><span className="preview-label">LIVE PREVIEW</span><div className={`preview-card ${template.className}`}><div className="preview-top"><span>GRADUATION</span><span>{graduate.date ? graduate.date.replaceAll("-", ".") : "12.12.26"}</span></div>{image ? <img className="preview-image" src={image} alt="" /> : <div className="preview-initial">{graduate.name ? graduate.name.charAt(0).toUpperCase() : template.monogram}</div>}<div className="preview-kicker">A NEW CHAPTER</div><div className="preview-name">{graduate.name || template.sampleName}</div><div className="preview-line" /><p>{graduate.message || "A day worth remembering."}</p><div className="preview-date"><CalendarDays size={13} /> {formatDate(graduate.date)}</div><div className="preview-venue"><MapPin size={13} /> {ceremony.name || "Ceremony venue"}</div><div className="preview-footer">YOU ARE INVITED</div></div><p className="preview-caption">Your guests will see this invitation when they open their personal link or scan their QR code.</p></div></div></div>;
}

function VenueCard({ title, icon, value, setValue }: { title: string; icon: ReactNode; value: { name: string; location: string; directions: string }; setValue: (v: { name: string; location: string; directions: string }) => void }) {
  return <div className="venue-card"><div className="venue-card-title">{icon}<strong>{title}</strong></div><Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} placeholder="Venue name" /><Input value={value.location} onChange={(e) => setValue({ ...value, location: e.target.value })} placeholder="Address or location" /><div className="venue-directions"><MapPin size={14} /><Input value={value.directions} onChange={(e) => setValue({ ...value, directions: e.target.value })} placeholder="Directions link (optional)" /></div></div>;
}

type Campaign = { id: string; email: string; templateId: string; graduate: { name: string; nickname: string; phone: string; email: string; date: string; message: string }; ceremony: { name: string; location: string; directions: string }; celebration: { name: string; location: string; directions: string }; invitees: { id: string; name: string; phone: string }[]; delivery: "link" | "qr" | "both"; image: string | null; createdAt: string };

function CreatorPage({ initialTemplate }: { initialTemplate?: string }) {
  const [, navigate] = useLocation();
  const [templateId, setTemplateId] = useState(initialTemplate || templates[0].id);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const template = templates.find((item) => item.id === templateId) || templates[0];
  return <div className="creator-page"><header className="minimal-nav"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><span className="minimal-label">Create an invitation</span></header>{!verified ? <div className="creator-auth-wrap"><div className="template-pick-side"><span className="preview-label">START WITH A STYLE</span><h1>A little look<br /><em>goes a long way.</em></h1><div className="creator-template-list">{templates.map((item) => <TemplateMiniCard key={item.id} template={item} selected={item.id === templateId} onClick={() => setTemplateId(item.id)} />)}</div></div><OtpStep email={email} setEmail={setEmail} onVerified={() => setVerified(true)} onBack={() => navigate("/")} /></div> : <CreationForm email={email} template={template} onBack={() => setVerified(false)} onDone={(campaign) => navigate(`/created/${campaign.id}`)} />}</div>;
}

function CreatedPage({ campaignId }: { campaignId: string }) {
  const [, navigate] = useLocation();
  const campaigns = getLocal<Campaign[]>("gradinvite-campaigns", []);
  const campaign = campaigns.find((item) => item.id === campaignId) || campaigns[0];
  if (!campaign) return <EmptyState title="No invitation found" action={() => navigate("/")} />;
  const baseUrl = `${window.location.origin}/invite`;
  return <div className="created-page"><header className="minimal-nav"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><Badge className="success-badge"><Check size={13} /> CREATED</Badge></header><main className="created-main"><div className="created-intro"><span className="success-mark"><Check size={24} /></span><Badge className="eyebrow">READY TO SHARE</Badge><h1>{campaign.invitees.length} beautiful invitation{campaign.invitees.length === 1 ? " is" : "s are"}<br /><em>waiting for your people.</em></h1><p>Every guest has their own private link. Share them one by one or keep this page handy for later.</p></div><div className="created-list">{campaign.invitees.map((invitee, index) => { const link = `${baseUrl}/${campaign.id}-${invitee.id}`; const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`; return <div className="created-invitee" key={invitee.id}><div className="created-number">{String(index + 1).padStart(2, "0")}</div><div className="created-person"><strong>{invitee.name}</strong><span>{invitee.phone}</span></div><div className="created-delivery">{(campaign.delivery === "qr" || campaign.delivery === "both") && <img src={qr} alt={`QR code for ${invitee.name}`} />}{(campaign.delivery === "link" || campaign.delivery === "both") && <button onClick={() => { navigator.clipboard?.writeText(link); toast.success("Invitation link copied"); }}><Link2 size={15} /> Copy link</button>}</div><a href={link} target="_blank" rel="noreferrer" className="open-invite"><ExternalLink size={15} /></a></div>; })}</div><div className="created-actions"><Button className="primary-button" onClick={() => navigate(`/invite/${campaign.id}-${campaign.invitees[0].id}`)}>Preview invitation <ArrowRight size={16} /></Button><button className="text-link-button" onClick={() => navigate("/view")}>View all my creations <ArrowRight size={15} /></button></div></main></div>;
}

function PublicInvite({ inviteId }: { inviteId: string }) {
  const campaigns = getLocal<Campaign[]>("gradinvite-campaigns", []);
  const campaign = campaigns.find((item) => inviteId.startsWith(`${item.id}-`)) || { id: "demo", email: "", templateId: "terracotta", graduate: { name: "Aline Mukamana", nickname: "", phone: "", email: "", date: "2026-12-12", message: "I would love for you to join me as I celebrate this special milestone." }, ceremony: { name: "University of Rwanda — Main Campus", location: "Kigali, Rwanda", directions: "" }, celebration: { name: "The Garden Terrace", location: "Nyarugenge, Kigali", directions: "" }, invitees: [{ id: "guest", name: "Dear friend", phone: "" }], delivery: "both" as const, image: null, createdAt: "" };
  const guest = campaign.invitees.find((item) => inviteId === `${campaign.id}-${item.id}`) || campaign.invitees[0];
  const template = templates.find((item) => item.id === campaign.templateId) || templates[0];
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [validated, setValidated] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const validatePhone = () => { if (!isValidRwandaMobile(phone)) { toast.error("Enter a valid Rwanda mobile number", { description: "Use 10 digits starting with 072, 073, 078 or 079." }); setValidated(false); return; } setValidated(true); toast.success("Phone number validated"); };
  const submitFeedback = () => { if (!validated || rating === 0 || !message.trim()) { toast.error("Complete your rating, message and phone validation first"); return; } saveLocal("gradinvite-feedback", [{ rating, message, phone, invitationId: inviteId, createdAt: new Date().toISOString() }, ...getLocal("gradinvite-feedback", [])]); toast.success("Thank you for sharing your feedback"); setFeedbackOpen(false); };
  return <div className={`public-invite ${template.className}`}><div className="invite-topbar"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={14} /></span><span>grad<span>invite</span></span></Link><button onClick={() => setFeedbackOpen(true)} className="feedback-trigger"><MessageCircle size={15} /> Leave feedback</button></div><main className="invite-main"><div className="invite-ornament">✦</div><span className="invite-kicker">YOU ARE INVITED TO CELEBRATE</span><h1>{campaign.graduate.name}</h1>{guest?.name && guest.name !== "Dear friend" && <p className="invite-guest">Dear {guest.name},</p>}<p className="invite-message">{campaign.graduate.message}</p>{campaign.image ? <img className="invite-photo" src={campaign.image} alt={campaign.graduate.name} /> : <div className="invite-photo-placeholder">{campaign.graduate.name.charAt(0)}</div>}<div className="invite-date-block"><span>{formatDate(campaign.graduate.date)}</span><i /> <span>2026</span></div><div className="invite-locations"><div><span className="location-label"><CalendarDays size={14} /> Graduation ceremony</span><strong>{campaign.ceremony.name}</strong><span>{campaign.ceremony.location}</span>{campaign.ceremony.directions && <a href={campaign.ceremony.directions} target="_blank" rel="noreferrer">View directions <ExternalLink size={12} /></a>}</div><div><span className="location-label"><Gift size={14} /> Celebration</span><strong>{campaign.celebration.name}</strong><span>{campaign.celebration.location}</span>{campaign.celebration.directions && <a href={campaign.celebration.directions} target="_blank" rel="noreferrer">View directions <ExternalLink size={12} /></a>}</div></div><div className="invite-footer-note">It would mean so much to have you there.</div></main>{feedbackOpen && <div className="modal-backdrop" onClick={() => setFeedbackOpen(false)}><div className="feedback-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setFeedbackOpen(false)}><X size={18} /></button><Badge className="eyebrow">A QUICK NOTE</Badge><h2>How did this invitation feel?</h2><p>Your feedback helps us make every celebration a little better.</p><div className="stars">{[1,2,3,4,5].map((n) => <button key={n} className={rating >= n ? "star-active" : ""} onClick={() => setRating(n)}><Star size={24} fill="currentColor" /></button>)}</div><label>Phone number</label><div className="validate-row"><Input value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setValidated(false); }} placeholder="079 000 0000" /><Button variant="outline" onClick={validatePhone}>{validated ? <Check size={15} /> : "Validate"}</Button></div><label>Your message</label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Tell us what you loved…" /><Button className="primary-button full-button" onClick={submitFeedback}>Send feedback <Send size={15} /></Button></div></div>}</div>;
}

function ViewCreations() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState(""); const [otp, setOtp] = useState(""); const [sent, setSent] = useState(false); const [campaigns, setCampaigns] = useState<Campaign[]>([]); const [error, setError] = useState("");
  const request = () => { if (!email.includes("@")) { setError("Enter the email you used to create your invitations."); return; } setError(""); setSent(true); toast.success("A code is ready", { description: `Demo code: ${demoOtp}` }); };
  const verify = () => { if (otp !== demoOtp) { setError(`Use the demo code ${demoOtp} for this preview.`); return; } setCampaigns(getLocal<Campaign[]>("gradinvite-campaigns", []).filter((item) => item.email.toLowerCase() === email.toLowerCase())); };
  return <div className="simple-page"><header className="minimal-nav"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><button className="back-button" onClick={() => navigate("/")}><ChevronLeft size={16} /> Home</button></header><main className="view-main"><div className="view-heading"><Badge className="eyebrow">YOUR SPACE</Badge><h1>Welcome back<br /><em>to your creations.</em></h1><p>Enter the email you used before. We’ll send a one-time code so you can pick up where you left off.</p></div>{campaigns.length === 0 ? <div className="view-auth"><Mail size={21} /><label>Email address</label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />{!sent ? <Button className="primary-button full-button" onClick={request}>Send me a code <ArrowRight size={16} /></Button> : <><div className="otp-sent"><Check size={15} /> Code sent to {email}</div><Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 2026 for preview" /><Button className="primary-button full-button" onClick={verify}>View my creations <ArrowRight size={16} /></Button></>}{error && <div className="form-error">{error}</div>}</div> : <div className="my-campaigns"><div className="campaigns-top"><strong>{campaigns.length} creation{campaigns.length > 1 ? "s" : ""}</strong><Button className="primary-button" onClick={() => navigate("/create")}>New invitation <ArrowRight size={15} /></Button></div>{campaigns.map((campaign) => <div className="campaign-row" key={campaign.id}><div className={`campaign-swatch ${campaign.templateId}`} /><div><strong>{campaign.graduate.name}</strong><span>{campaign.invitees.length} individual invitations · {formatDate(campaign.graduate.date)}</span></div><button onClick={() => navigate(`/created/${campaign.id}`)}><ArrowRight size={17} /></button></div>)}</div>}</main></div>;
}

function AdminPage() {
  const [, navigate] = useLocation();
  const campaigns = getLocal<Campaign[]>("gradinvite-campaigns", []); const feedback = getLocal<{ rating: number; message: string; phone: string }[]>("gradinvite-feedback", []); const totalInvitees = campaigns.reduce((sum, item) => sum + item.invitees.length, 0); const average = feedback.length ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1) : "—";
  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  return <div className="admin-page"><aside className="admin-sidebar"><Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link><div className="admin-profile"><div className="admin-avatar">A</div><div><strong>Admin panel</strong><span>Invitation studio</span></div></div><nav><a className="active"><Sparkles size={16} /> Overview</a><a><Gift size={16} /> Templates <span>3</span></a><a><LockKeyhole size={16} /> OTP periods <span>1</span></a><a><Users size={16} /> Invitee requests</a><a><MessageCircle size={16} /> Feedback <span>{feedback.length}</span></a></nav><button className="sidebar-bottom" onClick={() => navigate("/")}><ExternalLink size={15} /> View public site</button></aside><main className="admin-main"><div className="admin-header"><div><span className="admin-kicker">{todayLabel}</span><h1>{greeting}, admin.</h1><p>Here’s what’s happening with your invitation studio.</p></div><div className="admin-actions"><Button variant="outline" onClick={() => navigate("/create")}><Sparkles size={15} /> Preview creator flow</Button></div></div><div className="metric-grid"><div className="metric-card"><span>Active OTP period</span><strong>01</strong><small>Configured and available</small><div className="metric-accent green" /></div><div className="metric-card"><span>Invitations created</span><strong>{campaigns.length}</strong><small>Across all campaigns</small><div className="metric-accent terracotta" /></div><div className="metric-card"><span>Total invitees</span><strong>{totalInvitees}</strong><small>Individual links generated</small><div className="metric-accent gold" /></div><div className="metric-card"><span>Average feedback</span><strong>{average}<small>{average !== "—" && " / 5"}</small></strong><small>{feedback.length ? `${feedback.length} response${feedback.length === 1 ? "" : "s"}` : "No responses yet"}</small><div className="metric-accent blue" /></div></div><div className="admin-grid"><section className="admin-card active-otp"><div className="admin-card-head"><div><span className="card-eyebrow">OTP CONTROL</span><h2>Current access period</h2></div><Badge className="live-badge"><span /> LIVE</Badge></div><div className="otp-control"><div className="otp-code">20<span>26</span></div><div><strong>Creation access is open</strong><p>Anyone can request a code by email until <b>31 October 2026</b>.</p></div></div><div className="otp-progress"><div><span>Usage this period</span><strong>38 / unlimited</strong></div><div className="progress-track"><span style={{ width: "34%" }} /></div></div><Button className="secondary-button">Configure next period <ArrowRight size={15} /></Button></section><section className="admin-card"><div className="admin-card-head"><div><span className="card-eyebrow">TEMPLATE COLLECTION</span><h2>Available styles</h2></div><button className="small-link">Manage <ArrowRight size={14} /></button></div><div className="admin-template-list">{templates.map((item) => <div key={item.id} className="admin-template"><div className={`admin-template-thumb ${item.className}`}><span>{item.monogram}</span></div><div><strong>{item.name}</strong><span>Active template</span></div><Check size={15} /></div>)}</div></section></div><section className="admin-card feedback-card"><div className="admin-card-head"><div><span className="card-eyebrow">LATEST FEEDBACK</span><h2>What guests are saying</h2></div><button className="small-link">View all <ArrowRight size={14} /></button></div>{feedback.length === 0 ? <div className="empty-feedback"><MessageCircle size={20} /><span>Feedback from guests will appear here.</span></div> : <div className="feedback-list">{feedback.slice(0, 3).map((item, index) => <div className="feedback-item" key={index}><div className="feedback-stars">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</div><p>“{item.message}”</p><span>Verified phone · {item.phone}</span></div>)}</div>}</section></main></div>;
}

function EmptyState({ title, action }: { title: string; action: () => void }) { return <div className="empty-screen"><Sparkles size={25} /><h2>{title}</h2><Button className="primary-button" onClick={action}>Go home <ArrowRight size={16} /></Button></div>; }

export default function Home() {
  const [matchInvite, paramsInvite] = useRoute("/invite/:id");
  const [matchCreated, paramsCreated] = useRoute("/created/:id");
  const [matchAdmin] = useRoute("/admin");
  const [matchCreate] = useRoute("/create");
  const [matchView] = useRoute("/view");
  const [location, navigate] = useLocation();
  const initialTemplate = new URLSearchParams(window.location.search).get("template") || undefined;
  useEffect(() => { document.title = location.startsWith("/invite") ? "You’re invited · GradInvite" : "GradInvite — Graduation invitations, made personal"; }, [location]);
  if (matchInvite && paramsInvite?.id) return <PublicInvite inviteId={paramsInvite.id} />;
  if (matchCreated && paramsCreated?.id) return <CreatedPage campaignId={paramsCreated.id} />;
  if (matchAdmin) return <AdminPage />;
  if (matchCreate) return <CreatorPage initialTemplate={initialTemplate} />;
  if (matchView) return <ViewCreations />;
  return <HomePage onCreate={(templateId) => navigate(templateId ? `/create?template=${templateId}` : "/create")} />;
}
