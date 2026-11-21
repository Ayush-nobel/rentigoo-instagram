# Reel: Renting in Bhopal, in 20 seconds.

**Post:** Friday, 4 December at 8:30 pm IST · **Length:** about 20 seconds · **Cover:** `output/2026-12-04-reel-how-it-works-20s/cover.png`

## Hook (first 2 seconds)
> Renting in Bhopal, in 20 seconds.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | Phone in hand, rentigoo.in home page loading. Text from frame 1. | Renting in Bhopal, in 20 seconds ⏱️ |
| 2 | 4 | Screen recording: search, pick dates on a listing. | 1. Find it, pick dates |
| 3 | 4 | Screen recording: tap Request to book. | 2. Request: free |
| 4 | 5 | Hands: photographing an item on a table from 2-3 angles. | 3. Pickup: ID + photos, pay the owner |
| 5 | 5 | Hands handing the item back; phone shows a UPI 'received' screen (blur amount and names). | 4. Return: deposit back in 24 hrs |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
A trending fast 'tutorial'/tick-tock sound that fits 20 seconds of quick cuts.

## Caption
```
Rent karna itna easy hai 👇

Dhoondho → request bhejo (free) → pickup pe ID + photos → owner ko rent + deposit → wapas karo, deposit 24 ghante mein wapas.

Abhi booking fee bhi nahi hai. Try karo: rentigoo.in
Sawaal? WhatsApp +91 93014 22919

🔁 Share karo us dost ko jo har cheez kharid leta hai!

#RentInBhopal #Bhopal #HowItWorks #BhopalStartup #RentDontBuy
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #MPNagar #BhopalStudents #LifeHacks #SharingEconomy

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-12-04-reel-how-it-works-20s`.
- **Through the API:** export the finished video as `reels/ready/2026-12-04-reel-how-it-works-20s.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
