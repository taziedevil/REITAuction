(() => {
  const config = window.AUCTION_CONFIG || {};
  const el = (id) => document.getElementById(id);

  const currentBidEl = el("currentBid");
  const nextBidTextEl = el("nextBidText");
  const form = el("bidForm");
  const nameEl = el("bidderName");
  const emailEl = el("bidderEmail");
  const amountEl = el("bidAmount");
  const submitEl = el("submitBid");
  const msgEl = el("formMessage");
  const closeTimeTextEl = el("closeTimeText");
  const statusPillEl = el("statusPill");

  let supabaseClient = null;
  let highestBid = 0;

  const money = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: config.currency || "AUD",
    maximumFractionDigits: 0
  });

  function showMessage(message, type = "") {
    msgEl.textContent = message;
    msgEl.className = "form-message" + (type ? ` ${type}` : "");
  }

  function isConfigured() {
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      !config.supabaseUrl.includes("YOUR-PROJECT") &&
      !config.supabaseAnonKey.includes("YOUR-SUPABASE")
    );
  }

  function isClosed() {
    const close = new Date(config.auctionClosesAt);
    return Number.isFinite(close.getTime()) && Date.now() >= close.getTime();
  }

  function updateClosedState() {
    if (isClosed()) {
      statusPillEl.textContent = "Auction closed";
      statusPillEl.style.background = "#f0f1f0";
      statusPillEl.style.color = "#505854";
      submitEl.disabled = true;
      amountEl.disabled = true;
      nameEl.disabled = true;
      emailEl.disabled = true;
      nextBidTextEl.textContent = "Bidding has closed";
    } else {
      statusPillEl.textContent = "Auction open";
    }
  }

  function minNextBid() {
    if (highestBid > 0) return highestBid + Number(config.minimumIncrement || 0);
    return Number(config.startingBid || 0);
  }

  function renderBid() {
    currentBidEl.textContent = money.format(highestBid || 0);
    const minimum = minNextBid();
    if (!isClosed()) {
      nextBidTextEl.textContent = `Minimum next bid: ${money.format(minimum)}`;
      amountEl.min = String(minimum);
      if (!amountEl.value || Number(amountEl.value) < minimum) {
        amountEl.value = minimum;
      }
    }
  }

  function applyConfig() {
    el("golferName").textContent = config.golferName || "Featured Golfer";
    el("golferDescription").textContent = config.golferDescription || "";
    el("golferPhoto").src = config.golferPhoto || "golfer-placeholder.svg";

    const close = new Date(config.auctionClosesAt);
    closeTimeTextEl.textContent = Number.isFinite(close.getTime())
      ? new Intl.DateTimeFormat("en-AU", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Australia/Hobart"
        }).format(close)
      : "To be confirmed";
  }

  async function fetchHighestBid() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
      .from("auction_public_status")
      .select("highest_bid")
      .single();

    if (error) {
      console.error(error);
      showMessage("Could not refresh the current bid. Please try again.", "error");
      return;
    }

    highestBid = Number(data?.highest_bid || 0);
    renderBid();
  }

  async function placeBid(event) {
    event.preventDefault();
    showMessage("");

    if (isClosed()) {
      updateClosedState();
      showMessage("This auction has closed.", "error");
      return;
    }

    if (!isConfigured() || !supabaseClient) {
      showMessage("Auction database is not configured yet. See README.md.", "error");
      return;
    }

    const bidderName = nameEl.value.trim();
    const bidderEmail = emailEl.value.trim();
    const bidAmount = Number(amountEl.value);

    if (!bidderName) {
      showMessage("Please enter your name.", "error");
      nameEl.focus();
      return;
    }

    if (!emailEl.validity.valid) {
      showMessage("Please enter a valid email address.", "error");
      emailEl.focus();
      return;
    }

    await fetchHighestBid();
    const required = minNextBid();

    if (!Number.isFinite(bidAmount) || bidAmount < required) {
      showMessage(`Your bid must be at least ${money.format(required)}.`, "error");
      amountEl.value = required;
      amountEl.focus();
      return;
    }

    submitEl.disabled = true;
    submitEl.textContent = "Placing bid…";

    try {
      const { data, error } = await supabaseClient.rpc("place_auction_bid", {
        p_bidder_name: bidderName,
        p_bidder_email: bidderEmail,
        p_bid_amount: bidAmount
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result?.accepted) {
        await fetchHighestBid();
        const minimum = Number(result?.minimum_next_bid || minNextBid());
        showMessage(
          result?.message || `That bid was not accepted. Minimum next bid is ${money.format(minimum)}.`,
          "error"
        );
        amountEl.value = minimum;
        return;
      }

      highestBid = Number(result.highest_bid || bidAmount);
      renderBid();
      showMessage(`Bid accepted. You are currently the highest bidder at ${money.format(highestBid)}.`, "success");
      amountEl.value = minNextBid();
    } catch (err) {
      console.error(err);
      showMessage("Something went wrong while placing your bid. Please try again.", "error");
    } finally {
      submitEl.disabled = isClosed();
      submitEl.textContent = "Place bid";
    }
  }

  function subscribeToBidUpdates() {
    if (!supabaseClient) return;

    supabaseClient
      .channel("auction-bid-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auction_bids" },
        () => fetchHighestBid()
      )
      .subscribe();
  }

  applyConfig();
  updateClosedState();
  renderBid();
  form.addEventListener("submit", placeBid);

  if (isConfigured() && window.supabase) {
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    fetchHighestBid();
    subscribeToBidUpdates();

    // Realtime delivery is subject to database visibility rules. Polling keeps
    // the public amount current without granting public access to bidder details.
    setInterval(fetchHighestBid, 10000);
  } else {
    showMessage("Demo mode: add your Supabase details in config.js to accept live bids.");
  }

  setInterval(updateClosedState, 15000);
})();
