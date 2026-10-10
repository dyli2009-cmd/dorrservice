# SmartMatch TEST v36.20 – kompakt resultat och flyttad omsökning

- **Behåller v36.19 sök- och GS-länklogik oförändrad** (PDF-text, annotationer, objektnummer, unik fysisk position, befintliga checkar/pilar).
- Success-status, både i markeringsdialog och i DA-inställningar: endast **Hittade N automatiker**. Inga tekniska räknare, "befintlig", "saknar GS" eller intern felsökningslogik.
- Träffarna i markeringsdialogen visar endast ID-märkning på varje rad (tryck för att hitta positionen).
- Under **DA · Egenkontroller** visas i vardagslistan endast automatiken ID + kort maskinnamn + befintlig procent; inte sida/GS kopplad/välj GS. Men Koppla / ändra GS och Justera pil finns kvar i ⋯ på varje post.
- Under **DA · Egenkontroller** finns ett diskret, infällbart **⋯ Inställningar → ↻ Hitta fler automatiker** (objektval visas bara när flera objekt finns). Omsökning använder relevant befintlig automatik som referens, helst en som har GS-koppling.
- En redan markerad automatik visar första-gången-knappen **Hitta alla andra automatiker** bara när objektnumret har högst en egenkontroll. Om objektet har flera automatiker ligger omsökning enbart under gruppens inställningar, även efter sidomladdning.
- Resultat i gruppens verktyg och programstatus hålls kort även vid omsökning.
- Inga ändringar i Kontrollflöde, normal app, TestFlight eller tidigare versioner. Stabil test-URL visar v36.20.

## Testa
1. Öppna tidigare PDF med 17 automatiker: på en markering ska endast Checklista revision / SLR synas.
2. Under DA · Egenkontroller → ⋯ Inställningar → Hitta fler automatiker → kontrollera meddelandet “Hittade 17 automatiker”.
3. DA-listan ska visa ID och maskintyp, men inte sida/GS-kopplingsstatus.
4. Kontrollera att varje positions ⋯ Koppla / ändra GS och Justera pil fortfarande fungerar.
5. I ett projekt med EN automatik visas Hitta alla andra från markeringen. Efter hittad andra automatik flyttas möjligheten till DA-inställningarna.
