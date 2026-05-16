<!-- deft:template -->

# Cost & Budget Estimate

> All figures in **US dollars (USD)**. Loose ranges, not exact numbers.
> Built from the approved project spec. If the spec changes, redo this
> estimate before building.

## TL;DR

For the current plan, the game itself should cost about **$0 - $10 most months**, because it can live on GitHub Pages and save data on the Fire tablet instead of paying for a server or database. The biggest thing that would push costs higher is if future versions add paid online services, custom domains, or a lot of outsourced art/audio work.

## What you will need to sign up for

- GitHub account for the repo and GitHub Pages hosting `(free tier OK)`
- Amazon Fire tablet browser for play testing
- Optional domain name if you do not want to use the GitHub Pages URL `(typical: $10 - $20 / year)`
- Optional AI image-generation account for creating art assets later `(pay as you go)`

## Hosting & infrastructure

- **Hosting / app server**: estimated **$0 - $0 / month** using GitHub Pages
- **Database**: estimated **$0 - $0 / month** because saves live in the browser on the tablet
- **CDN / file storage**: estimated **$0 - $0 / month** for the expected project size on GitHub Pages
- **Domain & TLS**: **$0 - $2 / month** if you later buy a custom domain; otherwise $0
- **Other (device backup storage)**: estimated **$0 - $2 / month** if you choose to keep exported save backups in cloud storage later

## API & third-party fees

> Assumption used for the numbers below: about one child using one Fire tablet nightly, with local play and no required online gameplay services.

- **Image generation for asset creation**: estimated **$0 - $20 / month** during active art-production periods, and usually **$0** after the first asset batches are done
- **Other runtime APIs**: estimated **$0 - $0 / month** because the current spec does not require paid online services for normal play

## Monthly band

- **Low** _(quiet month / hobby use)_: **$0 / month**
- **Typical** _(everyday use as described in the spec)_: **$0 - $5 / month**
- **High** _(busy month with new asset-generation work, optional paid services, or a custom domain)_: **$20 - $50 / month**

## Scale considerations

- If the game stays a simple GitHub Pages app with local saves, normal monthly cost should remain near zero.
- Costs go up mainly if you choose to generate lots of new art in short bursts, buy a custom domain, or add online features later that need a server or cloud database.

## Build & maintenance time

- **Build**: about **25 - 45 hours** of focused work for the first playable version with save system, unlocks, parent backup tools, and starter content
- **Maintenance**: about **2 - 6 hours / month** after launch for small fixes, content additions, and occasional asset work

## Decision point

Pick **one**. The build phase will refuse to start until this is
recorded.

1. **Build** -- proceed to build with this cost expectation.
2. **Rescope** -- keep building but reduce cost first. List the spec
   changes, then redo this estimate.
3. **No-build** -- stop here. Record the reason below.
4. **Skip** -- skip the cost phase. Record a short reason
   (e.g. "hobby project, cost is not a concern", or "cost already
   estimated as part of parent project X").

### Decision recorded

- **Decision**: build
- **Date**: 2026-05-15
- **Recorded by**: Chris
- **Reason** (required for skip / no-build / rescope): n/a

---

_This estimate is a snapshot. Vendor pricing changes over time. Redo
this file before any major scope change. Methodology lives in
[references/cost-models.md](./deft/references/cost-models.md)._
