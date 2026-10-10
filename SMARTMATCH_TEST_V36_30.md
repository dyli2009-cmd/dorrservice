# SmartMatch TEST v36.30 – PDF är projektets huvudkälla

Den PDF som faktiskt öppnas är nu alltid huvudkälla för projektinformation, även vid noll automatiker. Tidigare projekthistorik i webbläsaren används inte som alternativ källa och kan inte skriva över ändringar eller borttagningar som en kollega sparat.

Ny PDF-metadata `TillsynoSmartMatchV36Data` (även speglad i tidigare `TillsynoSmartMatchV30Data`) innehåller kompletta projektet: alla DA-ID, sida, position, storlek, GS-kopplingar/pilar, kontroller/anmärkningar/SLR, checklistor, manuella GS-positioner/ändringar, projektuppgifter/logo, OCR, tidstyper/tidsinställningar och revisionsnummer. För äldre filer läser appen äldre inbäddade V30–V13-format.

Före Spara lokalt/Spara som får aktiveras verifierar appen att själva nybyggda PDF-bytesen kan återläsas med exakt samma fullständiga projektinformation. Resultatet visar verifierat antal automatiker, GS-kopplingar, kontrollsvar, ritningspositioner och projektversion. Felaktig projektmetadata vid import stoppar öppningen, inte tyst tom lista.

Tillfällig minnesredigering är inte en sparad PDF. Klick på Uppdatera varnar för osparade ändringar; `Spara` inne i DA-checklistan heter `Klart` för att undvika förväxling med PDF-export. Lokal PDF-cache kan återställa öppnad originalfil och vy men får aldrig prioritet över filens projektdata.

TEST-scanning GS/DA, skämt och procent visas som tidigare. Produktion/TestFlight oförändrad, v36.29 lämnas kvar.

Testa: öppna en PDF med 17 DA i Chrome, välj PDF, kontrollera verifieringsraden 17, spara till nytt filnamn, öppna *den nysparade PDF-filen* i Chrome och Safari, och verifiera 17 med kopplingar och egenkontroller. Testa sedan kollegans ändrade fil ovanpå en webbläsare med äldre historik. Spara inte över original förrän återöppning är verifierad.