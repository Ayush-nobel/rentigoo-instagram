# Reel: 'Deposit wapas milega?' Here's exactly how it works.

**Post:** Monday, 21 December at 7:30 pm IST · **Length:** about 18 seconds · **Cover:** `output/2026-12-21-reel-deposit-question/cover.png`

## Hook (first 2 seconds)
> 'Deposit wapas milega?' Here's exactly how it works.

Put the on-screen text up from the very first frame. Start mid-action, no intro.

## Shots (film on your phone, vertical, 1080x1920)
| # | Sec | What to film | On-screen text |
|---|-----|--------------|----------------|
| 1 | 2 | You looking suspicious at the camera, eyebrow raised. Text from frame 1. | Deposit wapas milega? 🤨 |
| 2 | 4 | Hands photographing an item at pickup (2 angles). | Pickup: both take photos |
| 3 | 4 | Hands photographing it again at return. | Return: photos again |
| 4 | 4 | Phone shows a UPI 'received' screen (blur amount and names). | All good? Back within 24 hours |
| 5 | 4 | You, relieved, thumbs up. | Damage? Reported in 24 hrs, with photos |

Filming tips: daylight by a window, phone at eye level, hold each shot a beat longer than you think (easier to cut). Keep text out of the bottom 20% and the right edge, where Instagram's buttons sit. Blur any names, numbers or faces of people who haven't agreed to be in it.

## Audio
A trending 'question → answer' sound with a reveal.

## Caption
```
Sabse bada sawaal: "Deposit wapas milega?" 🤨

Pickup aur return pe dono photos lete hain. Sab theek hai toh owner 24 ghante mein deposit wapas karta hai. Damage hua toh 24 ghante mein photos ke saath report, aur sirf repair ka reasonable kharcha.

Poore rules: rentigoo.in/refunds
📌 Save karo, aur share karo!

#RentInBhopal #Bhopal #DepositRules #SafeRenting #RentDontBuy
```

Other hashtags (not published while HASHTAG_LIMIT is 5): #BhopalStudents #MPNagar #BhopalDiaries #TrustAndSafety

## Publishing
- **In the app (best for trending audio):** post it yourself, pick the sound there, and use the cover above. Then mark it done: `node scripts/publish.mjs --mark-manual 2026-12-21-reel-deposit-question`.
- **Through the API:** export the finished video as `reels/ready/2026-12-21-reel-deposit-question.mp4` (MP4, H.264, AAC audio, 9:16, under 100 MB so GitHub can hold it). It goes out at the time above with the video's own sound (the API can't add Instagram's library music).
