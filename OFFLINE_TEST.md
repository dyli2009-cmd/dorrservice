# Tillsyno v2.4.253 – första offlinetestet

Testa arbetsappen på https://dyli2009-cmd.github.io/tillsyno/. Detta test gäller lokal ritning, protokoll, återöppning och PDF-export. Floots inloggning och uppdatering av företagsbehörigheter kräver fortfarande internet; detta är inte en ny licensmodell för långvarig offlineåtkomst.

1. Öppna Tillsyno med internet och lägg appen på hemskärmen. På iPhone: Safari → Dela → Lägg till på hemskärmen. På Android: använd webbläsarens Installera app/Lägg till på startskärmen.
2. Öppna den nya ikonen med internet kvar. Vänta på **Redo för offline** i appen. Förbered också hemskärmsappen, även om webbläsarfliken redan var förberedd.
3. Öppna Kontrollflöde, välj protokoll och öppna en lokal PDF. Lägg till ett objekt och fyll i en kontrollpunkt.
4. Slå på flygplansläge och kontrollera att även Wi-Fi är avstängt. Stäng appen och öppna den igen från ikonen.
5. Öppna Kontrollflöde och välj **Fortsätt med sparad ritning**. Kontrollera att objekt och resultat finns kvar. Fortsätt arbeta och prova **Spara PDF**.

Appfiler och PDF-bibliotek lagras av service workern. Varje HTML-sida har sin egen cachepost; versionsparametrar påverkar inte offlineåteröppning. Ritningens bytes lagras i IndexedDB och arbetsuppgifterna i befintlig lokal lagring per ritning. Förberedelsestatus visas först när alla nödvändiga filer är hämtade.

Arbetet finns på den här enheten och synkas inte till Floot. Exportera arbets-PDF för överföring eller en separat kopia. Radering av webbplatsdata tar också bort de lokala arbetsuppgifterna. Test i Chromium ersätter inte test på fysisk telefon.

## Automatiskt test

`CHROMIUM_PATH=/path/to/chromium node tests/offline.cjs` kräver Playwright. Det kör en lokal HTTP-server och en riktig service worker, stänger av nätverket och kontrollerar mobil navigation, lagring/återöppning av ritning och kontrollpunkter samt riktig PDF-export. PDF-biblioteken finns i `vendor/`.
