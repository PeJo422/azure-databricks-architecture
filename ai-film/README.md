# Klipp: Fråga datan själv

Ett animerat klipp på 45,6 s om vad Claude Dashboards och Copilot i Power BI (Business intelligence) kan göra mot testad data i dataplattformen, med musik och ljudeffekter. Det hör ihop med filmen i [`film/`](../film/) och har samma stil och tempo, men går att visa för sig.

| Del | Tid | Innehåll |
| --- | --- | --- |
| Intro | 0–2,4 s | Fråga datan själv |
| Claude Dashboards | 2,4–21,6 s | En fråga i chatten blir en dashboard med fem diagram. Ett diagram visar sin SQL (Structured query language)-fråga mot `marts` och när datan senast hämtades. En följdfråga ritar om ett diagram |
| Copilot i Power BI | 21,6–40,8 s | En fråga på engelska besvaras som diagram, tabell eller DAX (Data analysis expressions). Copilot visar vilka fält, mått och filter svaret bygger på. Ett godkänt svar läggs till på rapportsidan |
| Avslut | 40,8–45,6 s | Båda verktygen läser samma testade data i `marts`. Claude Dashboards är för att utforska, den semantiska modellen i Power BI har de officiella måtten |

## Filer

| Fil | Innehåll |
| --- | --- |
| [`index.html`](index.html) | Klippet som en sida med spelare, tidslinje och kapitel. Öppnas i en webbläsare och läser `soundtrack.mp3` från samma mapp |
| [`soundtrack.mp3`](soundtrack.mp3) | Ljudspåret: musik och ljudeffekter |
| [`fraga-datan-sjalv.mp4`](fraga-datan-sjalv.mp4) | Klippet som video med ljud, 1920 x 1080, 30 bildrutor per sekund |
| [`src/klipp.js`](src/klipp.js) | Scenerna |
| [`src/core.js`](src/core.js) | Färger, typsnitt, ritprimitiver och tidslinje. Varje bildruta ritas som en funktion av tiden |
| [`src/page.html`](src/page.html) | Sidan runt klippet: spelare, kontroller och kapitel |
| [`src/build.py`](src/build.py) | Bygger `index.html` av sidan, kärnan, scenerna och typsnitten |
| [`src/frames.js`](src/frames.js) | Renderar enstaka bildrutor eller hela klippet som en ström av PNG-bilder |
| [`src/audio/klipp_audio.py`](src/audio/klipp_audio.py) | Arrangemang och ljudeffekter för klippet, 19 takter |
| [`src/audio/ljud.py`](src/audio/ljud.py) | Instrument, effekter och mixverktyg |

Mappen är fristående från `film/`. `core.js`, `page.html`, `frames.js` och instrumenten i `ljud.py` är kopior av det som filmen använder, så en ändring i den ena mappen följer inte med till den andra.

## Det klippet bygger på

Klippet visar bara sådant som leverantörernas dokumentation beskriver. Sidorna lästes den 11 oktober 2026.

- **Claude Dashboards** skriver en SQL-fråga per diagram och kör den mot datakällan, bland annat Databricks. Varje diagram visar sin fråga och när datan senast hämtades. Funktionen är i beta och beskrivs som ett verktyg för snabba, utforskande frågor ([Claude Help Center](https://support.claude.com/en/articles/17454700-get-started-with-claude-dashboards)).
- **Copilot i Power BI** svarar på datafrågor mot den semantiska modellen som diagram, tabell eller DAX-fråga och visar vilka fält, mått och filter som användes. Datafrågor stöder bara engelska, och Copilot gör inga prognoser eller avvikelseanalyser i dem ([Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-ask-data-question)).
- **Godkända svar** (verified answers) är bilder som en författare har godkänt och knutit till fraser. De sparas i den semantiska modellen och returneras i stället för ett nytt svar när frågan matchar. De returneras inte när Fabric IQ är påslaget ([Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-prepare-data-ai-verified-answers)).

Gränssnitten är ritade i filmens stil och är inga skärmbilder av produkterna. Tabellnamnet `fct_lagerbil`, måttet, klockslaget och alla siffror är exempel.

## Ändra och bygga om

Texter, tider och siffror ligger i `src/klipp.js`. Tidslinjen är anropet till `publish` längst ned i filen, med en rad per scen och längd i sekunder. Musiken går i 100 slag per minut, så en scens längd behöver vara en multipel av 0,6 s, och tiderna i `src/audio/klipp_audio.py` (`T`) ändras till samma värden.

```bash
cd ai-film
npm install          # typsnitt och Playwright
npm run build        # skriver index.html
npm run audio        # skriver soundtrack.wav och soundtrack.mp3, kräver numpy, scipy och ffmpeg
npm run video        # renderar bilden och lägger på ljudet, kräver ffmpeg och Playwrights Chromium
```

## Licenser

Musik och ljudeffekter är syntetiserade i `src/audio/` och innehåller inga inspelningar eller samplingar. Typsnitten Schibsted Grotesk och JetBrains Mono ligger inbäddade i `index.html` och har licensen SIL Open Font License.
