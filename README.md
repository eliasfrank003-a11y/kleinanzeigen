# Kleinanzeigen

A listing on Kleinanzeigen does not fail loudly. It sits there at the price you
first hoped for, and three months later it is still sitting there. This app
holds the plan you made when you were still thinking clearly: post it at this
price, give it this many days, then cut.

Each listing is a card, and inside the card the plan runs downward. The phase
you are in shows how far through its days it is. When those days are up the
step turns amber and stays amber — nothing happens automatically, because the
move has to be made on the platform, by hand. You make it, you tap the check,
and the next phase starts counting from that moment.

Finished phases stay on the card with the price they ran at and how long they
actually took, which is rarely what was planned. That record is the point: it
is the only feedback the platform gives you, since Kleinanzeigen never reports
what sold. Marking a listing sold asks for the real price and keeps the whole
track, trimmed to the steps that ran.

## Data

Everything is in `localStorage` on the device — the phases, the photos, the
sale prices. There is no account and no server. Photos are resized to a 640px
long edge before being stored, because the camera roll hands over several
megabytes and the whole store gets about five.

## Running it

```
npm install
npm run dev
```

`npm run build` produces `dist/`. Pushing to `main` deploys it to GitHub Pages
via the workflow in `.github/workflows/deploy.yml`; the Vite `base` is set to
`/kleinanzeigen/` to match the project page's path.

Add it to the iOS home screen from Safari's share sheet and it launches without
browser chrome, like the other apps in this folder.
