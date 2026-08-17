window.AUCTION_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-SUPABASE-ANON-KEY",

  golferName: "Your Golfer Name",
  golferDescription: "Add a short description here about the golfer, their background, and why bidders will want them on their team.",
  golferPhoto: "golfer-placeholder.svg",

  startingBid: 100,
  minimumIncrement: 50,

  // Use an ISO timestamp with Tasmania's timezone offset.
  // Example: "2026-10-16T17:00:00+11:00"
  auctionClosesAt: "2026-10-16T17:00:00+11:00",

  currency: "AUD"
};
