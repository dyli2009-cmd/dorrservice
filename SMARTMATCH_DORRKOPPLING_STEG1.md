# SmartMatch TEST – Koppla dörrautomatik, steg 1

**Fristående prototyp för att prova märkningar och GS-kopplingar.** Påverkar inte SmartMatch TEST v35, Dörrservice/iOS eller tidigare versioner.

- Testa: https://dyli2009-cmd.github.io/tillsyno/smartmatch-automatik-koppling-test.html
- Öppna en PDF. Ange ett verkligt märkningsexempel, t.ex. `70154-78-24-11`, och välj **Analysera samma familj**.
- Märkningsfamiljen är allt före **sista bindestrecket**: `70154-78-24`. Andra sista delar, såsom `10`, `11`, `12`, ska ge **egna knappar**, inte bli en enda dörr.
- PDF-text söks igenom på alla sidor för samma familj. Klickbara märkningar ritas ovanpå originaltexten, inte i originalfilen.
- GS-positioner läses från PDF-texten. När närmaste GS-position är tydlig föreslås/lagras automatisk koppling; annars väljer man manuellt via dörrknappens GS-lista.
- Pilar mellan märkning och vald GS-position ritas som en separat visningsyta, kopplingen behålls vid zoom/sidbyte.
- **Placera manuellt** gör att en användare kan sätta en egen märkning på den öppna ritningssidan när PDF-textextraktion inte räcker.
- Kopplingar och manuellt placerade knappar sparas i den aktuella webbläsarens lokala lagring per PDF-fil (filnamn och storlek), och man kan exportera kopplingarna som JSON för separat kopia.

## Avgränsningar
Detta är **endast steg 1**: identifiering av märkningsfamilj, separata knappar, GS-koppling och pil. Knappens färdiga **Checklista revision dörrautomatik**, **SLR**-mapp och PDF-statusinbäddning är **inte integrerade i den här prototypen**. Sidan använder ett eget testfönster i stället för den fullständiga SmartMatch-arbetsytan.

Automatisk GS-koppling bygger på avstånd i samma ritningssida och är ett **förslag**, inte bevis för korrekt fysisk tillhörighet. Granska de valda kopplingarna innan de används som underlag för verklig egenkontroll. Om märkningen ligger som pixlar i inskannad PDF krävs en separat OCR-funktion som ännu inte ingår.

## Nästa steg
När användaren provat riktiga ritningar och bekräftat träffsäkerheten:
1. Integrera samma märkningsfamilj/GS-koppling i den versionerade SmartMatch TEST-appen.
2. Visa valen **Checklista revision dörrautomatik** (befintlig mall) och **SLR** (dokumentmapp), per unik fysisk dörr.
3. Återanvänd projektets utförare/kunduppgifter, bevara separata kontroller per fysisk dörr och integrera kopplingarna i exporterad projekt-PDF.
4. Inför möjlighet att justera markering och pil med pekverktyg.
5. Behåll fleranvändar- och offlinesynkronisering som en separat framtida plan enligt `SMARTMATCH_SAMARBETE_OFFLINE_PLAN.md`.
