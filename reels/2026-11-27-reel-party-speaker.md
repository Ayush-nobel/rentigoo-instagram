# Reel: Party this weekend? Rent the speaker, not buy it.

**Post:** Friday, 27 November at 8:30 pm IST · **Length:** about 15 seconds · **Cover:** `output/2026-11-27-reel-party-speaker/cover.png`

## Hook (first 2 seconds)
> Party this weekend? Rent the speaker, not buy it.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | Your phone showing a WhatsApp party plan (blur names), quick zoom in. Text from frame 1. | Party this weekend? |
| 2 | 3 | A shopping app cart with a big speaker (blur the brand), thumb hovering over Buy. | Rent the speaker, not buy it |
| 3 | 3 | Thumb moves away. Cut to you shaking your head / closing the app. | 1 night of party = 1-2 days of rent |
| 4 | 4 | Screen recording: rentigoo.in → Browse → Party & events. | Rent from someone in Bhopal |
| 5 | 3 | Lights on in a room, music starts. End on the RentiGoo logo or website. | Not listed? WhatsApp us, we'll try to find one |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
A trending party/beat-drop sound: the drop lands on shot 5 when the lights come on.

## Caption
```
A new speaker for a weekend party? 🔊 Why spend that much on one night?

Rent party gear from people in Bhopal on RentiGoo. Can't see a speaker listed yet? WhatsApp us on +91 93014 22919 and we'll try to find someone who has one.

And if there's a speaker sitting at home, list it. It's free, and you earn rent. 💸

🔁 Share this with the friend who hosts every party!

#Bhopal #RentInBhopal #BhopalParty #PartyRentals #BhopalEvents
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #WeekendVibes #RentDontBuy #BhopalNightlife #MPNagar #BhopalStudents

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-11-27-reel-party-speaker`.
- **Through the API:** export the finished video as `reels/ready/2026-11-27-reel-party-speaker.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
