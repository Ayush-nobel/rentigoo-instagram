# Reel: Christmas movie night on a big screen, without buying a projector.

**Post:** Friday, 18 December at 8:30 pm IST · **Length:** about 15 seconds · **Cover:** `output/2026-12-18-reel-projector-movie-night/cover.png`

## Hook (first 2 seconds)
> Christmas movie night on a big screen, without buying a projector.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | Friends' feet on a mattress, blankets, lights off. Text from frame 1. | Movie night this Christmas? 🎄 |
| 2 | 3 | Point at a blank white wall. | This wall = your big screen |
| 3 | 3 | Turn on a projector (yours or a friend's), light hits the wall. | Rent the projector for the night |
| 4 | 4 | Screen recording: rentigoo.in → Electronics & gaming. | From someone in Bhopal |
| 5 | 3 | Popcorn bowl, everyone settles in. | Not listed? WhatsApp us, we'll try |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
A trending cosy Christmas / lo-fi sound.

## Caption
```
Friends coming over for Christmas? 🎄🍿 Turn a wall into a big screen.

No need to buy a projector: rent one in Bhopal on RentiGoo. Not listed? WhatsApp +91 93014 22919 and we'll try to find one.

🔁 Share this with the friend whose house hosts every party!

#Bhopal #ChristmasInBhopal #MovieNight #RentInBhopal #BhopalParty
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #ProjectorOnRent #BhopalEvents #RentDontBuy #MPNagar #ChristmasVibes

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-12-18-reel-projector-movie-night`.
- **Through the API:** export the finished video as `reels/ready/2026-12-18-reel-projector-movie-night.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
