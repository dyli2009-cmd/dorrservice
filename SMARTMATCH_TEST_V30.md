# SmartMatch TEST v30 – Verktyg högst upp, ren projektvy och originalfilnamn

Testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Uppdatering av gränssnitt
- Verktygsraden med **Verktyg**, ångra/gör om, Passa, Välj, Tid, sidbyte och zoom flyttas från under ritningen till **precis under sidhuvudet**, alltså ovanför ritningen.
- På små skärmar visas verktygen först och raden kan svepas i sidled. Menyn för **Verktyg** öppnas i en fast mobil-/iPad-panel så att den inte kapas av den horisontellt skrollbara raden.
- Den fyrdelade rutan med sifferstatistik (antal positioner, kopplade, klara, procent) **döljs** i ritningsvyn. Beräkningarna är kvar för Analys & rapporter, checklista och protokoll.
- Den långa status-/diagnostiktexten (t.ex. '5 originalpunkter fungerar') döljs visuellt men är kvar som skärmläsarstatus och för intern felsökning.
- En liten, smal projektrad visar **filnamnet utan .pdf** och – när PDF-texten är läsbar – ritningens **plan/område**, t.ex. `Snidaren · FÖRRÅD`. Planetikettens automatiska avläsning från tidigare v27 behålls.

## Namn på sparad PDF
- **Samma filnamn som ursprungsfilen**, utan automatiska tillägg som '-smartmatch-v30-kompakt'. Exempel: `Snidaren.pdf` öppnas och sparas/exporteras som `Snidaren.pdf`.
- Om den äldre, internt dolda funktionen sammanfogar ritning med separata dörrkort, används också ritningsfilens originalnamn för sammanfogad PDF. Intern PDF-data lagras som tidigare.
- **Spara objekt** kan skriva över det öppnade originalet på datorn om webbläsaren har skrivbehörighet till filhandtaget. **Spara lokalt** på mobil eller via nedladdning föreslår originalnamnet men kan inte garantera tyst överskrivning; operativsystemet/webbläsaren kan skapa ett namn med '(1)' vid namnkonflikt. Ingen osynlig överskrivning av lokala filer.
- Dialogen Granska PDF, kompakt export utan extra SmartMatch-rapportsidor, PDF-bokmärken och övriga flöden behålls.

## Kvalitet
- v29 fryst oförändrad. Versionsbundna v30 HTML/JS/CSS, HTML-ID, JS-syntax, menyplacering, granskningsknappen och metadata bakåtkompatibilitet testade.
- Namntest med `Snidaren.pdf`, `SNIDAREN.PDF`, `Plan 1 - Förråd.pdf`, `ritning-245.pdf` och annat. Praktiskt iPhone-/iPad-test med användarens verkliga fil behövs.
- Ordinarie Kontrollflöde/webb/iOS och TestFlight har inte ändrats.
