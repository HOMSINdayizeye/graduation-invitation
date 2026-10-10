import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Check, ExternalLink, Gift, KeyRound, LockKeyhole, LogOut, Mail, FileSpreadsheet, FileText, Link2, MessageCircle, Settings, Sparkles, Users } from "lucide-react";
import { toast } from "@/lib/toast";
import { copyText, downloadExcel, guestRows, printGuestPdf, type GuestRow } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type Tab = "overview" | "templates" | "users" | "invitations" | "otp" | "feedback" | "settings";

type TemplateItem = {
  id: string;
  name: string;
  subtitle: string;
  className: string;
  accent: string;
  monogram: string;
  sampleName: string;
  sampleImage: string;
  active: boolean;
  sortOrder: number;
};

const formatWhen = (value: string | Date | null | undefined) =>
  value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const StatusPill = ({ status }: { status: string }) => <span className={`status-pill status-${status}`}>{status}</span>;

// Plain checkbox styled as a switch; keeps the admin page free of extra UI dependencies.
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

function EmailServiceCard() {
  const credits = trpc.admin.emailCredits.useQuery(undefined, { retry: false, staleTime: 60_000 });
  const test = trpc.system.sendTestEmail.useMutation({
    onSuccess: () => toast.success("Test email sent to your admin address"),
    onError: (e) => toast.error(e.message),
  });
  const data = credits.data;
  return (
    <section className="admin-card">
      <div className="admin-card-head">
        <div><span className="card-eyebrow">EMAIL SERVICE</span><h2>Brevo delivery</h2></div>
        {data?.configured ? <span className="live-badge"><span /> CONNECTED</span> : <span className="status-pill status-failed">not configured</span>}
      </div>
      <div className="otp-control">
        <div className="otp-code">{credits.isLoading ? "…" : data?.credits ?? "—"}</div>
        <div>
          <strong>Email credits remaining</strong>
          <p>{data?.transport === "api+smtp" ? "Sending through the Brevo API first, with SMTP relay as fallback. " : data?.transport === "smtp" ? "Sending through Brevo SMTP relay. " : data?.transport === "api" ? "Sending through the Brevo API (subject to its authorised-IP list). " : "No email transport configured. "}{data?.error ? data.error : data?.plan ? `${data.plan} plan · account ${data.account ?? ""}` : "Add BREVO_API_KEY to show remaining credits here."}</p>
        </div>
      </div>
      <Button className="secondary-button" disabled={!data?.configured || test.isPending} onClick={() => test.mutate()}>
        <Mail size={15} /> {test.isPending ? "Sending" : "Send me a test email"}
      </Button>
    </section>
  );
}

function SettingsPanel() {
  const utils = trpc.useUtils();
  const settings = trpc.admin.settings.useQuery(undefined, { retry: false });
  const update = trpc.admin.updateSettings.useMutation({
    onSuccess: (data) => { utils.admin.settings.setData(undefined, data); toast.success("Settings saved"); },
    onError: (e) => toast.error(e.message),
  });
  const s = settings.data;
  return (
    <>
      <section className="admin-card">
        <div className="admin-card-head"><div><span className="card-eyebrow">ACCESS CONTROL</span><h2>One-time codes</h2></div></div>
        <div className="toggle-row">
          <div><strong>Require a one-time code</strong><p>People creating or viewing invitations must enter the code emailed to them. Switch off to let everyone through without any code.</p></div>
          <Toggle checked={s?.otpRequired ?? true} disabled={!s || update.isPending} onChange={(value) => update.mutate({ otpRequired: value })} />
        </div>
        <div className="toggle-row">
          <div><strong>Allow continuing without a code when email cannot be sent</strong><p>When Brevo credits are exhausted or the email service fails, the person is let through and the request is logged as "bypassed" instead of failing.</p></div>
          <Toggle checked={s?.allowWithoutOtpWhenEmailExhausted ?? false} disabled={!s || update.isPending} onChange={(value) => update.mutate({ allowWithoutOtpWhenEmailExhausted: value })} />
        </div>
        <p className="settings-note">Last changed {formatWhen(s?.updatedAt)}</p>
      </section>
      <EmailServiceCard />
    </>
  );
}

function TemplateRow({ template }: { template: TemplateItem }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: template.name, subtitle: template.subtitle, accent: template.accent, sampleName: template.sampleName, active: template.active });
  useEffect(() => setForm({ name: template.name, subtitle: template.subtitle, accent: template.accent, sampleName: template.sampleName, active: template.active }), [template]);
  const update = trpc.templates.update.useMutation({
    onSuccess: () => { utils.templates.list.invalidate(); toast.success(`${form.name} saved`); },
    onError: (e) => toast.error(e.message),
  });
  const dirty = form.name !== template.name || form.subtitle !== template.subtitle || form.accent !== template.accent || form.sampleName !== template.sampleName || form.active !== template.active;
  return (
    <div className="template-edit">
      <div className={`admin-template-thumb ${template.className}`} style={{ opacity: form.active ? 1 : 0.4 }}><span>{template.monogram}</span></div>
      <div>
        <div className="template-edit-fields">
          <div><label>Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Sample name on card</label><Input value={form.sampleName} onChange={(e) => setForm({ ...form, sampleName: e.target.value })} /></div>
          <div className="full"><label>Subtitle</label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
          <div><label>Accent colour</label><div className="color-field"><input type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} /><Input value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} /></div></div>
          <div><label>Visible to visitors</label><div className="toggle-inline"><Toggle checked={form.active} onChange={(value) => setForm({ ...form, active: value })} /><span>{form.active ? "Active" : "Hidden"}</span></div></div>
        </div>
        <div className="template-edit-actions">
          <Button className="primary-button" disabled={!dirty || update.isPending} onClick={() => update.mutate({ id: template.id, ...form })}>
            {update.isPending ? "Saving" : "Save changes"} <Check size={15} />
          </Button>
          <span className="card-eyebrow">ID {template.id} · STYLE {template.className}</span>
        </div>
      </div>
    </div>
  );
}

function TemplatesPanel() {
  const templates = trpc.templates.list.useQuery(undefined, { retry: false });
  const list = (templates.data ?? []) as TemplateItem[];
  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><span className="card-eyebrow">TEMPLATE COLLECTION</span><h2>Edit the styles visitors can choose</h2></div><span className="card-eyebrow">{list.filter((t) => t.active).length} OF {list.length} ACTIVE</span></div>
      <p className="settings-note">Colours and layouts are fixed per style; you can rename a template, change its description and accent, update the sample name shown on the card, or hide it from visitors.</p>
      {list.map((template) => <TemplateRow key={template.id} template={template} />)}
    </section>
  );
}

function UsersPanel() {
  const utils = trpc.useUtils();
  const users = trpc.admin.users.useQuery(undefined, { retry: false });
  const unlock = trpc.admin.unlockUser.useMutation({ onSuccess: () => { utils.admin.users.invalidate(); toast.success("Account unlocked"); }, onError: (e) => toast.error(e.message) });
  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><span className="card-eyebrow">ACCOUNTS</span><h2>All registered users</h2></div><span className="card-eyebrow">{users.data?.length ?? 0} TOTAL</span></div>
      <table className="admin-table">
        <thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>LAST SIGN IN</th><th>STATUS</th><th></th></tr></thead>
        <tbody>
          {users.data?.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td><td>{u.role}</td><td>{formatWhen(u.lastSignedIn)}</td>
              <td>{u.locked ? <StatusPill status="failed" /> : <StatusPill status="verified" />}{u.failedAttempts > 0 && !u.locked && <small className="muted"> {u.failedAttempts} failed</small>}</td>
              <td>{u.locked && <button className="small-link" onClick={() => unlock.mutate({ id: u.id })}><LockKeyhole size={13} /> Unlock</button>}</td>
            </tr>
          ))}
          {users.data?.length === 0 && <tr><td colSpan={6} className="muted">No accounts yet.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

type AdminCampaign = { id: string; email: string; templateId: string; graduate: { name: string; date: string }; ceremony: { name: string }; invitees: { id: string; name: string; phone: string }[]; createdAt: string };

// Every invitation grouped by the email that created it, with Excel and PDF exports per group or for everything.
function InvitationsPanel() {
  const query = trpc.admin.campaigns.useQuery(undefined, { retry: false });
  const campaigns = (query.data ?? []) as AdminCampaign[];
  const groups = Array.from(campaigns.reduce((map, c) => { map.set(c.email, [...(map.get(c.email) ?? []), c]); return map; }, new Map<string, AdminCampaign[]>()), ([email, list]) => ({ email, list, rows: guestRows(list) }));
  const guestTotal = groups.reduce((n, g) => n + g.rows.length, 0);
  const stamp = new Date().toISOString().slice(0, 10);
  const exportExcel = (selection: { name: string; rows: GuestRow[] }[], file: string) => { if (!selection.some((g) => g.rows.length)) { toast.error("No guests to export"); return; } downloadExcel(selection, file); toast.success("Excel file downloaded"); };
  const exportPdf = (title: string, selection: { name: string; rows: GuestRow[] }[]) => { if (!selection.some((g) => g.rows.length)) { toast.error("No guests to export"); return; } if (!printGuestPdf(title, selection)) toast.error("Pop-up blocked — allow pop-ups to export PDF"); };
  const copyLink = async (link: string) => { if (await copyText(link)) toast.success("Invitation link copied"); else toast.error("Could not copy the link"); };
  const btn = { padding: "6px 12px", fontSize: "11px" } as const;
  return (
    <>
      <section className="admin-card">
        <div className="admin-card-head"><div><span className="card-eyebrow">ALL GUESTS</span><h2>{campaigns.length} invitation{campaigns.length === 1 ? "" : "s"} · {guestTotal} guest{guestTotal === 1 ? "" : "s"} · {groups.length} creator{groups.length === 1 ? "" : "s"}</h2></div><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}><Button className="secondary-button" style={btn} onClick={() => exportExcel(groups.map((g) => ({ name: g.email, rows: g.rows })), `gradinvite-all-guests-${stamp}`)} disabled={query.isLoading}><FileSpreadsheet size={14} /> Excel, all groups</Button><Button className="secondary-button" style={btn} onClick={() => exportPdf("GradInvite guest list", groups.map((g) => ({ name: g.email, rows: g.rows })))} disabled={query.isLoading}><FileText size={14} /> PDF, all groups</Button></div></div>
        {query.error && <p className="muted">{query.error.message}</p>}
        {!query.isLoading && campaigns.length === 0 && <p className="muted">No invitations have been created yet.</p>}
      </section>
      {groups.map((group) => (
        <section className="admin-card" key={group.email}>
          <div className="admin-card-head"><div><span className="card-eyebrow">INVITED BY</span><h2>{group.email}</h2><p className="muted" style={{ margin: "4px 0 0", fontSize: "11px" }}>{group.list.length} invitation{group.list.length === 1 ? "" : "s"} · {group.rows.length} guest{group.rows.length === 1 ? "" : "s"}</p></div><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}><Button className="secondary-button" style={btn} onClick={() => exportExcel([{ name: group.email, rows: group.rows }], `gradinvite-${group.email.replace(/[^a-z0-9]+/gi, "-")}-${stamp}`)}><FileSpreadsheet size={14} /> Excel</Button><Button className="secondary-button" style={btn} onClick={() => exportPdf(`Guests invited by ${group.email}`, [{ name: group.email, rows: group.rows }])}><FileText size={14} /> PDF</Button></div></div>
          {group.list.map((campaign) => (
            <div key={campaign.id} style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}><strong>{campaign.graduate.name}</strong><span className="muted" style={{ fontSize: "11px" }}>{campaign.graduate.date} · {campaign.ceremony.name} · {campaign.templateId} · created {formatWhen(campaign.createdAt)}</span></div>
              <table className="admin-table">
                <thead><tr><th>#</th><th>GUEST</th><th>PHONE</th><th>LINK</th></tr></thead>
                <tbody>{campaign.invitees.map((g, i) => { const link = `${window.location.origin}/invite/${campaign.id}-${g.id}`; return <tr key={g.id}><td>{i + 1}</td><td>{g.name || "Guest"}</td><td>{g.phone || "—"}</td><td><button className="small-link" onClick={() => copyLink(link)}><Link2 size={13} /> Copy</button> <a className="small-link" href={link} target="_blank" rel="noreferrer">Open</a></td></tr>; })}</tbody>
              </table>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function OtpPanel() {
  const people = trpc.admin.otpEmails.useQuery(undefined, { retry: false });
  const requests = trpc.admin.otpRequests.useQuery({ limit: 500 }, { retry: false });

  const exportPdf = () => {
    const rows = requests.data ?? [];
    const peopleRows = people.data ?? [];
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <title>GradInvite Audit Report</title>
      <style>
        body { font-family: 'DM Sans', system-ui, sans-serif; color: #263334; margin: 32px; }
        h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0 0 4px; }
        .sub { color: #89928e; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 32px; }
        th, td { border: 1px solid #d8ddd8; padding: 8px 10px; text-align: left; }
        th { background: #f7f5f0; font-weight: 700; }
        .status-sent { color: #c9a227; } .status-verified { color: #4e796d; } .status-bypassed { color: #8a9490; } .status-failed { color: #a14635; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>GradInvite Audit Report</h1>
      <div class="sub">Generated ${new Date().toLocaleString("en-GB")} · ${rows.length} code requests · ${peopleRows.length} distinct emails</div>
      <h2 style="font-size:16px;margin:0 0 12px">People</h2>
      <table><thead><tr><th>Email</th><th>Last template</th><th>Codes requested</th><th>Verified</th><th>Last status</th><th>Last request</th></tr></thead>
      <tbody>${peopleRows.map((p) => `<tr><td>${p.email}</td><td>${p.lastTemplate || "—"}</td><td>${p.requests}</td><td>${p.verified}</td><td class="status-${p.lastStatus}">${p.lastStatus}</td><td>${new Date(p.lastAt).toLocaleString("en-GB")}</td></tr>`).join("")}</tbody></table>
      <h2 style="font-size:16px;margin:0 0 12px">Code requests</h2>
      <table><thead><tr><th>When</th><th>Email</th><th>Template</th><th>Purpose</th><th>Status</th><th>Note</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td>${new Date(r.createdAt).toLocaleString("en-GB")}</td><td>${r.email}</td><td>${r.templateId || "—"}</td><td>${r.purpose}</td><td class="status-${r.status}">${r.status}</td><td>${r.error || (r.attempts ? `${r.attempts} wrong attempt${r.attempts === 1 ? "" : "s"}` : "")}</td></tr>`).join("")}</tbody></table>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Pop-up blocked — allow pop-ups to export PDF"); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <>
      <section className="admin-card">
        <div className="admin-card-head"><div><span className="card-eyebrow">PEOPLE</span><h2>Emails that used the templates</h2></div><span className="card-eyebrow">{people.data?.length ?? 0} PEOPLE</span></div>
        <table className="admin-table">
          <thead><tr><th>EMAIL</th><th>LAST TEMPLATE</th><th>CODES</th><th>VERIFIED</th><th>LAST STATUS</th><th>LAST REQUEST</th></tr></thead>
          <tbody>
            {people.data?.map((p) => <tr key={p.email}><td>{p.email}</td><td>{p.lastTemplate || "—"}</td><td>{p.requests}</td><td>{p.verified}</td><td><StatusPill status={p.lastStatus} /></td><td>{formatWhen(p.lastAt)}</td></tr>)}
            {people.data?.length === 0 && <tr><td colSpan={6} className="muted">Nobody has requested a code yet.</td></tr>}
          </tbody>
        </table>
      </section>
      <section className="admin-card">
        <div className="admin-card-head"><div><span className="card-eyebrow">LOG</span><h2>Every code request</h2></div><div style={{display:"flex",alignItems:"center",gap:"12px"}}><span className="card-eyebrow">LATEST 500</span><Button className="secondary-button" style={{padding:"6px 12px",fontSize:"11px"}} onClick={exportPdf} disabled={requests.isLoading}>Export PDF</Button></div></div>
        <table className="admin-table">
          <thead><tr><th>WHEN</th><th>EMAIL</th><th>TEMPLATE</th><th>PURPOSE</th><th>STATUS</th><th>NOTE</th></tr></thead>
          <tbody>
            {requests.data?.map((r) => <tr key={r.id}><td>{formatWhen(r.createdAt)}</td><td>{r.email}</td><td>{r.templateId || "—"}</td><td>{r.purpose}</td><td><StatusPill status={r.status} /></td><td className="muted">{r.error || (r.attempts ? `${r.attempts} wrong attempt${r.attempts === 1 ? "" : "s"}` : "")}</td></tr>)}
          </tbody>
        </table>
      </section>
    </>
  );
}

function FeedbackPanel() {
  const utils = trpc.useUtils();
  const query = trpc.admin.feedback.useQuery({ limit: 500 }, { retry: false });
  const update = trpc.admin.updateFeedback.useMutation({
    onSuccess: () => { utils.admin.feedback.invalidate(); toast.success("Feedback updated"); },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.admin.deleteFeedback.useMutation({
    onSuccess: () => { utils.admin.feedback.invalidate(); toast.success("Feedback removed"); },
    onError: (e) => toast.error(e.message),
  });
  const rows = (query.data ?? []) as { id: string; invitationId: string; rating: number; message: string; phone: string; email: string; status: string; adminNote: string; createdAt: string }[];
  const [note, setNote] = useState<Record<string, string>>({});
  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><span className="card-eyebrow">VISITOR NOTES</span><h2>Every piece of feedback</h2></div><span className="card-eyebrow">{rows.length} RESPONSES</span></div>
      {query.error && <p className="muted">{query.error.message}</p>}
      <table className="admin-table">
        <thead><tr><th>WHEN</th><th>RATING</th><th>INVITATION</th><th>PHONE</th><th>MESSAGE</th><th>STATUS</th><th>ACTION</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{formatWhen(r.createdAt)}</td>
              <td><strong>{r.rating}/5</strong></td>
              <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="muted">{r.invitationId}</td>
              <td>{r.phone || "—"}</td>
              <td style={{ maxWidth: "260px" }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.message}>{r.message}</div></td>
              <td>
                <select value={r.status} onChange={(e) => update.mutate({ id: r.id, status: e.target.value as any })} className="border border-gray-300 rounded px-2 py-1 text-xs bg-white">
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <Input placeholder="Admin note" value={note[r.id] ?? r.adminNote ?? ""} onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))} style={{ width: "140px" }} />
                <Button size="sm" variant="outline" onClick={() => update.mutate({ id: r.id, adminNote: note[r.id] ?? r.adminNote ?? "" })}>Save</Button>
                <button className="small-link" style={{ color: "#a14635" }} onClick={() => remove.mutate({ id: r.id })}>Delete</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !query.isLoading && <tr><td colSpan={7} className="muted">No feedback has been submitted yet.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

function Overview({ onGo }: { onGo: (tab: Tab) => void }) {
  const stats = trpc.admin.stats.useQuery(undefined, { retry: false });
  const latest = trpc.admin.otpRequests.useQuery({ limit: 6 }, { retry: false });
  const s = stats.data;
  return (
    <>
      <div className="metric-grid">
        <div className="metric-card"><span>Registered accounts</span><strong>{s?.users ?? "—"}</strong><small>Sign-in users</small><div className="metric-accent green" /></div>
        <div className="metric-card"><span>Code requests</span><strong>{s?.otpTotal ?? "—"}</strong><small>{s ? `${s.otp.verified} verified · ${s.otp.bypassed} bypassed · ${s.otp.failed} failed` : ""}</small><div className="metric-accent terracotta" /></div>
        <div className="metric-card"><span>People reached</span><strong>{s?.distinctEmails ?? "—"}</strong><small>Distinct emails</small><div className="metric-accent gold" /></div>
        <div className="metric-card"><span>Templates live</span><strong>{s?.templatesActive ?? "—"}</strong><small>Visible to visitors</small><div className="metric-accent blue" /></div>
        <div className="metric-card"><span>Feedback received</span><strong>{s?.feedbackTotal ?? "—"}</strong><small>{s ? `${s.feedback.new} new · ${s.feedback.reviewed} reviewed · ${s.feedback.resolved} resolved · ${s.feedback.rejected} rejected` : ""}</small><div className="metric-accent gold" /></div>
      </div>
      <div className="admin-grid">
        <EmailServiceCard />
        <section className="admin-card">
          <div className="admin-card-head"><div><span className="card-eyebrow">SHORTCUTS</span><h2>Manage</h2></div></div>
          <div className="admin-template-list">
            <button className="admin-shortcut" onClick={() => onGo("templates")}><Gift size={16} /><div><strong>Edit templates</strong><span>Names, descriptions, colours, visibility</span></div><ArrowRight size={15} /></button>
            <button className="admin-shortcut" onClick={() => onGo("users")}><Users size={16} /><div><strong>View all users</strong><span>Accounts, roles and locked sign-ins</span></div><ArrowRight size={15} /></button>
            <button className="admin-shortcut" onClick={() => onGo("otp")}><KeyRound size={16} /><div><strong>Code requests</strong><span>Who used templates and received codes</span></div><ArrowRight size={15} /></button>
            <button className="admin-shortcut" onClick={() => onGo("feedback")}><MessageCircle size={16} /><div><strong>Visitor feedback</strong><span>Read and correct every note left on an invitation</span></div><ArrowRight size={15} /></button>
            <button className="admin-shortcut" onClick={() => onGo("settings")}><Settings size={16} /><div><strong>Access settings</strong><span>Require codes, allow bypass when email is exhausted</span></div><ArrowRight size={15} /></button>
          </div>
        </section>
      </div>
      <section className="admin-card">
        <div className="admin-card-head"><div><span className="card-eyebrow">LATEST</span><h2>Recent code requests</h2></div><button className="small-link" onClick={() => onGo("otp")}>View all <ArrowRight size={14} /></button></div>
        <table className="admin-table">
          <thead><tr><th>WHEN</th><th>EMAIL</th><th>TEMPLATE</th><th>STATUS</th></tr></thead>
          <tbody>
            {latest.data?.map((r) => <tr key={r.id}><td>{formatWhen(r.createdAt)}</td><td>{r.email}</td><td>{r.templateId || "—"}</td><td><StatusPill status={r.status} /></td></tr>)}
            {latest.data?.length === 0 && <tr><td colSpan={4} className="muted">No requests yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}

const TABS: { key: Tab; label: string; icon: ReactNode; title: string; intro: string }[] = [
  { key: "overview", label: "Overview", icon: <Sparkles size={16} />, title: "Here is what is happening.", intro: "A live view of accounts, code requests and email delivery." },
  { key: "templates", label: "Templates", icon: <Gift size={16} />, title: "Templates", intro: "Edit what visitors see when they pick a style." },
  { key: "users", label: "Users", icon: <Users size={16} />, title: "Users", intro: "Everyone with a sign-in account." },
  { key: "invitations", label: "Invitations", icon: <Mail size={16} />, title: "Invitations", intro: "Every guest list, grouped by the person who sent the invitations." },
  { key: "otp", label: "Code requests", icon: <KeyRound size={16} />, title: "Code requests", intro: "Emails that used the templates and received one-time codes." },
  { key: "feedback", label: "Feedback", icon: <MessageCircle size={16} />, title: "Feedback", intro: "Every note left by a visitor on a public invitation." },
  { key: "settings", label: "Settings", icon: <Settings size={16} />, title: "Settings", intro: "Control one-time codes and email delivery." },
];

export default function Admin() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "admin";
  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><Sparkles size={15} /></span><span>grad<span>invite</span></span></Link>
        <div className="admin-profile"><div className="admin-avatar">{firstName.charAt(0).toUpperCase()}</div><div><strong>{user?.name ?? "Admin"}</strong><span>{user?.email ?? "Administrator"}</span></div></div>
        <nav>{TABS.map((t) => <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>{t.icon} {t.label}</button>)}</nav>
        <button className="sidebar-bottom" onClick={() => navigate("/")}><ExternalLink size={15} /> View public site</button>
        <button className="sidebar-bottom sidebar-signout" onClick={async () => { await logout(); toast.success("Signed out"); navigate("/"); }}><LogOut size={15} /> Sign out</button>
      </aside>
      <main className="admin-main">
        <div className="admin-header">
          <div><span className="admin-kicker">{todayLabel}</span><h1>{tab === "overview" ? `${greeting}, ${firstName}.` : current.title}</h1><p>{current.intro}</p></div>
          <div className="admin-actions"><Button variant="outline" onClick={() => navigate("/create")}><Sparkles size={15} /> Open the creator</Button></div>
        </div>
        {tab === "overview" && <Overview onGo={setTab} />}
        {tab === "templates" && <TemplatesPanel />}
        {tab === "users" && <UsersPanel />}
        {tab === "invitations" && <InvitationsPanel />}
        {tab === "otp" && <OtpPanel />}
        {tab === "feedback" && <FeedbackPanel />}
        {tab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}
