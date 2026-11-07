# Release

GitHub `master` is de bron. Er is één deploy-route: de bestaande Git-koppeling van Vercel-project `romfix-visuals` (`prj_HjUUZAsUjDvbziWjTXp7rUT9afmq`, team `berntjanbosma-6548s-projects`) op `monoshort/RomfixVisuals`. Productie volgt `master`. Elke andere branch krijgt alleen een preview. `npm run deploy` stopt bewust; er is geen tweede pipeline en geen token in deze repo.

## Voor een wijziging live gaat

1. Open een pull request. De Action `test` draait de berekening, de lichte-fundering/druklaag- en PDF-regressie, en de lokale bronversie.
2. Controleer de preview van die branch (berekening én PDF). De advies-tip uit PR #3 hoort daar niet bij.
3. Merge alleen als `test` groen is. Publiceer niet vanaf een andere branch.

## Bron van een host

`GET /api/version` antwoordt met de git-commit van die deployment (`commit`, header `X-Romfix-Commit`). Lokaal is dat `HEAD`. Op Vercel is dat `VERCEL_GIT_COMMIT_SHA`.

Na publicatie:

```bash
node tools/check-hosts.js --require-commit
```

Dat vergelijkt `https://romfix-visuals.vercel.app` en `https://romls-visuals.vercel.app`. Zelfde etag, dezelfde scriptversie en dezelfde commit zijn verplicht. Eén host mét commit en de andere zonder is een fout.

## Rollback

Rollback is een nieuwe commit: `git revert` van de slechte merge, dezelfde tests, daarna merge naar `master`. Een alias die alleen naar een oude deployment wijst laat `master` op de slechte code staan en is geen rollback.

Op het Hobby-plan kan `vercel rollback` alleen de vorige productie-deployment terugzetten. Verder terug kan alleen via deze git-revert en een nieuwe productie-deployment.

## Wat deze repo niet afdwingt

De workflow kan tests draaien. Zij kan een merge of een productie-alias niet tegenhouden zolang GitHub en Vercel dat niet eisen. De parent zet dat; zie de PR-beschrijving voor de huidige stand.
