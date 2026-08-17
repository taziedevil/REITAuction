# 2026 REIT Mental Health Charity Golf Day Auction

A simple one-item live auction page.

## What it does

- Shows the current highest bid.
- Collects bidder name, email address and bid amount.
- Enforces a starting bid and minimum increment.
- Handles simultaneous bids safely in the database.
- Automatically stops bidding at the configured closing time.
- Keeps bidder names and emails hidden from the public.
- Includes a private admin page with full bid history and CSV export.
- No payment processing. REIT can invoice/contact the winner separately.

## Files

- `index.html` — public auction page
- `admin.html` — private administrator page
- `styles.css` — styling
- `config.js` — event/golfer/database settings
- `app.js` — public bidding logic
- `admin.js` — admin login and bid history
- `schema.sql` — Supabase database setup
- `golfer-placeholder.svg` — replace with a golfer photo if desired

## 1. Create a free Supabase project

Go to Supabase and create a project.

In Supabase, open **SQL Editor**, paste the contents of `schema.sql`, and run it.

IMPORTANT:
`schema.sql` currently uses:
- Starting bid: $100
- Minimum increment: $50
- Closing time: 16 October 2026 at 5:00pm Tasmania time

If you change these in `config.js`, change the matching values inside
`place_auction_bid()` in `schema.sql` too. The database values are the final authority.

## 2. Add your Supabase details

In Supabase:
Project Settings > API

Copy:
- Project URL
- anon / public API key

Open `config.js` and replace:

```js
supabaseUrl: "https://YOUR-PROJECT.supabase.co",
supabaseAnonKey: "YOUR-SUPABASE-ANON-KEY",
```

The anon key is designed to be used in a public browser app. Do NOT put your
Supabase service-role key in these files.

## 3. Add the golfer details

Edit `config.js`:

```js
golferName: "Golfer Name",
golferDescription: "Short description...",
golferPhoto: "golfer.jpg",
```

Put the image in the same folder as the website.

## 4. Create an admin login

In Supabase:

Authentication > Users > Add user

Create an email/password account for the REIT person who should see bid details.

The public site cannot read bidder names or email addresses.
Authenticated users can see the admin table.

For a larger or long-term system, you would normally add a specific admin-role
claim rather than allowing every authenticated user. For this small event site,
only create authentication accounts for auction administrators.

## 5. Test locally

Because the page uses Supabase, serve the folder through a small local web server
rather than opening `index.html` by double-clicking it.

Examples:
- VS Code Live Server
- `python -m http.server 8000`

Then open:
- Public page: `http://localhost:8000`
- Admin page: `http://localhost:8000/admin.html`

## 6. Put it online

Any static website host will work, including:
- Netlify
- Cloudflare Pages
- GitHub Pages
- Your existing REIT web hosting

Upload all of the files in this folder.

## Privacy notes

The database stores bidder names and email addresses because REIT needs them to
identify/contact the winning bidder. Consider adding a link to your privacy
statement if the auction is public-facing.

The public database view exposes only the highest bid amount.

## Before launch checklist

1. Replace the golfer name, description and image.
2. Confirm the closing date/time.
3. Confirm the starting bid and minimum increment in BOTH `config.js` and `schema.sql`.
4. Add the Supabase URL and anon key.
5. Create the admin account.
6. Submit several test bids.
7. Test an invalid lower bid.
8. Test the admin sign-in and CSV export.
9. Delete all test bid rows before launch.
10. Test on a phone.
