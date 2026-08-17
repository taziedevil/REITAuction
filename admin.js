(() => {
  const config = window.AUCTION_CONFIG || {};
  const $ = (id) => document.getElementById(id);

  const loginPanel = $("loginPanel");
  const adminPanel = $("adminPanel");
  const loginForm = $("loginForm");
  const msg = $("adminMessage");
  const rows = $("bidRows");
  let client;
  let latestData = [];

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: config.currency || "AUD",
    maximumFractionDigits: 0
  });

  function setMessage(text, type = "") {
    msg.textContent = text;
    msg.className = "form-message" + (type ? ` ${type}` : "");
  }

  function configured() {
    return config.supabaseUrl &&
      config.supabaseAnonKey &&
      !config.supabaseUrl.includes("YOUR-PROJECT") &&
      !config.supabaseAnonKey.includes("YOUR-SUPABASE");
  }

  function render(data) {
    latestData = data || [];
    rows.innerHTML = "";

    for (const bid of latestData) {
      const tr = document.createElement("tr");
      const date = new Date(bid.created_at);
      tr.innerHTML = `
        <td>${date.toLocaleString("en-AU", { timeZone: "Australia/Hobart" })}</td>
        <td>${escapeHtml(bid.bidder_name)}</td>
        <td>${escapeHtml(bid.bidder_email)}</td>
        <td><strong>${money.format(Number(bid.bid_amount))}</strong></td>
      `;
      rows.appendChild(tr);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadBids() {
    const { data, error } = await client
      .from("auction_bids")
      .select("created_at,bidder_name,bidder_email,bid_amount")
      .order("bid_amount", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Could not load bids. Check the admin account and database policies.", "error");
      return;
    }

    render(data);
  }

  function downloadCsv() {
    const header = ["Time", "Name", "Email", "Bid"];
    const lines = [header.join(",")];

    for (const bid of latestData) {
      const line = [
        new Date(bid.created_at).toISOString(),
        bid.bidder_name,
        bid.bidder_email,
        bid.bid_amount
      ].map(v => `"${String(v ?? "").replaceAll('"', '""')}"`);
      lines.push(line.join(","));
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reit-auction-bids.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function updateView() {
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      loginPanel.hidden = true;
      adminPanel.hidden = false;
      setMessage("");
      await loadBids();
    } else {
      loginPanel.hidden = false;
      adminPanel.hidden = true;
    }
  }

  if (!configured() || !window.supabase) {
    setMessage("Add your Supabase project details in config.js first.", "error");
    return;
  }

  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("Signing in…");

    const { error } = await client.auth.signInWithPassword({
      email: $("adminEmail").value.trim(),
      password: $("adminPassword").value
    });

    if (error) {
      setMessage("Sign-in failed. Check your email and password.", "error");
      return;
    }

    await updateView();
  });

  $("refreshBtn").addEventListener("click", loadBids);
  $("exportBtn").addEventListener("click", downloadCsv);
  $("signOutBtn").addEventListener("click", async () => {
    await client.auth.signOut();
    await updateView();
  });

  updateView();
})();
