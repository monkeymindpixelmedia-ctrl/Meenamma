# Meenamma signup tutorials

This workspace keeps video-authoring dependencies separate from the customer-facing
React app. It produces two reviewed cuts from the same signup story:

- `SignupTutorialRemotion`: 1920×1080 landscape walkthrough for the signup page.
- `meenamma-signup-vertical`: 1080×1920 HyperFrames cut for mobile/social use.

## Commands

```powershell
npm install
npm run dev
npm run render
```

Rendered files are written to `out/`. After reviewing the poster and snapshots,
copy approved MP4 assets to `frontend/public/tutorials/` and update its manifest.

The videos intentionally use captions and no music or voiceover, avoiding
unlicensed audio and keeping the tutorial understandable when muted.
