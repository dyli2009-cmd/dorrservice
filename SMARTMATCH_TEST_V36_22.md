# SmartMatch TEST v36.22 – direkt färgstatus och säker omstart

- **Direkt grå/grön/röd** med procent på rätt rad under DA · Egenkontroller när en kontrollpunkt ändras. Listan byggs inte om vid varje tryck; checklistans egen färgade statusrad ändras också utan refresh.
- Markering på ritningen visar samma färgstatus.
- 100 % med anmärkning är röd tills anmärkningen ändras till klart utan anmärkning.
- Sidan ↻ Uppdatera använder nu lokal IndexedDB-cache av senast öppnade PDF och sessionStorage-vyn; efter sidomladdning öppnas samma PDF och läser senast sparade egenkontroller, ritningssida, zoom och valfri öppen checklista.
- Även vanliga Safari-reloads återöppnar den aktiva PDF:en när browser storage finns. Vid blockerad lagring ritar knappen om befintlig vy i stället för att tappa arbetsfilen.
- Ingen fil skickas till servern. Lokal PDF-cache kan raderas via webbläsarens webbplatsdata. Stor PDF kan överskrida lagringskvot.
- Originalets nya PDF-import-regler behålls; vid återställning används i stället senaste lokalt sparade checklistor.
- DA-sökmotor, GS-länk, PDF-export, Kontrollflöde, iOS/TestFlight oförändrade.