# Dataplan 2027: från rapporter till beslut

## Om dokumentet

Dokumentet beskriver vad dataplattformen ska användas till när målarkitekturen ([`malarkitektur.md`](malarkitektur.md)) är på plats. Det är ett förslag till ledningen. Det tar upp vilka frågor koncernen ska kunna besvara, vilka beslut svaren ska leda till, hur AI (artificiell intelligens) och självbetjäning används och i vilken ordning arbetet görs under 2027.

Planen är skriven för en bilhandelskoncern med flera bolag och affärsområdena nybil, begagnat, finansiering, verkstad, delar och däck. Den kan användas som mall och anpassas efter hur den egna koncernen är organiserad.

## Förutsättningar

Planen ger effekt när följande är på plats. Varje punkt är en leverans i färdplanen.

- Nyckeltal har samma definition i alla bolag och alla verktyg.
- Konton från bolagens bokföring mappas till en gemensam rapportstruktur, så att resultat kan jämföras mellan bolag.
- Kunddata från CRM (Customer relationship management)-systemet finns i dataplattformen, så att kundens hela affär med koncernen kan följas.
- Ett fordon kan följas från försäljning till verkstad genom att registreringsnummer och VIN (Vehicle identification number, chassinummer) kopplas ihop.
- AI (artificiell intelligens) används för frågor som verksamheten redan vill ha svar på, och bara på data som är testad.

## Vad 2027 ska leverera

1. **Fyra beslutsområden i drift:** lagerbilar, försäljning, eftermarknad och finans, med nyckeltal som ledning och bolagschefer använder i sina ordinarie möten.
2. **En siffra per nyckeltal:** samma definition av till exempel ståtid, bruttovinst per bil och beläggning i verkstaden i alla bolag och alla verktyg.
3. **Prognoser där de betalar sig:** först ståtid och prisförslag för begagnade bilar, sedan kunder som riskerar att lämna verkstaden.
4. **Självbetjäning med kontroll:** chefer och controllers ställer frågor i vanlig svenska till godkända datamodeller, i Power BI (Business intelligence) med Copilot och i pilot med Databricks Genie och Claude.

## Så prioriteras områdena

Ett område prioriteras efter hur mycket pengar besluten rör, hur ofta beslutet fattas och hur mycket som behöver byggas innan området ger svar. Lagerbilar kommer först eftersom varje bil binder kapital varje dag den står, prisbeslut fattas dagligen och området bygger på lager- och försäljningsdata som varje bilhandlare har.

Varje område byggs hela vägen från källa till beslut innan nästa påbörjas. Fyra halvfärdiga områden ger ingen effekt. Ett färdigt område ger ett resultat som går att visa och mäta.

| Område | Belopp som påverkas | Hur ofta beslut fattas | Bygger på | Ordning |
| --- | --- | --- | --- | --- |
| Lagerbilar | Kapitalbindning och räntekostnad i hela bilagret | Dagligen | Lager- och försäljningsdata | 1 |
| Finans | Hela koncernens resultat | Månadsvis | Gemensam kontomappning | 2 |
| Försäljning | Bruttovinst per affär, finansiering och tillbehör | Dagligen | Affärs- och försäljningsdata | 3 |
| Eftermarknad | Verkstadens och delarnas marginal, kundlojalitet | Veckovis | Koppling av fordon mellan försäljning och verkstad | 4 |
| Kund tvärs över bolagen | Kundens livstidsvärde | Kvartalsvis | CRM (Customer relationship management)-data och en gemensam kunddimension | 5 |

## Värdeområden

### 1. Lagerbilar

Bilar i lager kostar ränta, tappar i värde och tar plats. Ett par veckors kortare genomsnittlig ståtid frigör kapital i hela koncernen.

**Frågor som ska kunna besvaras**

- Hur länge har varje bil stått, och vad har den kostat i ränta och värdeminskning hittills?
- Vilka bilar har passerat 60 och 90 dagar, per anläggning och bolag?
- Vilka modeller, årsmodeller och drivlinor säljer snabbast, och var?
- Hur ofta sänks priset innan en bil säljs, och hur mycket?
- Står en bil som säljer snabbt på en annan ort i ett annat bolag?
- Hur träffsäker var värderingen vid inbyte jämfört med slutpriset?

**Beslut som svaren leder till**

- Sänka priset tidigare på bilar som riskerar att bli stående.
- Flytta bilar mellan anläggningar och bolag dit efterfrågan finns.
- Ändra inköp och inbytesvärdering för modeller som står länge.
- Sätta mål för ståtid per anläggning och följa upp dem varje vecka.

**Steget längre med AI (artificiell intelligens)**

- En prognosmodell som för varje bil räknar sannolikheten att den säljs inom 30 dagar till nuvarande pris.
- Ett prisförslag per bil baserat på egen försäljningshistorik och marknadspris.
- En daglig lista till varje platschef med de bilar som behöver åtgärdas och varför.

**Mått på värde:** genomsnittlig ståtid, andel bilar över 90 dagar, räntekostnad för lagret och bruttovinst per såld begagnad bil, jämfört med utgångsläget i januari 2027.

### 2. Finans

Utan en gemensam resultaträkning går det inte att jämföra bolag och anläggningar på samma villkor.

**Frågor som ska kunna besvaras**

- Vad är resultatet per bolag, anläggning och affärsområde (nybil, begagnat, verkstad, delar, däck), med samma kontostruktur i alla bolag?
- Vilka anläggningar tjänar pengar på varje affärsområde, och vilka bär sig på ett annat?
- Hur stor är kapitalbindningen i bil- och dellager, och hur utvecklas den mot budget?
- Hur stämmer utfall mot prognos, och hur tidigt syns avvikelsen?

**Beslut som svaren leder till**

- Omfördela resurser mellan anläggningar och affärsområden.
- Ändra budget och prognos under året på faktiska siffror.
- Identifiera anläggningar som behöver en åtgärdsplan.

**Steget längre med AI (artificiell intelligens)**

- En prognos för månadsresultat per bolag som uppdateras dagligen när affärer bokas.
- Automatisk avvikelseanalys som förklarar vilka konton och anläggningar som driver en avvikelse.

**Förutsättning:** en gemensam kontomappning som ekonomi äger och som går genom referensdataflödet ([`referensdata-flode.svg`](referensdata-flode.svg)), så att en felaktig mappning stoppas i test innan den når rapporterna.

### 3. Försäljning

**Frågor som ska kunna besvaras**

- Vad är bruttovinsten per affär när bil, finansiering, försäkring, tillbehör och serviceavtal räknas ihop?
- Hur stor andel av affärerna har finansiering eller serviceavtal, per säljare och anläggning?
- Hur många förfrågningar blir provkörningar, offerter och affärer, och var tappas kunderna?
- Vilka kampanjer gav affärer, och vad kostade varje affär?

**Beslut som svaren leder till**

- Styra säljarnas fokus mot de tilläggsprodukter som ger mest marginal.
- Flytta marknadsbudget till de kanaler som ger affärer.
- Coacha säljare utifrån var i processen deras affärer tappas.

**Steget längre med AI (artificiell intelligens)**

- Poängsättning av förfrågningar efter sannolikhet att bli affär, så att säljarna ringer rätt kund först.
- Förslag på tilläggsprodukter per kund baserat på liknande affärer.

### 4. Eftermarknad: verkstad, delar och däck

Eftermarknaden har ofta högre och stabilare marginal än bilförsäljningen. Varje bil som säljs är en möjlig verkstadskund i många år.

**Frågor som ska kunna besvaras**

- Vad är beläggningen och debiteringsgraden per verkstad, och hur skiljer sig sålda timmar mot närvarotid?
- Hur många av kunderna som köpt bil hos koncernen kommer tillbaka på service, och hur många försvinner efter garantitiden?
- Hur omsätts dellagret, och vilka delar ligger utan att säljas?
- Hur många däckhotellskunder bokar skifte i tid, och hur många missas?

**Beslut som svaren leder till**

- Bemanna verkstäderna efter förväntad beläggning.
- Rikta kallelser till kunder som riskerar att gå till en annan verkstad.
- Minska dellager som inte omsätts och flytta delar mellan bolag.

**Steget längre med AI (artificiell intelligens)**

- En modell som pekar ut fordon som sannolikt inte kommer tillbaka på nästa service, så att kundtjänsten kan ringa innan kunden har valt en annan verkstad.
- Prognos för beläggning per vecka som underlag för bemanning.

**Förutsättning:** en fordonsdimension där registreringsnummer och VIN (Vehicle identification number, chassinummer) kopplas ihop, så att samma bil kan följas från försäljning till verkstad.

### 5. Kunden tvärs över bolagen

**Frågor som ska kunna besvaras**

- Vad är en kunds samlade värde för koncernen över bilköp, finansiering, service och däck?
- Hur många kunder handlar hos mer än ett bolag eller en anläggning?
- När köper en kund sin nästa bil, och köper hen den hos koncernen?

**Beslut som svaren leder till**

- Kontakta kunder vid rätt tidpunkt inför nästa bilbyte.
- Prioritera kundgrupper med högst livstidsvärde i marknadsföringen.

**Förutsättning:** CRM (Customer relationship management)-data i plattformen och en konformerad kunddimension över källsystemen. Området kommer sist eftersom det bygger på de tidigare.

## AI (artificiell intelligens) i fyra steg

| Steg | Frågan som besvaras | Exempel | När 2027 |
| --- | --- | --- | --- |
| Beskrivande | Vad hände? | Ståtid per anläggning förra månaden | Kvartal 1 |
| Förklarande | Varför hände det? | Vilka modeller och anläggningar driver ståtiden | Kvartal 2 |
| Förutsägande | Vad kommer att hända? | Sannolikhet att bilen säljs inom 30 dagar | Kvartal 3 |
| Föreslående | Vad bör göras? | Prisförslag och daglig åtgärdslista till platschefen | Kvartal 4 |

Varje steg bygger på det föregående. En prognosmodell som tränas på data med fel ståtid ger fel prisförslag med hög säkerhet, därför testas datan i dbt (data build tool) innan den används för modeller.

Prognosmodellerna byggs och körs i Databricks, där datan redan finns. Resultatet skrivs tillbaka som tabeller och visas i samma rapporter som övriga nyckeltal, så att användarna inte behöver ett nytt verktyg.

## Självbetjäning: egna frågor och egna dashboards

Chefer och controllers ska kunna ställa egna frågor utan att vänta på BI (Business intelligence)-teamet. Tre verktyg täcker olika behov.

| Verktyg | För vem | Bra för | Krav |
| --- | --- | --- | --- |
| **Copilot i Power BI (Business intelligence)** | Ledning, bolagschefer, controllers | Frågor på svenska mot godkända semantiska modeller, sammanfattningar av rapporter | Fabric-kapacitet F2 eller större. Modellerna förbereds med AI (artificiell intelligens)-instruktioner, verifierade svar och ett urval av fält, och markeras som godkända för Copilot |
| **Databricks Genie** | Analytiker och controllers | Utforskande frågor direkt mot de färdiga tabellerna i Unity Catalog, med samma behörigheter som i övrigt | Ett Genie-utrymme per område med beskrivningar och exempelfrågor. Användning är kostnadsfri till och med 31 januari 2027 och debiteras därefter per användning |
| **Claude Dashboards** | Analytiker och verksamhetsutvecklare | Snabba dashboards från en fråga i vanlig text. Varje diagram visar sin SQL (Structured query language)-fråga, så siffran går att granska | Claude Team eller Enterprise, funktionen är i beta och slås på av administratören. Databricks kopplas som datakälla med användarens egen inloggning |

### Regler för självbetjäningen

- **En definition per nyckeltal.** Nyckeltalen definieras i de semantiska modellerna i Power BI (Business intelligence), som är den officiella källan. Genie och Claude läser samma färdiga tabeller och ska ge samma svar, men räknas som utforskande verktyg tills definitionerna har kontrollerats mot den semantiska modellen.
- **Bara godkända data.** AI (artificiell intelligens)-verktygen får bara läsa schemat `marts`, där datan är testad. Rådata och mellansteg är inte åtkomliga.
- **Personuppgifter skyddas.** Kunddata med personuppgifter exponeras inte för AI (artificiell intelligens)-verktyg förrän behörigheter och avtal är granskade.
- **Det som används ofta blir officiellt.** En dashboard som många använder flyttas in i en certifierad rapport i Power BI (Business intelligence), med ägare och tester.

Självbetjäning kräver datakvalitet. Copilot svarar säkert även när datan under är fel, och en chef som får två olika siffror för samma fråga slutar lita på båda.

## Färdplan 2027

| Kvartal | Leverans | Synligt resultat för ledningen |
| --- | --- | --- |
| **Kvartal 1** | Plattformen i drift i produktion. Lagerbilar byggt från källa till rapport för ett pilotbolag. Katalog över nyckeltal med definitioner. Referensdataflödet i drift. Copilot på en godkänd semantisk modell | Daglig ståtidsrapport för pilotbolaget med räntekostnad per bil |
| **Kvartal 2** | Lagerbilar för alla bolag. Gemensam kontomappning och resultaträkning för koncernen. Genie-pilot för controllers | Ståtid och resultat jämförbart mellan alla bolag |
| **Kvartal 3** | Försäljning och eftermarknad. Koppling mellan registreringsnummer och VIN (Vehicle identification number, chassinummer). Kunddata från CRM (Customer relationship management) ansluten till plattformen. Prognos för ståtid i drift. Pilot med Claude Dashboards | Varje platschef får en daglig lista över bilar som behöver åtgärdas |
| **Kvartal 4** | Prisförslag per bil. Modell för kunder som riskerar att lämna verkstaden. Kunddimension tvärs över bolagen. Utvärdering av året | Mätt effekt på ståtid och servicelojalitet jämfört med januari 2027 |

## Beslut som ledningen behöver fatta

1. **Godkänna målarkitekturen** (alternativ C), så att plattformen kan byggas under kvartal 4 2026.
2. **Godkänna prioriteringsordningen** med lagerbilar först.
3. **Utse en dataägare per område** i verksamheten: en person som äger definitionerna, godkänner referensdata och använder resultatet. Utan ägare blir det rapporter som ingen använder.
4. **Välja pilotbolag** för lagerbilar.
5. **Fastställa definitionerna av de första nyckeltalen**, till exempel från vilket datum ståtid räknas och vad som ingår i bruttovinst per bil.
6. **Besluta om åtkomst och ägarskap för kunddata** från CRM (Customer relationship management) i plattformen.
7. **Budget för licenser:** Fabric-kapacitet för Copilot, Genie efter 31 januari 2027 och Claude Team eller Enterprise för piloten.

## Risker och hur de hanteras

| Risk | Följd | Hantering |
| --- | --- | --- |
| Datan är fel eller ofullständig | AI (artificiell intelligens) och rapporter ger fel svar med hög säkerhet | Tester i dbt (data build tool) på alla tabeller som når `marts`. Referensdata testas innan de når produktion |
| Ingen äger resultatet | Rapporterna byggs men används inte | Dataägare utses innan ett område byggs. Varje område har ett mått på effekt |
| Olika siffror i olika verktyg | Förtroendet för datan går förlorat | En definition per nyckeltal i de semantiska modellerna. Genie och Claude märks som utforskande |
| Licenskostnaden växer | Kostnaden blir större än effekten | Piloter med en begränsad grupp. Förbrukningen mäts i Capacity Metrics och i Databricks systemtabeller |
| Personuppgifter i AI (artificiell intelligens)-verktyg | Brott mot GDPR (General data protection regulation) | Behörigheter i Unity Catalog, inga personuppgifter i `marts` för AI (artificiell intelligens)-verktyg utan granskning |
| Funktioner i beta eller förhandsversion ändras | En pilot måste göras om | Claude Dashboards och delar av Genie används i pilot och inte för officiell rapportering |

## Ordlista

| Begrepp | Förklaring |
| --- | --- |
| AI (artificiell intelligens) | Datorprogram som tolkar frågor, hittar mönster eller gör prognoser utifrån data. |
| BI (Business intelligence) | Rapporter och analyser som beskriver verksamheten, till exempel i Power BI. |
| CRM (Customer relationship management) | System för kundkontakter, förfrågningar och kampanjer. |
| Copilot | Microsofts AI (artificiell intelligens)-assistent i Power BI som svarar på frågor om data i vanlig text. |
| Claude Dashboards | En funktion i Claude som bygger dashboards från en fråga i vanlig text och visar frågan bakom varje diagram. |
| Dataägare | Person i verksamheten som ansvarar för att data och definitioner inom ett område är rätt. |
| dbt (data build tool) | Verktyget som bygger och testar tabellerna i dataplattformen. |
| Genie | Databricks funktion för frågor i vanlig text mot data i plattformen. |
| GDPR (General data protection regulation) | EU:s dataskyddsförordning för personuppgifter. |
| Nyckeltal | Ett mått med fast definition, till exempel ståtid eller beläggning. |
| Prognosmodell | En modell som uppskattar vad som kommer att hända, till exempel om en bil säljs inom 30 dagar. |
| Semantisk modell | Lagret i Power BI där tabeller, relationer och beräkningar av nyckeltal är definierade. |
| SQL (Structured query language) | Språket som används för att hämta data ur databaser. |
| Ståtid | Antal dagar en bil har stått i lager. |
| VIN (Vehicle identification number) | Fordonets unika chassinummer. |

## Källor

- [Get started with Claude Dashboards](https://support.claude.com/en/articles/17454700-get-started-with-claude-dashboards) (Claude Help Center)
- [AI/BI and Genie One release notes 2026](https://learn.microsoft.com/en-us/Azure/databricks/ai-bi/release-notes/2026) (Microsoft Learn)
- [Connect MCPs to AI assistants and coding agents](https://docs.databricks.com/aws/en/agents/mcp/connect-clients) (Databricks)
- [How to connect Claude to Databricks managed MCP servers](https://interworks.com/blog/2026/06/10/how-to-connect-claude-to-databricks-managed-mcp-servers/) (InterWorks)
- [Power BI Copilot review 2026: features, requirements and limitations](https://diyai.io/ai-tools/data-analytics/reviews/power-bi-copilot-review/) (DIY AI)

Kraven på Fabric-kapacitet för Copilot och priset för Genie efter 31 januari 2027 bör kontrolleras mot Microsofts och Databricks aktuella dokumentation innan budgeten fastställs.
