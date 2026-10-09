# SmartMatch TEST v25 – Ett originaldörrkort och rätt ritningsposition

Fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Vad ändras
- Endast kompakt PDF-export finns kvar; val Fullständig har tagits bort och den tidigare `appendGsStatusPdf` som duplicerade ett dörrkort per GS-position är borttagen.
- På ritningen länkar alla GS8-positioner till **samma originaldörrkort**. PDF-filen innehåller en klickbar positionslista i projektets statusindex. Om bara en ritningsposition finns kan knappen på dörrkortet länka direkt till den.
- I SmartMatch minns Till ritningen den senast öppnade positionens ID, sida, zoom och PDF-rektangel. På återgång till ritningen väljs rätt sida/position även om många platser delar GS8.
- Kompakt exporter tar nu bort oanvända PDF-objekt inklusive överblivna resurser från gamla duplicerade dörrkort efter omsparning, via reachability traversal från PDF:s katalog/trailer. Alla använda originalsidresurser och länkar bevaras.
- Sparade kompakt-PDF:er har metadata om vilka dörrkortssidor som redan fått synlig Till ritning-knapp, för att undvika att samma text ritas om och staplas på varandra vid varje export. Gamla v24-kompakta länkar känns också igen.
- Spara objekt, Spara lokalt, Spara som, PDF-kopia och Skicka mejl finns kvar. PDF-filstorleken visas efter skapandet och före delning. Projektdata från tidigare versioner och importerade dörrkortspage-tags läses fortfarande.
- Endast SmartMatch TEST uppdateras; tidigare v24-kod behålls. Låst Kontrollflöde, ordinarie webben och iOS/TestFlight ändras inte.

## Testresultat
- Syntetisk GS8-PDF med 18 positioner och ett dörrkort: äldre full export 22 sidor, kompakt export 4 sidor. Testfilstorlek ca 29,6 KB -> 4,0 KB med resursrensning; **det är ett syntetiskt test, inte faktisk sparbesparing på kundens PDF**.
- Upprepad export: antal sidor och länkar stabilt, inga nya dörrkortskopior. Gammal v24 kompakt öppnas och konverteras till v25 kompakt.
- Testad navigering tillbaka till sparad ritningssida 2 och vald position trots att annan sida tidigare var öppen.
- JavaScript-syntax, unika HTML-ID och versionsresurser verifierade. Verklig iPhone/dator/PDF-läsartest återstår.
