# SmartMatch TEST v36.29 – återställning av dörrautomatikens fungerande skanning

**Rapporterat fel:** I nyare laddningsversioner saknas tidigare hittade dörrautomatiker i ritningen och DA-listan, medan dörrkort/GS fortfarande visas.

**Åtgärder:**
- Återställer dörrautomatikens scan-/matchningsmodul exakt från den äldre fungerande **TEST v36.23** (versionen som hittade 17 märkningar och bevarade manuell GS-koppling), utan den senare automatiska GS-återkopplingen från v36.25–v36.28. Det innebär att nya pilar får kopplas manuellt om ingen säker GS-länk fanns.
- Tar bort den farliga tidiga förhandsrenderingen i v36.26–v36.28 som tömde `automationItems`, `instances`, `stamps`, `projectStamps`, och `protocolMap` innan sparad projektdata byggts upp. Återgår till originalordningen: PDF → dörrkortsindex → ritningsmarkeringar → läs sparade automatiker/kontroller → koppla kort → rendera färdig ritning.
- Skanningsprocessen får **inte** skriva den ofärdiga/temporärt tomma datan till projektets localStorage. `save()` blockeras så länge `smartScanActive` är true, och `save(true)` körs först när ritning, markeringar och protokoll har bearbetats utan fel.
- Om sparad dörrautomatikdata finns får fliken **DA · Egenkontroller** öppnas automatiskt, så att du direkt ser hur många automatiker som återställts.
- Samma fungerande GS-/dörrkortsindex och PDF-text-/färgsökning behålls. Laddningsprocent, ungefärlig tid kvar och de snabba/varierande skämten från v36.28 behålls, men den tidiga preview-ritningen pausas tills analysen är klar.
- Originalprojektets sparade checklistor, märkningar, SLR-dokument och manuella GS-länkar bevaras om de finns kvar i localStorage eller är inbäddade i PDF:en.
- Om en tidigare version redan har skrivit över automatiseringsdata med en tom lista kan det inte återställas enbart genom att byta kod. Då behövs tidigare exporterad PDF med sparad projektstatus eller att man gör om den gamla första märkning → Hitta alla automatiker-skanningen.

**Verifiera på samma PDF:** starta TEST v36.29, öppna samma projekt/PDF, kontrollera att DA · Egenkontroller visar de tidigare 17 och att ID-träffarna syns på ritningen. Om 0, skanna med den tidigare fungerande metoden: placera/granska den första märkningen och välj **Hitta alla automatiker**. Exportera ingen ny PDF förrän de 17 är verifierade. TestFlight/produktion orörd.

V36.28 och v36.23 finns kvar för jämförelse.