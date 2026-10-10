# SmartMatch TEST v36.16 – Granska, spara och dela revisionsprotokoll

## En enskild automatik
DA-listan hittar positionen på ritningen; tryck på markeringen för Revision/SLR. Revisionsdialogen har **Förhandsgranska PDF**, **Spara lokalt** och **Skicka mejl**. Förhandsgranskningen kan bläddra mellan PDF-sidor och ger åtkomst till samma spar-/delningsfunktioner.

## Flera protokoll till en PDF
Ny knapp **Skicka protokoll** i projektets överkant. Välj vilka automatikchecklistor som ska ingå (även ofärdiga). Välj **Kunden** eller **Min egen e-post**, skriv ev. mottagaradress. Knappar: **Förhandsgranska**, **Spara lokalt**, **Skicka via mejl**. Valda revisioners sidor slås ihop till **en PDF** i listordning, utan ritningssidor eller dörrkort. Varje automatik behåller sitt ID och ifyllda kontrollpunkter.

## Faktisk e-postfunktion
När Web Share stöder PDF-filer får teknikern telefonens/iPadens delningsmeny och väljer Mail själv. Web Share kan inte garantera att mottagaradress blir automatiskt ifylld; mottagaren ska kontrolleras. På desktop där fildelning inte stöds laddas PDF ner och ett mailto-utkast öppnas, där användaren själv måste bifoga filen. Appen skickar inte mejl automatiskt.

## Isolering
Version v36.16 är separat och behåller v36.15 oförändrad. Nytt separat `smartmatch-protocol-export-v36-16.js` hanterar export och förhandsgranskning. Endast en bridge-metod i projektmodulen exponerar befintliga protokollgeneratorn. Kontrollflöde och ordinarie iOS-app ändras inte.

## Test
1. Öppna testlänken, verifiera TEST v36.16.
2. DA-lista -> position -> Revision -> skriv anmärkning -> Förhandsgranska, Spara lokalt, Skicka mejl.
3. Skicka protokoll -> välj tre automatiker -> Förhandsgranska -> bläddra samtliga sidor -> Spara lokalt som en PDF.
4. Testa fildelning på iPhone/iPad och nedladdning + mejlutkast på datorn. Faktiskt kundutskick kräver eget godkännande.
