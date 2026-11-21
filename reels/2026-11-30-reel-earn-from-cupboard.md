# Reel: That camera in your almirah could be paying for itself.

**Post:** Monday, 30 November at 7:30 pm IST · **Length:** about 16 seconds · **Cover:** `output/2026-11-30-reel-earn-from-cupboard/cover.png`

## Hook (first 2 seconds)
> That camera in your almirah could be paying for itself.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | Open an almirah/cupboard door: a camera, speaker or drill on the shelf. Text from frame 1. | Your almirah is full of money 👀 |
| 2 | 3 | Pick the item up, blow dust off it (fun, quick). | Used it once. Since then: nothing. |
| 3 | 4 | Phone: take 2-3 photos of the item by a window (daylight). | List it on RentiGoo: free |
| 4 | 4 | Screen recording: rentigoo.in/list, the steps (photos, price, deposit). | You set the price and the deposit |
| 5 | 3 | Hand-over moment: give the item to a friend (hands only), they hand back cash/UPI on a phone screen. | No commission right now |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
A trending 'glow-up'/before-after sound: the beat changes on shot 3.

## Caption
```
Ghar mein camera, speaker, drill, tent... saal mein ek baar use hota hai? 🤔

RentiGoo pe list karo, bilkul free. Price aur deposit aap set karo, request aap accept karo, aur rent seedha aapko milta hai. Abhi koi commission nahi.

Kitna kama sakte ho? Estimate dekho rentigoo.in/earn pe.

📌 Save karo, aur us dost ko bhejo jiske ghar mein sab kuch hai!

#Bhopal #EarnFromHome #RentInBhopal #SideIncome #BhopalStudents
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #MPNagar #RentDontBuy #BhopalBusiness #Declutter #SharingEconomy

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-11-30-reel-earn-from-cupboard`.
- **Through the API:** export the finished video as `reels/ready/2026-11-30-reel-earn-from-cupboard.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
