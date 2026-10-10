# SmartMatch TEST v36.21 – färger och procent i DA · Egenkontroller

Den befintliga listan DA · Egenkontroller visar nu en tydligt färgad ruta för varje automatik, med dess fullständiga ID, maskinmodell och procent.

- **Grå:** Ej kontrollerad eller fortfarande delvis kontrollerad utan anmärkning, med faktisk procent (0–99 %).
- **Grön:** Samtliga 18 kontrollpunkter är besvarade med **Klart utan anmärkning** eller **Ingår ej**; 100 %.
- **Röd:** En eller flera punkter har status **Klart med anmärkning** – även om checklistan är 100 % ifylld. Röd har företräde framför grön och grå.
- Procent beräknas direkt från sparade kontrollpunkter vid varje render, inte en potentiellt gammal sparad progress-siffra.
- Färgkod och status finns även i knappens hjälptext och tillgänglighetsnamn.
- När användaren väljer status för en kontrollpunkt uppdateras listan redan automatiskt via `renderGroups()`.
- Ingen ändring av ritningssymboler, GS-matchning, auto-scanning, SLR, PDF-export eller Kontrollflöde.
- Alla tidigare test-snapshots finns kvar, ordinarie TestFlight är oförändrad.

## Manuell kontroll
- 0 av 18 besvarade => grå 0 %
- 9 av 18 `ok` => grå 50 %
- 18 av 18 `ok` => grön 100 %
- 17 `ok`, 1 `na` => grön 100 %
- 17 `ok`, 1 `remark` => röd 100 %
- 4 `ok`, 1 `remark` => röd cirka 28 %
- Byt anmärkningspunkten till `ok` => grön om resten är klart, annars grå
