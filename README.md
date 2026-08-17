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

## 7. Outbid email notifications with Resend

This package now includes a Supabase Edge Function at:

`supabase/functions/send-outbid-email/index.ts`

It emails the previous highest bidder after a new bid is inserted. It does **not** email someone who outbids themselves using the same email address.

### A. Set up Resend

1. Create a Resend account.
2. Add and verify the domain/address you want REIT to send from.
3. Create a Resend API key.

### B. Deploy the Edge Function

Install/login to the Supabase CLI, link this project, then deploy:

```bash
supabase functions deploy send-outbid-email --no-verify-jwt
```

The function is intended to be called by a Supabase Database Webhook, not directly by auction visitors.

### C. Add Edge Function secrets

In Supabase Dashboard > Edge Functions > Secrets, add:

- `RESEND_API_KEY` = your Resend API key
- `AUCTION_FROM_EMAIL` = e.g. `REIT Golf Day <golfday@your-verified-domain.com>`
- `AUCTION_URL` = the full public URL of the auction page

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available to hosted Supabase Edge Functions automatically. Never put the service-role key or Resend API key in `config.js`.

### D. Create the Database Webhook

In Supabase Dashboard:

1. Go to **Database > Webhooks**.
2. Create a new webhook.
3. Name: `send-outbid-email`.
4. Table: `public.auction_bids`.
5. Event: **INSERT** only.
6. Type: **Supabase Edge Functions**.
7. Function: `send-outbid-email`.
8. Save it.

Now every accepted bid insert will trigger the function. The function finds the previous highest bidder and sends the outbid email through Resend.

### E. Important if you change the bid increment

The email function currently assumes the same **$50 minimum increment** used by this auction. If you change the increment, update this line in `supabase/functions/send-outbid-email/index.ts`:

```ts
const minimumNext = currentBid + 50;
```

### F. Test before launch

1. Use bidder A/email A to place the first bid. No outbid email should be sent.
2. Use bidder B/email B to place a higher bid. Bidder A should receive the email.
3. Bid again using bidder B/email B. Bidder B should **not** receive an outbid email for outbidding themselves.
4. Check **Edge Functions > Logs** in Supabase if an email does not arrive.
5. Check Resend's email logs for delivery status.
