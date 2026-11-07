# Release

GitHub `master` is de bron. De enige deploy-route is de bestaande Git-koppeling van Vercel-project `romfix-visuals` naar deze repository. Productie volgt `master`. Elke andere branch krijgt alleen een preview. `npm run deploy` stopt; deze repo bevat geen tweede pipeline en geen token.

## Voor een wijziging live gaat

1. Open een pull request. De Action `test` draait de berekening, de lichte fundering met aparte druklaag, de PDF en de lokale bronversie.
2. Controleer de preview van die branch: berekening en PDF.
3. Merge alleen als `test` groen is. Publiceer niet vanaf een andere branch.

## Productiehosts

`GET /api/version` geeft de git-commit van die deployment (`commit`, header `X-Romfix-Commit`).

Na een geslaagde `test` op een push naar `master` start `host-sync` vanzelf. Die leest de actuele master-tip en vergelijkt `https://romfix-visuals.vercel.app` en `https://romls-visuals.vercel.app` met die commit. Beide moeten HTML 200 geven, een JS-fingerprint van `app.js`, en `/api/version` 200 met dezelfde commit. Er zijn 15 pogingen, 20 seconden uit elkaar, voor het doorschuiven van de deployment. Een oudere run stopt zonder fout zodra `master` een nieuwere commit heeft; die nieuwere commit heeft een eigen run.

Handmatig, één keer:

```bash
node tools/check-hosts.js --require-commit
```

De job verzet geen aliassen. `romls-visuals.vercel.app` is een extra alias naast het productiedomein `romfix-visuals.vercel.app`. Wijkt die alias af, dan faalt `host-sync` tot beide hostnames dezelfde commit serveren.

## Preview

`preview-identity` luistert alleen naar `vercel.deployment.success`. Het schema is `project`, `environment`, `git.sha`, `url`, `id` en `state.type`. Bij `environment=preview` controleert de job alleen die deployment-URL. Bij `production` doet die job niets: de productiehosts horen bij `host-sync`.

Dit event komt alleen aan als het workflowbestand op `master` staat en Vercel het event stuurt. `host-sync` hangt daar niet van af.

## Rollback

Rollback is een nieuwe commit: `git revert` van de slechte merge, dezelfde tests, daarna merge naar `master`. Alleen een alias verzetten laat `master` op de slechte code staan.

Op het Hobby-plan kan `vercel rollback` alleen de vorige productie-deployment terugzetten. Verder terug gaat via deze git-revert.

## Wat de workflows niet afdwingen

`test` en `host-sync` melden resultaat. Zij zetten geen branch protection en wijzen geen productie-alias toe. Een verplichte statuscheck op `master` blijft een instelling van de repository, buiten deze bestanden. `host-sync` niet als Deployment Check verplichten: de job leest de aliassen nadat ze zijn doorgezet.
