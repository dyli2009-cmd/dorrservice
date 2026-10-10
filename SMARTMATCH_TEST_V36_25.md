# SmartMatch TEST v36.25 – GS-pilar till befintliga automatiker

Tidigare innebar “Hittade 17 automatiker” bara hittade märkningar, inte att någon pil verkligen var kopplad.

- Kör nu en skonsam GS-kopplingskontroll också på redan sparade automatiker när PDF:en öppnas och efter **DA · Egenkontroller → ⋯ Inställningar → Hitta fler automatiker**.
- Befintliga giltiga GS-kopplingar ändras inte. Ogiltiga äldre GS-ID:n kan repareras om samma GS-beteckning är unik på ritningssidan eller sparad rektangel ger entydig träff.
- Bara tydliga avstånds- och dörrkortsträffar auto-kopplas. Osäkra föreslagna GS-länkar förblir manuella.
- Sparar GS-beteckning, fysisk rektangel och explicit borttagen koppling så att länkar kan återfinnas efter framtida GS-skanning.
- Pilritningen är synligare med vit kontur och kraftigare blå linje.
- GS-sökningen, automatikens ID och position, individuella checklistor, SLR och tvådelade ritningsmarkeringar ändras inte; TestFlight och Kontrollflöde orörda.

Testa med samma PDF och 17 automatiker; kontrollera pilarna på ritningen när skanningen är färdig. Kör Hitta fler automatiker för att prova gamla GS-kopplingar igen. Om GS-valet fortfarande är osäkert, välj manuellt via ⋯ → Koppla / ändra GS.