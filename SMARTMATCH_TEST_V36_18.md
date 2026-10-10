# SmartMatch TEST v36.18 – maskinlista bredvid placering i revisionschecklista

- Flyttat det BEFINTLIGA fältet `pwAutomationModel` från nedfällda **Tekniska ändringar** till raden bredvid **Placering / dörrlittra** i `Projekt och uppgifter` när användaren öppnar revisionschecklistan.
- Rubrik **Typ av dörrautomatik**. Samma lista över 11–48, inklusive de redan implementerade alternativen och **Annan modell…**. Inget nytt globalt fält.
- Maskintyp och placering gäller endast den valda automatiken, inte alla egenkontroller; övriga projektuppgifter är fortfarande gemensamma.
- Appen väljer befintlig maskinkod från den aktuella automatikens ID. Om en tekniker ändrar typen uppdateras modellkod/modellnamn, den fullständiga ID-märkningen, rubriken och listan med automatiker med samma befintliga sparlogik.
- Tidigare egeninlagda maskinmodeller (inte i listan) visas nu korrekt som **Egen modell · [namn]** och förloras inte när dialogen öppnas igen.
- **Tekniska ändringar** innehåller fortsatt **Antal / löpnummer** och **Objektnummer · del av ID** för individuell justering.
- Två kolumner för Placering/Maskintyp på vanliga mobiler/iPad, staplat på mycket små skärmar.
- INGA ändringar av GS-motorn, familjescanning, automatikskanning, ritningsmarkörer eller PDF-export. Utökning “Hitta alla” beslutas efter diskussionen.
- Tidigare v36.17-snapshot orörd; inga ändringar av ordinarie Dörrservice eller TestFlight.

## Testa
1. Välj DA-listan, tryck markerad position på ritningen, öppna **Checklista revision dörrautomatik**.
2. Se **Typ av dörrautomatik** bredvid **Placering / dörrlittra**, med maskinval som matchar befintlig märkning.
3. Ändra maskintyp, kontrollera uppdaterad **ID-märkning · automatiskt** och egenkontrollens rubrik.
4. Stäng och öppna igen: modell/placering för denna automatik ska vara kvar; andra automatiker ska vara oförändrade.
5. Testa **Annan modell…**, spara och öppna igen.
