# Egna koder och protokoll i Projektflöde

Tillagt i version 2.4.260. Funktionen ligger separat i `project-custom-protocols.js` och `project-custom-protocols.css`. Den används av både den vanliga och den licensierade Projektflöde-sidan. Kontrollflöde och dess befintliga protokoll ändras inte.

## Användning

1. Öppna Egna protokoll, före eller efter att projekt-PDF:en valts.
2. Lägg till en mall med kod/nummer, protokollnamn och kontrollpunkter (en per rad).
3. Välj kodfamilj för exempelvis GZ-01/GZ-02, eller exakt kod för exempelvis 14-18.
4. Läs PDF:en på alla, aktuella eller valda sidor. Granska och välj träffarna innan protokollen skapas.
5. Klicka på markeringen i ritningen eller på objektet i listan för att fylla i protokollet. Varje position har egen arbetsstatus.
6. Spara projekt för att få med mallar och protokoll i projekt-PDF:en. Spara protokoll PDF ger ett läsbart separat kontrollprotokoll.

## Sparande och offline

Mallbiblioteket sparas lokalt. Projektets egna mallar och protokoll ligger även i `customProtocols` under den befintliga PDF-postens `TillsynoProjectData`. En sparad projekt-PDF kan därför öppnas på en ny enhet. Malländringar påverkar nya protokoll; redan skapade protokoll behåller sina egna punkter, som kan ändras separat.

Appfilerna måste hämtas med internet en gång, tills statusen säger Redo för offline. Därefter kan en lokal PDF väljas, läsas och arbetas med utan internet. PDF-läsningen och kodmatchningen sker på enheten. Skannade bilder utan PDF-text behöver textigenkänning och stöds inte av denna läsfunktion.

Exakta kodgränser används för att exempelvis GZ-01 inte ska matcha XGZ-01 och 14-18 inte ska matcha 114-18. När PDF-text är uppdelad i närliggande fragment på samma rad kan fragmenten läsas tillsammans. Träffarnas läge beräknas från PDF-textens koordinater och ska granskas av användaren. Återläsning skapar inte nya kopior av redan skapade positioner.

## Verifiering

`tests/project-custom-protocols.cjs` kontrollerar dator och mobil, exakta koder/kodfamiljer, delad PDF-text, val av sidor, granskning före skapande, klickbara markeringar, separata protokollstatusar, PDF-export, portabel projektstatus, återöppning och nya PDF-träffar helt offline, samt import på en ny enhet.
