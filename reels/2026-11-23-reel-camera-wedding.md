# Reel: Don't buy an ₹85,000 camera for one wedding.

**Post:** Monday, 23 November at 7:30 pm IST · **Length:** about 16 seconds · **Cover:** `output/2026-11-23-reel-camera-wedding/cover.png`

## Hook (first 2 seconds)
> Don't buy an ₹85,000 camera for one wedding.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | Close-up: your hand pushing a camera box / camera across a table towards the lens. Text on screen from frame 1. | Don't buy an ₹85,000 camera for one wedding |
| 2 | 3 | You (or just your hands) counting: 1 wedding, 1 sangeet, then the camera goes in the cupboard. Show a cupboard door closing. | Used once. Then two years in the cupboard. |
| 3 | 4 | Screen recording on your phone: rentigoo.in → Browse → Cameras. | Rent it from someone in Bhopal instead |
| 4 | 4 | Screen recording: open a camera listing, scroll past price/day and the refundable deposit. | Price per day + refundable deposit, shown upfront |
| 5 | 3 | Hands holding the camera, then a thumbs-up or a quick shutter click sound. | Not listed? WhatsApp us. We'll try to find it. |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
Trending upbeat wedding/dhol track from the Reels audio browser (look for the ↗ trending arrow) under a short voiceover. If you publish through the API, the video's own sound is used, so mix the music into the file.

## Caption
```
An ₹85,000 camera for one wedding? 😅 After the wedding it just sits in the cupboard.

Rent a camera from people in Bhopal on RentiGoo, only for the days you need it. The price per day and the refundable deposit are shown upfront, and there's no booking fee right now.

Can't find what you need? WhatsApp us on +91 93014 22919 and we'll try to find it.

👉 Save this for the next wedding, and share it with the friend who becomes the photographer at every function.
🌐 rentigoo.in

#Bhopal #RentInBhopal #BhopalWeddings #CameraOnRent #BhopalEvents
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #MPNagar #RentDontBuy #WeddingSeason #BhopalPhotographers #IndianWedding

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-11-23-reel-camera-wedding`.
- **Through the API:** export the finished video as `reels/ready/2026-11-23-reel-camera-wedding.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).

## Notes
The ₹85,000 figure is your example hook from the brief. On posting day, check the camera listing you show is still live.
