"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Navigation
  const [activeDashboard, setActiveDashboard] = useState<"support" | "prs" | "audit" | "connections">("support");

  // Auth Modes
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("admin@acme.test");
  const [loginPassword, setLoginPassword] = useState("Passw0rd!");
  const [authError, setAuthError] = useState("");

  // Registration state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [regRole, setRegRole] = useState("ORG_ADMIN");

  // Data states
  const [tickets, setTickets] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [digest, setDigest] = useState<any>(null);

  // Filters
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>("ALL");
  const [ticketSearch, setTicketSearch] = useState<string>("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");

  // Modals & Drawers
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showCreatePRModal, setShowCreatePRModal] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [newComment, setNewComment] = useState("");

  // Inputs
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prDesc, setPrDesc] = useState("");
  const [prApprovals, setPrApprovals] = useState(1);
  const [shareOrgId, setShareOrgId] = useState("");
  const [targetOrgSlug, setTargetOrgSlug] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (user) {
      fetchTickets();
      fetchPRs();
      fetchAuditLogs();
      fetchConnections();
    }
  }, [user, activeDashboard, ticketStatusFilter, auditActionFilter]);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const executeLogin = async (emailToUse: string, passwordToUse: string) => {
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, password: passwordToUse }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status} ${res.statusText})` };
      }
      if (!res.ok) {
        setAuthError(data.error || `Login failed (${res.status})`);
        setUser(null);
      } else {
        setUser(data.user);
      }
    } catch (err: any) {
      setAuthError(`Network connection error: ${err?.message || "Server unreachable"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          orgName: regOrgName,
          role: regRole,
        }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = { error: `Server error (${res.status} ${res.statusText})` };
      }
      if (!res.ok) {
        setAuthError(data.error || `Registration failed (${res.status})`);
        setUser(null);
      } else {
        setUser(data.user);
      }
    } catch (err: any) {
      setAuthError(`Network connection error: ${err?.message || "Server unreachable"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const handleLogoutEverywhere = async () => {
    const res = await fetch("/api/auth/logout-everywhere", { method: "POST" });
    if (res.ok) {
      alert("🔒 Token version incremented in DB. All active sessions invalidated across all browsers.");
      setUser(null);
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    const res = await fetch("/api/auth/switch-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetOrgId: orgId }),
    });
    if (res.ok) {
      await checkAuth();
    }
  };

  // Data fetching
  const fetchTickets = async () => {
    try {
      const query = ticketStatusFilter !== "ALL" ? `?status=${ticketStatusFilter}` : "";
      const res = await fetch(`/api/tickets${query}`);
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPRs = async () => {
    try {
      const res = await fetch("/api/prs");
      const data = await res.json();
      if (data.prs) setPrs(data.prs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const query = auditActionFilter !== "ALL" ? `?action=${auditActionFilter}` : "";
      const res = await fetch(`/api/audit${query}`);
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      if (data.connections) setConnections(data.connections);
    } catch (err) {
      console.error(err);
    }
  };

  // Ticket Handlers
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: ticketTitle, description: ticketDesc }),
    });
    if (res.ok) {
      setShowCreateTicketModal(false);
      setTicketTitle("");
      setTicketDesc("");
      fetchTickets();
    } else {
      alert("Failed to create ticket");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } else {
      alert("Failed to update ticket status. Ensure you have ORG_ADMIN or SUPPORT_AGENT role.");
    }
  };

  const handleAddComment = async (ticketId: string) => {
    if (!newComment.trim()) return;
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment }),
    });
    if (res.ok) {
      setNewComment("");
      const detailRes = await fetch(`/api/tickets/${ticketId}`);
      const detailData = await detailRes.json();
      if (detailData.ticket) setSelectedTicket(detailData.ticket);
      fetchTickets();
    }
  };

  const handleShareTicket = async (ticketId: string) => {
    if (!shareOrgId) return;
    const res = await fetch(`/api/tickets/${ticketId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sharedWithOrgId: shareOrgId }),
    });
    const data = await res.json();
    if (res.ok) {
      alert("✅ Ticket item explicitly shared with partner organization!");
      setShareOrgId("");
      fetchTickets();
      setSelectedTicket(null);
    } else {
      alert(data.error || "Failed to share ticket");
    }
  };

  // PR Handlers
  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/prs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: prTitle, description: prDesc, requiredApprovals: prApprovals }),
    });
    if (res.ok) {
      setShowCreatePRModal(false);
      setPrTitle("");
      setPrDesc("");
      fetchPRs();
    }
  };

  const handleReviewPR = async (prId: string, decision: "APPROVED" | "CHANGES_REQUESTED") => {
    const res = await fetch(`/api/prs/${prId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      fetchPRs();
      if (selectedPR) {
        const detailRes = await fetch(`/api/prs/${prId}`);
        const detailData = await detailRes.json();
        if (detailData.pr) setSelectedPR(detailData.pr);
      }
    } else {
      alert("Only users with Reviewer/Approver or Org Admin role can approve PRs");
    }
  };

  // Connection Handlers
  const handleRequestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toOrgSlug: targetOrgSlug }),
    });
    const data = await res.json();
    if (res.ok) {
      setTargetOrgSlug("");
      fetchConnections();
    } else {
      alert(data.error || "Connection request failed");
    }
  };

  const handleApproveConnection = async (connId: string) => {
    const res = await fetch(`/api/connections/${connId}/approve`, { method: "POST" });
    if (res.ok) fetchConnections();
  };

  const handleRevokeConnection = async (connId: string) => {
    const res = await fetch(`/api/connections/${connId}/revoke`, { method: "POST" });
    if (res.ok) fetchConnections();
  };

  const handleReconnect = async (targetSlug: string) => {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toOrgSlug: targetSlug }),
    });
    if (res.ok) {
      fetchConnections();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to re-connect");
    }
  };

  // Digest & CSV
  const handleGenerateDigest = async () => {
    const res = await fetch("/api/digest");
    const data = await res.json();
    if (data.digest) {
      setDigest(data.digest);
      setShowDigestModal(true);
    }
  };

  const handleExportCSV = async () => {
    try {
      const query = auditActionFilter !== "ALL" ? `?action=${auditActionFilter}&format=csv` : "?format=csv";
      const res = await fetch(`/api/audit${query}`);
      if (!res.ok) {
        alert("Failed to export audit CSV. Ensure you have ORG_ADMIN or REVIEWER role.");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_trail_${auditActionFilter.toLowerCase()}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export CSV error:", err);
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-muted">Loading Workspace...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Unauthenticated Welcome & Sign-In / Account Creation (Sign-Up)
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 relative">
        <div className="max-w-5xl w-full space-y-8">
          {/* Header & Theme Toggle */}
          <div className="flex justify-between items-center">
            <div className="inline-flex items-center space-x-2 badge-indigo px-3.5 py-1 rounded-full text-xs font-semibold">
              <span>🛡️ Multi-Tenant Enterprise Workspace</span>
            </div>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn-secondary px-3.5 py-1.5 text-xs font-medium"
            >
              {theme === "dark" ? "☀️ Light Theme" : "🌙 Dark Theme"}
            </button>
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold text-main tracking-tight">
              Froncort Unified Org Workspace
            </h1>
            <p className="text-sm text-muted max-w-2xl mx-auto">
              Integrated <b>Support Hub (Ticketing)</b> & <b>Review Console (PR Workflow)</b> with shared identity, query-layer BOLA isolation, and audit logging.
            </p>
          </div>

          {/* Quick Demo Persona Selector Grid */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider text-center">
              One-Click Quick Test Personas
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={() => executeLogin("admin@acme.test", "Passw0rd!")}
                className="theme-card p-5 text-left hover:border-indigo-500 transition group flex flex-col justify-between h-44"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold badge-indigo px-2 py-0.5 rounded">
                    Org Admin
                  </span>
                  <h3 className="font-bold text-main text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Ana Admin</h3>
                  <p className="text-xs text-muted">Acme Corp</p>
                </div>
                <p className="text-[11px] text-muted">Full control across tickets, PRs, members, & connections.</p>
              </button>

              <button
                onClick={() => executeLogin("agent@acme.test", "Passw0rd!")}
                className="theme-card p-5 text-left hover:border-blue-500 transition group flex flex-col justify-between h-44"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold badge-blue px-2 py-0.5 rounded">
                    Support Agent
                  </span>
                  <h3 className="font-bold text-main text-base group-hover:text-blue-600 dark:group-hover:text-blue-400">Sam Agent</h3>
                  <p className="text-xs text-muted">Acme Corp</p>
                </div>
                <p className="text-[11px] text-muted">Manages support tickets & customer issues.</p>
              </button>

              <button
                onClick={() => executeLogin("reviewer@acme.test", "Passw0rd!")}
                className="theme-card p-5 text-left hover:border-pink-500 transition group flex flex-col justify-between h-44"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold badge-purple px-2 py-0.5 rounded">
                    Reviewer
                  </span>
                  <h3 className="font-bold text-main text-base group-hover:text-purple-600 dark:group-hover:text-purple-400">Rae Reviewer</h3>
                  <p className="text-xs text-muted">Acme Corp</p>
                </div>
                <p className="text-[11px] text-muted">Approves PRs & accesses unified audit viewer.</p>
              </button>

              <button
                onClick={() => executeLogin("guest@globex.test", "Passw0rd!")}
                className="theme-card p-5 text-left hover:border-emerald-500 transition group flex flex-col justify-between h-44"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold badge-emerald px-2 py-0.5 rounded">
                    Cross-Org Guest
                  </span>
                  <h3 className="font-bold text-main text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Gil Guest</h3>
                  <p className="text-xs text-muted">Globex Inc</p>
                </div>
                <p className="text-[11px] text-muted">Restricted access to explicitly shared tickets/PRs only.</p>
              </button>

              <button
                onClick={() => executeLogin("super@platform.test", "Passw0rd!")}
                className="theme-card p-5 text-left hover:border-amber-500 transition group flex flex-col justify-between h-44"
              >
                <div className="space-y-1">
                  <span className="text-xs font-bold badge-amber px-2 py-0.5 rounded">
                    Platform Admin
                  </span>
                  <h3 className="font-bold text-main text-base group-hover:text-amber-600 dark:group-hover:text-amber-400">Pat SuperAdmin</h3>
                  <p className="text-xs text-muted">Platform Scope</p>
                </div>
                <p className="text-[11px] text-muted">Manages global platform orgs & partner connections.</p>
              </button>
            </div>
          </div>

          {/* Interactive Login / Register Auth Card */}
          <div className="theme-card p-6 max-w-md mx-auto space-y-4">
            {/* Tab Selector */}
            <div className="flex border-b border-subtle">
              <button
                onClick={() => { setAuthMode("login"); setAuthError(""); }}
                className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                  authMode === "login"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-muted hover:text-main"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode("register"); setAuthError(""); }}
                className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
                  authMode === "register"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-muted hover:text-main"
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>

            {authError && <div className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded text-center font-medium">{authError}</div>}

            {authMode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-2.5 text-xs font-bold">
                  Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Your Custom Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs"
                    placeholder="Enter work email"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Set Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs"
                    placeholder="Create a strong password (min 8 chars)"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Organization Name</label>
                  <input
                    type="text"
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs"
                    placeholder="Enter company or org name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-semibold block mb-1">Role Assignment</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full theme-input rounded-lg px-3 py-2 text-xs cursor-pointer font-semibold"
                  >
                    <option value="ORG_ADMIN">Org Admin (Full Access)</option>
                    <option value="SUPPORT_AGENT">Support Agent</option>
                    <option value="REVIEWER_APPROVER">Reviewer / Approver</option>
                    <option value="CROSS_ORG_GUEST">Cross-Org Guest</option>
                    <option value="PLATFORM_SUPER_ADMIN">Platform Super Admin</option>
                  </select>
                </div>

                <button type="submit" className="w-full btn-primary py-2.5 text-xs font-bold">
                  ✨ Create Account & Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Authenticated Main Workspace Layout
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 theme-sidebar flex flex-col justify-between hidden md:flex min-h-screen flex-shrink-0">
        <div className="space-y-6 p-6">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm shadow">
              F
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-main">FRONCORT</div>
              <div className="text-[10px] text-muted font-mono">Unified Org Workspace</div>
            </div>
          </div>

          {/* Active Tenant Selector Card */}
          <div className="theme-card p-3 space-y-1.5">
            <div className="text-[10px] text-muted uppercase font-bold">Active Tenant Scope</div>
            <select
              value={user.activeOrgId}
              onChange={(e) => handleSwitchOrg(e.target.value)}
              className="w-full theme-input text-xs font-semibold text-indigo-600 dark:text-indigo-400 rounded px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              {user.memberships.map((m: any) => (
                <option key={m.orgId} value={m.orgId}>
                  🏢 {m.orgName}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1 text-xs font-semibold">
            <div className="text-[10px] uppercase font-bold text-muted px-3 py-1">Dashboards</div>

            <button
              onClick={() => setActiveDashboard("support")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                activeDashboard === "support"
                  ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold"
                  : "text-muted hover:text-main hover:bg-slate-500/10"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span>📌</span>
                <span>Support Hub</span>
              </div>
              <span className="badge-indigo text-[10px] px-2 py-0.5 rounded">{tickets.length}</span>
            </button>

            <button
              onClick={() => setActiveDashboard("prs")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                activeDashboard === "prs"
                  ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold"
                  : "text-muted hover:text-main hover:bg-slate-500/10"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span>🔀</span>
                <span>Review Console</span>
              </div>
              <span className="badge-purple text-[10px] px-2 py-0.5 rounded">{prs.length}</span>
            </button>

            {["ORG_ADMIN", "REVIEWER_APPROVER", "PLATFORM_SUPER_ADMIN"].includes(user.role) && (
              <button
                onClick={() => setActiveDashboard("audit")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                  activeDashboard === "audit"
                    ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold"
                    : "text-muted hover:text-main hover:bg-slate-500/10"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span>🛡️</span>
                  <span>Audit Trail</span>
                </div>
              </button>
            )}

            <button
              onClick={() => setActiveDashboard("connections")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                activeDashboard === "connections"
                  ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold"
                  : "text-muted hover:text-main hover:bg-slate-500/10"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span>🌐</span>
                <span>Partner Network</span>
              </div>
            </button>
          </nav>
        </div>

        {/* User Account & Revocation Controls */}
        <div className="p-6 border-t border-subtle space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-main truncate">{user.name}</div>
              <div className="text-[10px] text-muted font-mono truncate">{user.role}</div>
            </div>
          </div>

          <div className="flex space-x-2 pt-1">
            <button
              onClick={handleLogoutEverywhere}
              title="Invalidates session tokens across all devices"
              className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] py-1.5 rounded font-semibold transition"
            >
              Logout Everywhere
            </button>
            <button
              onClick={handleLogout}
              className="btn-secondary px-3 py-1.5 text-[11px]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="theme-header px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold text-main">
              {activeDashboard === "support"
                ? "Dashboard 1 — Support Hub"
                : activeDashboard === "prs"
                ? "Dashboard 2 — Review & Audit Console"
                : activeDashboard === "audit"
                ? "Unified Audit Trail Viewer"
                : "Partner Network & Connections"}
            </h1>
            <span className="badge-emerald text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              🟢 Database: SQLite Active
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Demo Persona Switcher Dropdown in Header */}
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === "admin") executeLogin("admin@acme.test", "Passw0rd!");
                if (val === "agent") executeLogin("agent@acme.test", "Passw0rd!");
                if (val === "reviewer") executeLogin("reviewer@acme.test", "Passw0rd!");
                if (val === "guest") executeLogin("guest@globex.test", "Passw0rd!");
                if (val === "super") executeLogin("super@platform.test", "Passw0rd!");
              }}
              defaultValue=""
              className="btn-secondary px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <option value="" disabled>⚡ Switch Demo Persona</option>
              <option value="admin">👑 Ana Admin (Acme)</option>
              <option value="agent">🎧 Sam Agent (Acme)</option>
              <option value="reviewer">🔍 Rae Reviewer (Acme)</option>
              <option value="guest">🤝 Gil Guest (Globex)</option>
              <option value="super">🌐 Pat SuperAdmin</option>
            </select>

            {/* Light / Dark Theme Switcher */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center space-x-1.5"
            >
              <span>{theme === "dark" ? "☀️ Light Theme" : "🌙 Dark Theme"}</span>
            </button>

            <button
              onClick={handleGenerateDigest}
              className="btn-primary px-3.5 py-1.5 text-xs font-semibold flex items-center space-x-1.5"
            >
              <span>✨ AI Progress Digest</span>
            </button>
          </div>
        </header>

        {/* Constrained Workspace Container */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-8 space-y-6">
          {/* ----------------------------------------------------------------- */}
          {/* Dashboard 1: Support Hub (Tickets) */}
          {/* ----------------------------------------------------------------- */}
          {activeDashboard === "support" && (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">Total Scoped Tickets</div>
                  <div className="text-2xl font-extrabold text-main">{tickets.length}</div>
                </div>
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">Open Tickets</div>
                  <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                    {tickets.filter((t) => t.status === "OPEN").length}
                  </div>
                </div>
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">In Progress</div>
                  <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                    {tickets.filter((t) => t.status === "IN_PROGRESS").length}
                  </div>
                </div>
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">Cross-Org Shared</div>
                  <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                    {tickets.filter((t) => t.shares && t.shares.length > 0).length}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 theme-card p-4">
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search tickets by title or ID..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="theme-input rounded-lg px-3 py-1.5 text-xs w-64"
                  />
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value)}
                    className="theme-input rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {["ORG_ADMIN", "SUPPORT_AGENT"].includes(user.role) && (
                  <button
                    onClick={() => setShowCreateTicketModal(true)}
                    className="btn-primary px-4 py-2 text-xs font-bold"
                  >
                    + Create Ticket
                  </button>
                )}
              </div>

              {/* Tickets Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="theme-card p-5 flex flex-col justify-between space-y-4 h-56"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer focus:outline-none ${
                            t.status === "OPEN"
                              ? "badge-blue"
                              : t.status === "IN_PROGRESS"
                              ? "badge-amber"
                              : "badge-emerald"
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>

                        {t.shares && t.shares.length > 0 && (
                          <span className="badge-purple text-[10px] font-bold px-2 py-0.5 rounded-full">
                            🤝 Cross-Org Shared
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => setSelectedTicket(t)}
                        className="font-bold text-base text-main hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer line-clamp-1"
                      >
                        {t.title}
                      </h3>
                      <p
                        onClick={() => setSelectedTicket(t)}
                        className="text-xs text-muted line-clamp-2 leading-relaxed cursor-pointer"
                      >
                        {t.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-subtle flex items-center justify-between text-xs text-muted font-mono">
                      <span>ID: {t.id.substring(0, 10)}...</span>
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold font-sans text-xs"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}

                {filteredTickets.length === 0 && (
                  <div className="col-span-full p-12 text-center theme-card text-muted">
                    No tickets found for active tenant query layer.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Dashboard 2: Review Console (Pull Requests) */}
          {/* ----------------------------------------------------------------- */}
          {activeDashboard === "prs" && (
            <div className="space-y-6">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">Total Scoped PRs</div>
                  <div className="text-2xl font-extrabold text-main">{prs.length}</div>
                </div>
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">In Review</div>
                  <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
                    {prs.filter((p) => p.status === "IN_REVIEW").length}
                  </div>
                </div>
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">Approved PRs</div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {prs.filter((p) => p.status === "APPROVED").length}
                  </div>
                </div>
                <div className="theme-card p-5 space-y-1">
                  <div className="text-xs font-semibold text-muted">Version History</div>
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {prs.reduce((acc, p) => acc + (p.versions?.length || 0), 0)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center theme-card p-4">
                <div className="text-xs text-muted font-medium">
                  PR workflow supporting multiple reviewers and configurable N-approvals rule.
                </div>
                {["ORG_ADMIN", "REVIEWER_APPROVER"].includes(user.role) && (
                  <button
                    onClick={() => setShowCreatePRModal(true)}
                    className="btn-primary px-4 py-2 text-xs font-bold"
                  >
                    + Create Pull Request
                  </button>
                )}
              </div>

              {/* PR Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prs.map((pr) => {
                  const approvedCount = pr.reviewers?.filter((r: any) => r.decision === "APPROVED").length || 0;
                  return (
                    <div key={pr.id} className="theme-card p-6 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              pr.status === "APPROVED"
                                ? "badge-emerald"
                                : pr.status === "IN_REVIEW"
                                ? "badge-purple"
                                : "badge-amber"
                            }`}
                          >
                            {pr.status}
                          </span>

                          <span className="badge-purple font-mono font-bold text-xs px-2 py-0.5 rounded">
                            Approvals: {approvedCount} / {pr.requiredApprovals}
                          </span>
                        </div>

                        <h3 className="font-bold text-lg text-main">{pr.title}</h3>
                        <p className="text-xs text-muted leading-relaxed">{pr.description}</p>

                        <div className="theme-card p-3.5 text-xs space-y-1.5">
                          <div className="flex justify-between text-muted">
                            <span>Author: <b className="text-main">{pr.author?.name}</b></span>
                            <span className="font-mono text-[10px]">{new Date(pr.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-muted pt-1">
                            <span>Snapshots: <b className="text-indigo-600 dark:text-indigo-400">{pr.versions?.length || 0} version(s)</b></span>
                            <button
                              onClick={() => setSelectedPR(pr)}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-xs"
                            >
                              Inspect Snapshot Diff →
                            </button>
                          </div>
                        </div>
                      </div>

                      {["REVIEWER_APPROVER", "ORG_ADMIN"].includes(user.role) && pr.status === "IN_REVIEW" && (
                        <div className="flex space-x-3 pt-3 border-t border-subtle">
                          <button
                            onClick={() => handleReviewPR(pr.id, "APPROVED")}
                            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs py-2 rounded-lg font-semibold transition"
                          >
                            ✓ Approve PR
                          </button>
                          <button
                            onClick={() => handleReviewPR(pr.id, "CHANGES_REQUESTED")}
                            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs py-2 rounded-lg font-semibold transition"
                          >
                            ✗ Request Changes
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {prs.length === 0 && (
                  <div className="col-span-full p-12 text-center theme-card text-muted">
                    No PRs found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Dashboard 3: Unified Audit Viewer */}
          {/* ----------------------------------------------------------------- */}
          {activeDashboard === "audit" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center theme-card p-4">
                <div className="text-xs text-muted font-medium">
                  Append-only immutable audit trail recorded for every mutation action.
                </div>

                <div className="flex items-center space-x-3">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="theme-input rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <option value="ALL">All Actions ({auditLogs.length})</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="STATUS_CHANGE">STATUS_CHANGE</option>
                    <option value="SHARE">SHARE</option>
                    <option value="APPROVE">APPROVE</option>
                    <option value="DIGEST_GENERATED">DIGEST_GENERATED</option>
                    <option value="LOGOUT_EVERYWHERE">LOGOUT_EVERYWHERE</option>
                    <option value="USER_REGISTERED">USER_REGISTERED</option>
                  </select>

                  <button
                    onClick={handleExportCSV}
                    className="btn-secondary px-3.5 py-1.5 text-xs font-semibold flex items-center space-x-1.5"
                  >
                    <span>📥 Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="theme-card rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-subtle text-muted font-semibold uppercase text-[10px]">
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">Entity Type</th>
                        <th className="p-3.5">Entity ID</th>
                        <th className="p-3.5">Actor</th>
                        <th className="p-3.5">Provenance (sourceRefs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-500/5 transition">
                          <td className="p-3.5 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="p-3.5 font-sans">
                            <span className="badge-purple font-bold px-2 py-0.5 rounded text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3.5 text-main font-sans font-semibold">{log.entityType}</td>
                          <td className="p-3.5 text-muted">{log.entityId.substring(0, 14)}...</td>
                          <td className="p-3.5 text-main font-sans">{log.actor ? log.actor.email : "SYSTEM"}</td>
                          <td className="p-3.5 text-muted text-[10px]">
                            {log.sourceRefs?.length > 0 ? (
                              <span className="badge-indigo font-bold px-2 py-0.5 rounded">
                                {log.sourceRefs.length} ref(s)
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* Dashboard 4: Partner Connections */}
          {/* ----------------------------------------------------------------- */}
          {activeDashboard === "connections" && (
            <div className="space-y-6">
              <div className="theme-card p-5 space-y-3">
                <form onSubmit={handleRequestConnection} className="flex space-x-3 items-center max-w-xl">
                  <input
                    type="text"
                    placeholder="Partner Organization Slug (e.g. globex or acme)"
                    value={targetOrgSlug}
                    onChange={(e) => setTargetOrgSlug(e.target.value)}
                    className="theme-input text-xs rounded-lg px-3 py-2 flex-1"
                    required
                  />
                  <button type="submit" className="btn-primary px-4 py-2 text-xs font-bold">
                    Request Connection
                  </button>
                </form>

                <div className="flex items-center space-x-2 text-xs text-muted">
                  <span>Quick Partner Slugs:</span>
                  <button
                    onClick={() => setTargetOrgSlug("globex")}
                    className="badge-indigo px-2 py-0.5 rounded font-mono cursor-pointer hover:underline"
                  >
                    globex
                  </button>
                  <button
                    onClick={() => setTargetOrgSlug("acme")}
                    className="badge-purple px-2 py-0.5 rounded font-mono cursor-pointer hover:underline"
                  >
                    acme
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {connections.map((conn) => (
                  <div key={conn.id} className="theme-card p-5 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-main">
                        🏢 {conn.fromOrg.name} ↔ {conn.toOrg.name}
                      </div>
                      <div className="text-xs text-muted">
                        Status:{" "}
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            conn.status === "APPROVED"
                              ? "badge-emerald"
                              : conn.status === "PENDING"
                              ? "badge-amber"
                              : "badge-rose"
                          }`}
                        >
                          {conn.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-x-2">
                      {conn.status === "PENDING" && (
                        <button
                          onClick={() => handleApproveConnection(conn.id)}
                          className="btn-primary text-xs px-3 py-1.5 font-bold"
                        >
                          Approve
                        </button>
                      )}
                      {conn.status === "REVOKED" && (
                        <button
                          onClick={() => {
                            const partnerSlug = conn.fromOrgId === user.activeOrgId ? conn.toOrg.slug : conn.fromOrg.slug;
                            handleReconnect(partnerSlug);
                          }}
                          className="btn-primary text-xs px-3 py-1.5 font-bold"
                        >
                          🔄 Re-connect
                        </button>
                      )}
                      {conn.status !== "REVOKED" && (
                        <button
                          onClick={() => handleRevokeConnection(conn.id)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------------- */}
      {/* Ticket Details & Share Modal */}
      {/* ------------------------------------------------------------------- */}
      {selectedTicket && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="modal-content p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-indigo-500">Ticket View</span>
                <h3 className="text-lg font-bold text-main">{selectedTicket.title}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-muted hover:text-main font-bold">
                ✕
              </button>
            </div>

            <div className="theme-card p-4 text-xs text-main leading-relaxed">
              {selectedTicket.description}
            </div>

            {["ORG_ADMIN"].includes(user.role) && (
              <div className="theme-card p-4 space-y-2">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">🤝 Share Item Cross-Org</div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Target Partner Org ID"
                    value={shareOrgId}
                    onChange={(e) => setShareOrgId(e.target.value)}
                    className="theme-input text-xs rounded px-3 py-1.5 flex-1"
                  />
                  <button
                    onClick={() => handleShareTicket(selectedTicket.id)}
                    className="btn-primary px-4 py-1.5 text-xs font-bold"
                  >
                    Share
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-main uppercase">Comments Thread</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedTicket.comments?.map((c: any) => (
                  <div key={c.id} className="theme-card p-3 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.author?.name} ({c.author?.email})</span>
                      <span className="text-muted font-mono text-[10px]">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-main">{c.body}</p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="theme-input text-xs rounded px-3 py-2 flex-1"
                />
                <button
                  onClick={() => handleAddComment(selectedTicket.id)}
                  className="btn-primary px-4 py-2 text-xs font-bold"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Create Ticket Modal */}
      {/* ------------------------------------------------------------------- */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="modal-content p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-main">Create Support Ticket</h3>
              <button onClick={() => setShowCreateTicketModal(false)} className="text-muted font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold block mb-1">Title</label>
                <input
                  type="text"
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  className="w-full theme-input text-xs rounded-lg p-2.5"
                  placeholder="Summarize the issue..."
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted font-semibold block mb-1">Description</label>
                <textarea
                  value={ticketDesc}
                  onChange={(e) => setTicketDesc(e.target.value)}
                  className="w-full theme-input text-xs rounded-lg p-2.5 h-28"
                  placeholder="Provide step-by-step details..."
                  required
                />
              </div>
              <button type="submit" className="w-full btn-primary py-2.5 text-xs font-bold">
                Submit Support Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* Create PR Modal */}
      {/* ------------------------------------------------------------------- */}
      {showCreatePRModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="modal-content p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-main">Create Pull Request</h3>
              <button onClick={() => setShowCreatePRModal(false)} className="text-muted font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePR} className="space-y-3">
              <div>
                <label className="text-xs text-muted font-semibold block mb-1">PR Title</label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  className="w-full theme-input text-xs rounded-lg p-2.5"
                  placeholder="Describe your code changes..."
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted font-semibold block mb-1">Description</label>
                <textarea
                  value={prDesc}
                  onChange={(e) => setPrDesc(e.target.value)}
                  className="w-full theme-input text-xs rounded-lg p-2.5 h-24"
                  placeholder="Detail architectural modifications..."
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted font-semibold block mb-1">Required Approvals Threshold</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={prApprovals}
                  onChange={(e) => setPrApprovals(Number(e.target.value))}
                  className="w-full theme-input text-xs rounded-lg p-2"
                  required
                />
              </div>
              <button type="submit" className="w-full btn-primary py-2.5 text-xs font-bold">
                Create Pull Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PR Diff History Modal */}
      {/* ------------------------------------------------------------------- */}
      {selectedPR && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="modal-content p-6 max-w-xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-indigo-500">Snapshot Diff History</span>
                <h3 className="text-lg font-bold text-main">{selectedPR.title}</h3>
              </div>
              <button onClick={() => setSelectedPR(null)} className="text-muted font-bold">
                ✕
              </button>
            </div>

            <div className="theme-card p-4 space-y-2">
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Current Version:</div>
              <div className="text-xs font-mono">{selectedPR.description}</div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-main uppercase">Version History ({selectedPR.versions?.length || 0})</h4>
              {selectedPR.versions?.map((ver: any) => (
                <div key={ver.id} className="theme-card p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400">
                    <span>Version #{ver.versionNum}</span>
                    <span className="text-muted">{new Date(ver.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-main">{ver.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* AI Digest Modal */}
      {/* ------------------------------------------------------------------- */}
      {showDigestModal && digest && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="modal-content p-6 max-w-lg w-full space-y-4 border border-indigo-500/40">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Personalized AI Progress Digest</h3>
              <button onClick={() => setShowDigestModal(false)} className="text-muted font-bold">
                ✕
              </button>
            </div>

            <pre className="theme-card p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {digest.summaryText}
            </pre>

            <div className="theme-card p-3 space-y-1 text-xs">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">Audit Provenance (sourceRefs):</span>
              <div className="font-mono text-[10px] text-muted break-all">
                {digest.sourceRefs?.length > 0 ? digest.sourceRefs.join(", ") : "None"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
