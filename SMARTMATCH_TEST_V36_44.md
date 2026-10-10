# SmartMatch TEST v36.44 – PDF-export utan GS-procent

Datum: 2026-10-10. Endast SmartMatch TEST, inte ordinarie Dörrservice eller TestFlight.

## Rapporterat fel
Vid Spara PDF visade v36.43:
"PDF-exporten stoppades: sparade projektdata kunde inte verifieras. PDF-statuslagret saknas."

## Grundorsak och ändring
Den befintliga `verifyPortableProjectPdf()` kräver ett `SmartMatch36ProgressStreams`-register i PDF-katalogen.
`smartFlattenProgressBadges()` anropar `smartRemoveOldProgressStreams()`, som tidigare avslutades direkt om käll-PDF:en saknade det registret. Om inget länkat GS hade progress > 0 skapades därför heller inget nytt register, och PDF-verifieringen stoppade en i övrigt giltig export.

Nu skapar `smartRemoveOldProgressStreams()` ett **tomt men giltigt** `SmartMatch36ProgressStreams`-register när det saknas. Kontrollen av sparad projektdata och av samtliga eventuella faktiska GS-statusströmmar är oförändrad och får fortfarande stoppa osäker export.

## Avgränsning
- Ny version: `project-workspace-smartmatch-v36-44.{html,css,js}` samt motsvarande SmartMatch-da- och protokollexportmoduler.
- Sessionshanteringen i `smartmatch-session-v36-43.js` är oförändrad och återanvänds; inga uppdaterings-/arkiveringsbeteenden ändras.
- Den fasta `project-workspace-smartmatch-test.html` ska vara identisk med versionsfilen v36.44.
- Tidigare v36.43-filer lämnas orörda för återgång.

## Verifiering
- JS syntaxkontrollerad.
- Isolerat enhetstest: ny PDF utan statusregister → tomt register skapas.
- Upprepad export med noll progress → tomt register bevaras.
- Regressionstest `node tests/smartmatch-pdf-status-v36-44.cjs` täcker också borttagning av äldre stämplar utan att radera originalinnehåll.
- Praktiskt iPhone/iPad-test med användarens riktiga ritning och nyexport/återöppning återstår.

**Risk:** Det exakta felet som rapporterades är åtgärdat i koden. Om Safari stöter på något annat PDF-fel måste det felsökas separat; ingen export ska betraktas som lyckad innan en riktig PDF har sparats och öppnats.
