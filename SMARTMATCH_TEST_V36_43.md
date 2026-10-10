# SmartMatch TEST v36.43 – snygg uppdateringsruta med val

**2026-10-10.** Enbart SmartMatch TEST.

## Problem
När användaren klickade **↻ Uppdatera** visades en webbläsar-native `window.confirm` med lång teknisk text om ej exporterade ändringar och lokalt utkast. Efter omladdning kunde `offerDraftRestore()` ge ännu en webbläsar-popup.

## Ny funktion
En modal med SmartMatch-profil visar aktuell fil, en kort förklaring av lokal sparning och att PDF-filen i Filer/Dropbox inte skrivs över. Tre val:
1. **↻ Uppdatera och fortsätt** – skapar snapshot av arbetsläget inklusive kontroller, inväntar att lokalt utkast sparats i IndexedDB och aktiv original-PDF cachats, bevarar aktuell vy och genomför omladdning. Sparar en tillfällig explicit återställningsbekräftelse i sessionStorage kopplad till PDF-hash. Vid automatisk återöppning konsumeras markören en gång och utkastet återställs utan en ny `window.confirm`.
2. **Spara PDF först** – lämnar dialogen och öppnar den *befintliga* SmartMatch-dialogen för att granska/spara en riktig projekt-PDF; uppdaterar inte automatiskt.
3. **Avbryt · fortsätt arbeta** – stänger dialogen utan omladdning eller ändringar.

- Om lokalt utkast eller käll-PDF inte kan sparas, **stoppa uppdateringen** och visa ett begripligt fel i modal. Användarens ritning lämnas öppen. Inget falskt "uppdaterad"-meddelande.
- Om ingen PDF är öppen kan webbappen uppdateras direkt som tidigare.
- Om ett projekt är öppet men inga osparade ändringar finns får det uppdateras direkt med befintligt spar-/återöppningsflöde.
- Tidigare återställningsfråga för **andra** oförutsedda lokala utkast förblir ett separat säkerhetsbeslut och ändras inte.

## Test
- Ändra 60 % till 100 % och tryck Uppdatera → välj Avbryt: ingenting laddas om.
- Välj Spara PDF först: normal sparfunktion öppnas; projektet ändras inte och uppdateras inte.
- Välj Uppdatera och fortsätt: fil, GS, checklistor och vy ska återställas utan andra bekräftelsen.
- Testa utan IndexedDB/med full lagring: inget förloras, omladdning sker inte, fel visas.
- Testa med stor PDF (30 MB) på iPhone/iPad samt efter PDF-export.
- JS syntax, DOM ID:n och kopplingar statiskt kontrollerade, verklig Safari behöver testas.

Ordinarie Dörrservice, Kontrollflöde, iOS/TestFlight och tidigare versionsfiler oförändrade.
