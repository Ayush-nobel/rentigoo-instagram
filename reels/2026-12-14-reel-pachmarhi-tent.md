# Reel: Pachmarhi trip this winter? Don't buy a tent you'll use once.

**Post:** Monday, 14 December at 7:30 pm IST · **Length:** about 15 seconds · **Cover:** `output/2026-12-14-reel-pachmarhi-tent/cover.png`

## Hook (first 2 seconds)
> Pachmarhi trip this winter? Don't buy a tent you'll use once.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | Map app zooming from Bhopal to Pachmarhi. Text from frame 1. | Pachmarhi trip this winter? 🏕️ |
| 2 | 3 | Shopping app: tent + sleeping bags in cart (blur brands). | Tent + sleeping bags + stove... |
| 3 | 3 | Swipe the cart away. | Used once a year? Rent them. |
| 4 | 4 | Screen recording: rentigoo.in → Camping & outdoor. | Camping gear from people in Bhopal |
| 5 | 3 | Packing a bag (any outdoor shot you have, or your own trip footage). | Not listed? WhatsApp us, we'll try |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
A trending travel/road-trip sound.

## Caption
```
Planning a winter trip to Pachmarhi? 🏕️ No need to buy a tent, sleeping bags and a stove.

Rent camping gear from people in Bhopal on RentiGoo. Not listed? WhatsApp us on +91 93014 22919 and we'll try to find it.

And if you've got camping gear at home: list it, it's free! 💸
🔁 Share this in your trip group.

#Pachmarhi #Bhopal #RentInBhopal #CampingIndia #MadhyaPradeshTourism
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #WinterTrip #BhopalTravellers #TrekkingIndia #RentDontBuy #MPTourism

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-12-14-reel-pachmarhi-tent`.
- **Through the API:** export the finished video as `reels/ready/2026-12-14-reel-pachmarhi-tent.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
