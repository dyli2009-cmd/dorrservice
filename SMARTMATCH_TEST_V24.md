# SmartMatch TEST v24 – Spara lokalt, importera dörrkort och klarmarkera originalpunkter

Fast testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Spara
Den synliga Spara-menyn visar Spara objekt, Spara lokalt, Spara som…, PDF-kopia och Skicka mejl. Tidigare Egenkontroll-PDF tas bort från Spara-menyn. Alla projektbaserade exportval öppnar befintlig PDF-granskning för val av kompakt/fullständig export, verklig storlek, förhandsgranskning och handling.
- **Spara objekt:** om filen öppnades via desktop showOpenFilePicker och skrivbehörighet finns, skriv samma öppnade fil på dess ursprungliga plats. Om det inte finns ett skrivbart filhandtag öppnas Spara som där det stöds, annars använd lokal fil-export. Skriv aldrig i originalet automatiskt utan explicit knapptryck.
- **Spara lokalt:** webbläsarens nedladdning, eller iOS delningsmeny (välj Spara i Filer).
- **Spara som:** datorns plats/namnväljare via showSaveFilePicker med nytt skrivbart handtag; mobil erbjuder lokal export.
- **PDF-kopia:** oförändrad kopia av den öppnade PDF:en, utan nya länkar/arbetsstatus. Kompakt/fullständig projektexport ligger bakom övriga spara-menyalternativ.
- **Skicka mejl:** använd systemets delningsmeny med PDF-bilaga där navigator.share stöder filer. Fallback: ladda ner PDF och öppna mailto utan bilaga; visa tydligt att bilagan måste läggas in manuellt och att mejlet inte skickats. Varning för filer som kan överstiga mejlgränsen runt 25 MB.

## Dörrkorts-PDF
Importen av flera PDF-filer har korrigerats:
- Alla importerade dörrkortssidornas exakta PDF-sidnummer lagras som SmartMatch24ImportedCards i sammanslagna projekt-PDF:en.
- Vid scanning behandlas dessa som dörrkortssidor även om formatet saknar igenkänningsord. Första igenkända ID-raden (GS8, WC, HVC etc.) används för automatisk koppling när den är entydig.
- Tidigare projektdata bäddas in i den sammanslagna PDF:en för att inte förlora avbockningar, manuell placering, projektinformation m.m. när bytes-hashen ändras.
- Användargränssnittet visar antal importerade filer, sidor, identifierade kort och sidor som saknar läsbart ID. Sidor utan läsbart ID kan kopplas manuellt.

## Dörrkortskontroller och stil
- Knapp **Markera alla** respektive **Avmarkera** på originalets kontrollpunkter, per vald dörrposition. Egna punkter påverkas inte; progress, sparning och ritningsmarkörer uppdateras.
- Mindre Spara-knapp, Analys & rapporter, Lägg till dörrkort-PDF, dörrkortstext och kontrollrader för mobil/dator.

## Test och begränsningar
- JS syntaxkontroll, HTML-ID-kontroll, rapport- och versionsresurskontroll.
- Körda isolerade JS-test av bulkavbockning och importerad kortidentifiering samt PDF-lib-test av flera PDF-filer och bevarad projektdata i sammanslagna PDF.
- Verifiering på användarens verkliga GS8-dörrkort och på iPhone/Safari/Chrome återstår; ingen garanti att bildbaserade skannade dörrkort får text-ID utan OCR.
- Sparning tillbaka till ursprungsfilen stöds endast där browserns File System Access API ger behörighet. Ingen verklig mejlhandling sker automatiskt.
- v23 tidigare TEST oförändrad. Låst Kontrollflöde/ordinarie app och TestFlight oförändrade.
