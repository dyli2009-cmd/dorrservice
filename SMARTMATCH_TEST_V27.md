# SmartMatch TEST v27 – Automatisk våningsrubrik från ritningsstämpeln

Testlänk: https://dyli2009-cmd.github.io/tillsyno/project-workspace-smartmatch-test.html

## Ny funktion
- Appen läser automatiskt befintlig PDF-text på varje ritningssida och prioriterar ritningsstämpeln **nere till höger**. Grupperar PDF-textfragment till rader och analyserar deras koordinater i visningsorienteringen.
- Identifierar bland annat PLAN 0, PLAN 1, PLAN 2, PLAN -1, VÅNING 3, KÄLLARE, KÄLLARPLAN, ENTRÉPLAN, MARKPLAN, FÖRRÅD, UTERUM och GARAGE. Den faktiska originaltexten behålls (exempel PLAN -1 är inte PLAN 1).
- En liten statisk etikett visas i övre projektraden bredvid PDF-filnamnet. Byter sida => etiketten uppdateras direkt, oberoende av ritningens zoom/scroll och fördröjd stora-PDF-rendering.
- Etiketten döljs om det saknas en säker avläst våning/områdesbeteckning. Dörrkortssidor lämnas omärkta. Befintlig sidvisare 'Sida X / Y' och alla andra kontroller fungerar som tidigare.
- All läsning görs på PDF-text i webbläsaren, ingen automatisk OCR eller internetuppladdning. Om titeln bara finns som bild/inscannad stämpel kommer etiketten inte att visas, snarare än att gissa. OCR skulle kunna vara en separat framtida förbättring.
- Den befintliga SmartMatch-kodsökningen, skanning av dörrkort, sparning och kompakta PDF-exporten påverkas inte.

## Kontroll
- Tester av PLAN 0/1/2/-1, VÅNING 3, KÄLLARE, ENTRÉPLAN, FÖRRÅD, UTERUM, samt att en text som 'FÖRRÅD' i ritningens mitt inte felaktigt blir sidans namn.
- Test av sidbyte mellan etiketter, att en okänd sida får dold etikett, och kontroll av JS-syntax, HTML-ID, CSS och oförändrad tidigare TEST v26.
- Kräver praktisk kontroll på PDF:er med olika ritningsstämplar och på iPhone/iPad. Ingen garanti för bildbaserade inskanningar.
