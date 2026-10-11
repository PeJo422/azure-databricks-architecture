# Film: All data under samma tak

En animerad film på 1 min 38 s om vad målarkitekturen är och vad den ger, med musik och ljudeffekter. Den går från två rapporter med olika svar, genom plattformen (Azure Data Factory, Databricks, dbt (data build tool), Fabric) till en siffra per nyckeltal, platschefens morgonlista, frågor på svenska och AI (artificiell intelligens) i fyra steg.

| Fil | Innehåll |
| --- | --- |
| [`index.html`](index.html) | Filmen som en sida med spelare, tidslinje och kapitel. Öppnas i en webbläsare och läser `soundtrack.mp3` från samma mapp |
| [`soundtrack.mp3`](soundtrack.mp3) | Ljudspåret: musik och ljudeffekter |
| [`all-data-under-samma-tak.mp4`](all-data-under-samma-tak.mp4) | Filmen som video med ljud, 1920 x 1080, 30 bildrutor per sekund |
| [`src/film.js`](src/film.js) | Scenerna. Varje bildruta ritas som en funktion av tiden, så filmen går att söka i och rendera bildruta för bildruta |
| [`src/page.html`](src/page.html) | Sidan runt filmen: spelare, kontroller och kapitel |
| [`src/build.py`](src/build.py) | Bygger `index.html` av sidan, scenerna och typsnitten |
| [`src/frames.js`](src/frames.js) | Renderar enstaka bildrutor eller hela filmen som en ström av PNG-bilder |
| [`src/audio/audio.py`](src/audio/audio.py) | Syntetiserar musik och ljudeffekter och mixar ljudspåret |

## Tempo och klipp

Musiken går i 100 slag per minut. Ett slag är 0,6 s och en takt 2,4 s. Scenerna i `src/film.js` börjar på taktslag, och korten på bandet passerar testporten på varje slag. Ändras en scens längd behöver den vara en multipel av 0,6 s, och tiderna i `src/audio/audio.py` (`T`) ändras till samma värden.

## Ändra och bygga om

Texter, tider och siffror i bilden ligger i `src/film.js`. Tidslinjen är listan `S` längst ned i filen, med en rad per scen och längd i sekunder.

```bash
cd film
npm install          # typsnitt och Playwright
npm run build        # skriver index.html
npm run audio        # skriver soundtrack.wav och soundtrack.mp3, kräver numpy, scipy och ffmpeg
npm run video        # renderar bilden och lägger på ljudet, kräver ffmpeg och Playwrights Chromium
```

## Innehåll och licenser

Bilar, priser, anläggningar och siffror i filmen är exempel. Lager, flöde, miljöer, kvartal och AI-steg följer [`malarkitektur.md`](../malarkitektur.md), [`datamodellering.md`](../datamodellering.md), [`migreringsplan.md`](../migreringsplan.md) och [`dataplan-2027.md`](../dataplan-2027.md).

Musik och ljudeffekter är syntetiserade i `audio.py` och innehåller inga inspelningar eller samplingar. Typsnitten Schibsted Grotesk och JetBrains Mono ligger inbäddade i `index.html` och har licensen SIL Open Font License.
