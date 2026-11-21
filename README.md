# RentiGoo Instagram growth system

A free system for growing [@rentigoo](https://instagram.com/rentigoo) in Bhopal:

- **`content/calendar.yaml`**: 30 days of posts (23 Nov to 22 Dec 2026). 5 a week: 2 reels, 2 carousels and 1 local post, at 7-9 pm IST, with Hinglish captions and hashtags.
- **Designs**: `npm run generate` turns the calendar into 1080x1350 brand PNGs and 1080x1920 reel covers in `output/`, shot lists in `reels/`, and **`output/previews.html`** to review everything.
- **Auto-publisher**: `scripts/publish.mjs` posts what's due through the **official Instagram Graph API**. GitHub Actions runs it every evening.
- **Weekly report**: `scripts/report.mjs` reads your own insights every Monday and writes `reports/<week>.md`.
- **Manual growth**: `growth/` holds the daily routine, DM templates and giveaway rules. You do these yourself.

**What it never does:** follow, like, comment, DM, or read other accounts. It only publishes to your own account and reads your own insights, through Meta's official API. Everything else is by hand.

**Cost: ₹0.** GitHub (public repo, Actions, Pages), the Meta developer app and the Graph API are free. Nothing paid is used.

---

## How it fits together

```
content/calendar.yaml ──npm run generate──▶ output/<id>/*.png, reels/<id>.md, output/previews.html
        │                                        │ git push
        │                                        ▼
        │                          GitHub Pages: https://<you>.github.io/rentigoo-instagram/output/...
        ▼                                        │ (Instagram fetches the images from here)
GitHub Actions (7-9:30 pm IST) ──▶ scripts/publish.mjs ──Graph API──▶ Instagram
                                         │
                                         └─▶ state/published.json + logs/publish.log (committed back)
```

---

## One-time setup

You need: your Instagram **Business** account connected to a **Facebook Page** (done), a free GitHub account, Node 22+ and Google Chrome on your computer.

### 1. Put this folder on GitHub (public)

GitHub Pages is free only for **public** repos. Everything in here is safe to be public: the calendar, captions and images, never the token.

```bash
cd ~/Desktop/rentigoo-instagram
git add -A && git commit -m "RentiGoo Instagram system"
gh repo create rentigoo-instagram --public --source . --push
```

### 2. Create the Meta developer app

1. Go to <https://developers.facebook.com/apps> → **Create app**.
2. Name it "RentiGoo Publisher". For the use case, pick the one for managing a Page or Instagram (if asked, choose app type **Business**).
3. In the app, add the **Instagram** product and choose **API setup with Facebook login**.
4. Leave the app in **Development** mode. You're its admin and you own the Instagram account, so it works on your own account without App Review.

### 3. Get a token that doesn't expire

Do this on your own computer. Never paste a token into chat, a file in this repo, or a commit.

1. Open the **Graph API Explorer**: <https://developers.facebook.com/tools/explorer/>. Select your app, then **User Token**, and add these permissions:
   `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `business_management`.
   Click **Generate Access Token** and approve for your Page and Instagram account. This token lasts about an hour.
2. Swap it for a **long-lived user token** (60 days). Your App ID and App Secret are in the app's **Settings → Basic**:
   ```bash
   curl -s "https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN"
   ```
3. Use that to get your **Page token**. A Page token made from a long-lived user token **doesn't expire**:
   ```bash
   curl -s "https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=LONG_LIVED_USER_TOKEN"
   ```
   Copy the `access_token` and `id` of the RentiGoo Page.
4. Check it in the **Access Token Debugger** (<https://developers.facebook.com/tools/debug/accesstoken/>): **Expires: Never**.

It stops working if you change your Facebook password or remove the app's permissions. If it does, repeat this step. The publisher logs a clear error and publishes nothing in the meantime.

### 4. Find your Instagram user ID

```bash
curl -s "https://graph.facebook.com/v25.0/PAGE_ID?fields=instagram_business_account&access_token=PAGE_TOKEN"
```
The `instagram_business_account.id` (a long number starting `1784…`) is your **IG_USER_ID**.

### 5. Add the GitHub Secrets and Variables

In the repo on GitHub: **Settings → Secrets and variables → Actions**. Or from the terminal (it asks for the value, so it never lands in your shell history):

```bash
gh secret set IG_ACCESS_TOKEN     # paste the Page token
gh secret set IG_USER_ID          # paste the IG user ID
gh variable set PUBLIC_BASE_URL --body "https://<your-github-username>.github.io/rentigoo-instagram"
gh variable set PUBLISHING_ENABLED --body "false"   # stays false until you're ready (step 8)
```

Optional variables: `GRAPH_VERSION` (default `v25.0`) and `HASHTAG_LIMIT` (default `5`, see below).

For running on your computer, copy `.env.example` to `.env` and fill in the same values. `.env` is in `.gitignore`, so it's never committed.

### 6. Turn on GitHub Pages

**Settings → Pages →** Source: **Deploy from a branch**, Branch: **main**, folder **/ (root)** → Save.
After a minute, `https://<you>.github.io/rentigoo-instagram/output/previews.html` should open. That's also how Instagram fetches the images.

### 7. Check everything with a dry run

On your computer (with `.env` filled in):
```bash
npm install
npm run publish:dry                                            # what would go out right now
node scripts/publish.mjs --dry-run --now 2026-11-24T20:05+05:30  # pretend it's a post's time
```
With a token set, the dry run also checks the token, prints your @username and shows how much of Instagram's publishing quota is used. It publishes nothing.

On GitHub: **Actions → Publish due posts → Run workflow** with "Dry run" ticked. Read the log.

### 8. Go live

When the previews and the dry run look right:
```bash
gh variable set PUBLISHING_ENABLED --body "true"
```
From then on, the evening runs publish what's due. To publish one post by hand: **Actions → Publish due posts → Run workflow**, untick "Dry run", and enter its id.

---

## Day to day

### Adding or changing posts
1. Edit `content/calendar.yaml` (copy an existing post as a template). Each post needs a unique `id`, a `date` (YYYY-MM-DD), a `time` (HH:MM, IST), a `type` (`reel`, `carousel` or `single`), a `caption` and `hashtags`.
2. Slide text supports `**marker highlight**` and `{{TODO: …}}` placeholders. **A post with any TODO is never published.**
3. `npm run generate`, then open `output/previews.html` and check every slide.
4. `npm test` (checks the calendar), then commit and push **at least an hour before** the post time, so GitHub Pages has the images.

Slide kinds: `hook` (first slide), `step` (with an optional `number` for real sequences), `checklist`, `compare` (two cost boxes), `photo` (a real photo in `assets/`), `dark` (a bold dark slide), `cta` (the "save / share" end slide).

### Reels
1. Film from the shot list in `reels/<id>.md`. The cover is at `output/<id>/cover.png`.
2. Then either:
   - **Post it yourself in the app.** This is best when you want Instagram's trending audio, which the API can't add. Afterwards run `node scripts/publish.mjs --mark-manual <id>` (and push) so it's never posted again.
   - **Or let the publisher post it.** Export as `reels/ready/<id>.mp4` (MP4, H.264, AAC audio, vertical 9:16, **under 100 MB** for GitHub), commit and push it. It goes out at its time with the video's own sound.

### Dry run vs live, at a glance
| | Publishes? |
|---|---|
| `npm run publish:dry` / `--dry-run` | Never |
| GitHub schedule with `PUBLISHING_ENABLED` not `true` | Never (dry run) |
| GitHub "Run workflow" with "Dry run" ticked | Never |
| `npm run publish` on your computer | Yes, whatever is due |
| GitHub schedule with `PUBLISHING_ENABLED=true` | Yes, whatever is due |

### Safety built into the publisher
- **Never twice:** `state/published.json` records every post's progress, saved after each step. After an error, it checks whether Instagram already published the post before trying again. An interrupted run picks up its unfinished upload instead of starting a new post.
- **Safe retries:** only network errors, server errors and rate limits are retried, with growing waits. Publishing itself is never blindly repeated.
- **Limits:** it reads Instagram's live publishing quota (`content_publishing_limit`) before posting, and posts at most 2 per run (`--max`).
- **Late posts:** anything more than 36 hours late is reported as missed, not suddenly posted (`--late-hours`). Reschedule it, or run `--only <id> --force-time`.
- **Checks first:** it skips anything with a TODO, a missing image or video, or a public URL that doesn't load yet.
- **Logs:** `logs/publish.log` keeps one line per action. Tokens are blanked out of every log line.

### Hashtags
Each post has 8-12 hashtags, most important first. In December 2025 Instagram started limiting posts to **5 hashtags**, so only the first 5 are published by default. Reports conflict on whether that's enforced everywhere. To publish more, set the variable `HASHTAG_LIMIT` (e.g. `12`), but posts with too many may fail. `previews.html` shows exactly what will be published.

### Weekly report
Every Monday at 9 am IST, **Actions → Weekly growth report** writes `reports/<year>-W<week>.md` covering:
- followers gained, reach, profile visits, saves, shares and link taps;
- the top and bottom posts;
- what format and topic worked;
- the best posting times.

Run it any time: `npm run report`, or `node scripts/report.mjs --week-of 2026-11-23`. Instagram changes its metric names from time to time. Any it no longer returns are listed at the bottom of the report rather than breaking it.

### Growth by hand
- `growth/daily-checklist.md`: the 20-minute routine.
- `growth/outreach.md`: DM templates for partner shops, event and meme pages, wedding photographers and fest teams, plus the giveaway post and rules.
- `growth/accounts.csv`: your list of local accounts and where each conversation stands.

---

## Commands
| Command | What it does |
|---|---|
| `npm run generate` | Render all designs and previews (`--only <id>` for one post) |
| `npm test` | Check the calendar, and test the publisher and report against a fake API |
| `npm run publish:dry` | Show what's due, publish nothing |
| `npm run publish` | Publish what's due (live) |
| `node scripts/publish.mjs --mark-manual <id>` | You posted it in the app: never publish it here |
| `npm run report` | Write last week's report |

## Before each post goes out: your TODOs
- **3 Dec carousel (rent vs buy):** real new and resale prices for a camera like the Nikon.
- **6 Dec founder post:** your photo (put it in `assets/` and set `image:`) and your story in your own words.
- **13 Dec partner shop:** a real shop, with their OK on the photo and text.
- **20 Dec giveaway:** partner shop, prize, value and dates (rules in `growth/outreach.md`).
- **29 Nov item of the week:** check the Nikon listing is still live and the owner is happy to be featured.
- **Every reel:** film it, then drop it in `reels/ready/` or post it in the app and `--mark-manual` it.
