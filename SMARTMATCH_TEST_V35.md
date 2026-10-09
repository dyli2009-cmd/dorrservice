# SmartMatch TEST v35 – iPad-delad GS-vy och synlig, delbar PDF-procent

Fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## iPad
- GS14 och andra GS-koder öppnar både originaldörrkortet och checklistan sida vid sida på iPad, även porträtt runt 768 px.
- Mobil under 700 px behåller möjligheten att växla mellan dörrkort och kontrollpunkter.
- Rubriken Kontrollpunkter från originalet behålls. Den långa instruktionstexten under rubriken tas bort.
- Punkträkning förkortas till “5 punkter”. Kompaktare rader, mindre Ändra/Ta bort, Markera alla/Avmarkera/Lägg till. Tidsetiketter döljs i iPad-vyn men tidsuppskattningarna finns kvar i datat.
- Procenten i GS-fönstret och på ritningsmarkörerna uppdateras fortsatt automatiskt när en punkt bockas av.

## PDF-export och fortsatt arbete
- PDF:ens katalog innehåller redan checklistans fullständiga sparstatus per unik GS-position. Ingen extra PDF-rapportsida läggs till.
- När PDF sparas läggs små **skrivbara statusetiketter** (t.ex. 60 %, 100 %) vid de färdigmarkerade GS-positionerna på originalritningarna. Etiketterna är PDF FreeText-annoteringar med eget utseende och visas även i kompatibla PDF-läsare.
- Vid omsparning tas föregående SmartMatch-statusetiketter bort och nya läggs till, så procenten inte dupliceras.
- När en PDF med inbäddad SmartMatch-data öppnas ges filens status företräde framför eventuell äldre lokal webbläsarhistorik under själva inläsningen. Efter öppning arbetar användaren vidare normalt och kan spara samma originalfilnamn igen.
- Att **tre personer ska ändra samma fil samtidigt** ingår inte; kräver senare särskild synkronisering/konflikthantering. PDF-baserad filöverföring ger bara sekventiellt samarbete.

## Avgränsning
- Endast SmartMatch TEST v35. v34 bevaras. Ingen ändring av ordinarie app, Kontrollflöde eller TestFlight.
- Statisk QA av JS, HTML, referenser, version och statusutförsel. PDF-läsar-kompatibilitet och faktisk GS-ritning behöver testas i iPad Safari.
