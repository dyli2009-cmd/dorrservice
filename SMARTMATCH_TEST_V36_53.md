# SmartMatch TEST v36.53 – Radera lokal historik för Dropbox-tester

**Datum:** 2026-10-11. **Enbart SmartMatch TEST**. Ordinarie Tillsyno, Kontrollflöde, iOS/TestFlight, GS-matchningen och PDF-exporten är inte modifierade. v36.52 och äldre versionerade filer finns kvar.

## Användarens önskan

Teknikern vill testa om SmartMatch minns ett projekt när det har stängts och öppnats igen, samt kunna ta bort den lokalt sparade historiken för att kontrollera att det som överlever verkligen kommer från projekt-PDF:en, i synnerhet vid samarbete via Dropbox med 2–3 personer.

## Nya knappar på startsidan

- Varje post under **Lokalt sparade projekt** har en stor klickyta för att **öppna** samt en separat, kompakt **Radera**-knapp. Radera öppnar aldrig projektet av misstag.
- **Radera alla** i rubrikraden tar bort alla lokala projektarkiv, även om flera skulle finnas, och inte enbart de senaste tio. Samtliga arkiv kan listas genom att rulla.
- iOS/Safari får en vanlig bekräftelsedialog innan något tas bort.
- Efter radering uppdateras listan och antalet lokala projekt utan siduppdatering. Om listan blir tom döljs den.
- Enbart SmartMatchs lokala IndexedDB-nycklar `files['project:<hash>']` och deras associerade `drafts[hash]` raderas, i samma IndexedDB-transaktion. Övriga lagringsposter såsom `files['active']`, andra opåverkade utkast och appens egna arbetstidsinställningar ligger kvar.
- Radering nekas om en ritning fortfarande är öppen – användaren måste först välja **Stäng ritning**.
- Inga data raderas i Dropbox, Filer eller annan extern tjänst. Webbläsarens lokala arkiv har ingen direkt Dropbox-koppling.
- **Stäng ritning** fortsätter att försöka skapa en ny lokal säkerhetskopia efter nästa arbetspass. Radera-knappen är ett frivilligt sätt att tömma sparad historik, inte ett permanent avstängt autosparande.

## Versionsfiler

- `project-workspace-smartmatch-v36-53.html`
- `project-workspace-smartmatch-v36-53.css`
- `project-workspace-smartmatch-v36-53.js`
- `smartmatch-session-v36-53.js` (separat testversion av lokal IndexedDB-modul)
- Fasta TEST-URL: `project-workspace-smartmatch-test.html` innehåller identisk HTML till v36.53.

## Vad testerna betyder

Scenario A, **lokal återställning**: Öppna PDF i TEST → markera en kontrollpunkt → Stäng ritning → öppna samma projekt i startsidans lokala lista. Markeringen ska finnas eftersom enheten har bevarat arbetskopian.

Scenario B, **faktisk PDF-portabilitet**: Öppna PDF → markera → Spara fil/Projekt-PDF till Dropbox → Stäng ritning → Radera i listan → öppna det sparade projekt-PDF:et från Dropbox på nytt. Markeringarna ska återfinnas **endast om** de faktiskt följer med projekt-PDF:en.

Scenario C, **osparat arbete**: Öppna en PDF utan inbäddad projektstatus → markera → Stäng ritning → Radera lokalt projekt → öppna den gamla, oförändrade PDF-filen från Dropbox. Den osparade markeringen ska då normalt **inte** finnas, eftersom den aldrig skrevs till PDF:en.

**VIKTIGT för 2–3 användare på samma PDF i Dropbox:** SmartMatch v36.53 innehåller inte synkronisering i realtid, konfliktdetektering, versionslåsning eller säker sammanslagning av oberoende kontrollpunktsändringar. Om två användare öppnar samma PDF och båda sparar filen från olika enheter kan den sist sparade kopian skriva över den andres ändringar. Dropbox fillagring i sig innebär inte simultan samredigering av PDF-innehåll. Planera senare en separat, säker flerenhetsmodell med versionsidentitet, explicit användare, konfliktvarning eller uppdelade arbetsprotokoll innan skarp fleranvändardrift.

## Test och kvarstående QA

- Både nya JS-filer har godkänd syntax.
- HTML-version, script-referenser och unika DOM-id:n kontrollerade. v36.52-fixen för `pmCancel` och mobilprotokollets dolda dialog finns kvar.
- Simulerad IndexedDB med två arkiv `alpha` och `beta`, associerade utkast, en aktiv PDF och orelaterade nycklar: enskild radering tog bort bara alpha; radera alla tog därefter bort beta; aktiv PDF och orelaterade poster förblev kvar.
- Verifierat att metoderna nekar radering när en PDF är öppen.
- **Ej ännu provat med riktig iPhone, Safari, Dropbox eller samtidig fleranvändaråtkomst.**
