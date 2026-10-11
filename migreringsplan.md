# Migreringsplan: från befintliga SQL-modeller till målarkitekturen

## Om dokumentet

Dokumentet beskriver hur befintliga modeller, rapporter och dataflöden flyttas till målarkitekturen ([`malarkitektur.md`](malarkitektur.md)). Det är ett förslag som behöver godkännas av ledningen och av dataägarna. Datamodellen som migreringen bygger mot beskrivs i [`datamodellering.md`](datamodellering.md), och ordningen mellan områdena följer [`dataplan-2027.md`](dataplan-2027.md).

Planen är generell. Den gäller en befintlig dataplattform som har vuxit under lång tid, där affärslogik ligger utspridd i vyer, procedurer, dbt (data build tool)-modeller och rapporter, och där få av dem har tester.

## Utgångspunkter

1. **Ingen omstart i ett svep.** Plattformen ersätts ett område i taget. Varje område levereras hela vägen från källa till rapport innan nästa påbörjas.
2. **Affärsreglerna byggs om, koden översätts inte rad för rad.** Gammal SQL (Structured query language) beskriver hur en regel räknades ut, och inte alltid varför. Reglerna läses ut, skrivs ner, får en ägare och byggs som modeller med tester.
3. **Allt som byggs om stäms av mot facit.** Facit är utdata från de gamla rapporterna, sparade innan migreringen börjar.
4. **Det gamla stängs.** Varje område får ett slutdatum, annars lever två plattformar sida vid sida för alltid.

## Tre högar för varje objekt

Alla befintliga objekt (tabeller, vyer, procedurer, dbt (data build tool)-modeller, rapporter) sorteras i en av tre högar innan något byggs.

| Hög | Vad som hamnar där | Hantering | Märkning |
| --- | --- | --- | --- |
| **Släck** | Används inte, eller har en ersättare | Tas inte med | Listas i en avvecklingslogg |
| **Flytta** | Används, fungerar, ändras sällan och har lågt värde | Översätts mekaniskt till Databricks SQL (Structured query language). Ingen omdesign | Tagg `legacy` i dbt (data build tool), eget schema |
| **Bygg om** | Används ofta och driver beslut, eller är så trasig att ingen vågar ändra den | Byggs om från rådata enligt datamodellen med tester | Ingen. Det är den nya standarden |

Underlag för sorteringen:

- Frågeloggen i den gamla databasen visar vad som körs och av vem.
- Power BI (Business intelligence) användningsstatistik visar vilka rapporter som öppnas.
- Lineage från dbt (data build tool):s manifest visar vad som hänger ihop.
- Objekt som varken används eller har en känd ägare hamnar i Släck, med en frist för invändningar.

Hög två gäller bara objekt där omdesign inte tillför något. Dbt (data build tool)-modeller för SQL Server går inte att flytta orörda, eftersom T-SQL (Transact-SQL (Structured query language))-funktioner, temporära tabeller och frågor över flera databaser måste skrivas om även för "Flytta".

## Faser

Ordningen mellan områdena följer färdplanen i dataplanen. Faserna har ingångsvillkor och slutvillkor, och datum sätts när resurserna är bestämda.

### Fas 0: Inventering och facit

**Leverans**

- Inventering av objekt, sorterade i de tre högarna.
- Facit: nyckelrapporternas utdata per månad, sparade som tabeller.
- Regelkatalog: affärsregler utlästa ur gammal kod, med regel, källa, ägare och status.
- En dataägare per område.
- Lista över hårdkodade rättelser ("om kund X då värde Y"), som flyttas till referensdata.

**Klart när** högarna är godkända av dataägarna, facit finns för områdets rapporter och regelkatalogen är genomläst av någon i verksamheten.

### Fas 1: Plattform och rådata

**Leverans**

- Målarkitekturen skapad med Terraform i alla miljöer.
- ADF (Azure Data Factory) läser alla källor till `raw`, för alla områden på en gång. Det är mekaniskt arbete som inte kräver affärsbeslut.
- Namnstandard, testmönster och CI/CD (Continuous integration och continuous delivery) för dbt (data build tool).
- Referensdataflödet ([`referensdata-flode.svg`](referensdata-flode.svg)) i drift.

**Klart när** raw laddas dagligen, radantal i raw stämmer mot källsystemen och en ändring kan gå genom pull request, test och produktion utan manuella steg.

### Fas 2: Första området

Första området är lagerbilar enligt dataplanen. Det tar längst eftersom det skapar mallarna som resten återanvänder.

**Leverans**

- Staging för områdets källor.
- Integrationslagret för de entiteter området behöver: fordon och organisation (se datamodellen).
- Dimensioner och fakta i `marts`, med tester.
- Parallellkörning mot det gamla, med avstämning.
- Rapporterna för området flyttade, antingen via kompatibilitetsvy eller direkt mot en ny semantisk modell.

**Klart när** avstämningen är godkänd av dataägaren över minst ett månadsskifte, rapporterna läser från den nya plattformen och det gamla är satt till skrivskyddat.

### Fas 3: Resterande områden

Områdena byggs i den ordning dataplanen anger: finans, försäljning, eftermarknad och kund. Varje område följer samma mall som fas 2 och återanvänder de entiteter som redan är konformerade. Kund kommer sist eftersom det området kräver kunddata från CRM (Customer relationship management)-systemet och en granskning mot GDPR (General data protection regulation).

Entiteterna byggs vid första behov: fordon och organisation i fas 2, artikel och del i fas 3 när eftermarknaden byggs.

### Fas 4: Avveckling

**Leverans**

- Det gamla läggs i skrivskyddat läge per område vid områdets slutdatum.
- Arkivering av tabeller som måste sparas av lagskäl, och radering av resten efter en fastställd frist.
- Servrar, licenser och jobb som bara fanns för det gamla stängs av.

**Klart när** inga rapporter eller jobb läser från det gamla och kostnaden för det är borttagen.

## Avstämning: parallellkörning mot facit

Avstämningen är det som gör det möjligt att lita på det nya. Den automatiseras i dbt (data build tool) som tester och körs varje natt under parallellkörningen.

| Nivå | Kontroll | Tolerans |
| --- | --- | --- |
| 1 | Radantal per tabell och dag | Exakt, om inte avvikelsen är förklarad |
| 2 | Summor av belopp och antal per bolag och period | Fastställs per mått av dataägaren |
| 3 | Nyckelrapporternas utdata mot facit | Exakt på de siffror som ledningen använder |
| 4 | Stickprov på enskilda poster, till exempel tio fordon eller tio affärer | Genomgång för hand tillsammans med dataägaren |

Varje avvikelse är ett fel i det gamla eller i det nya. Dataägaren avgör vilket, och beslutet skrivs in i regelkatalogen. Några gamla siffror kommer att visa sig vara fel. Det är bättre att den diskussionen hålls före lanseringen än efter.

Avstämningen ska omfatta minst ett månadsskifte, eftersom periodiseringar, korrigeringar och bokslutsjusteringar bara syns då.

## Rapporterna

Rapporterna flyttas sist inom varje område.

- **Kompatibilitetsvy:** en tunn vy i `marts` återskapar den gamla kolumnuppsättningen från den nya modellen. Rapporten byter datakälla utan att byggas om.
- **Riktig semantisk modell:** rapporter som används ofta flyttas därefter till en semantisk modell i Power BI (Business intelligence), med definitioner av nyckeltal, ägare och tester.
- Kompatibilitetsvyer får ett slutdatum, annars blir de en ny bakdörr till gamla beslut.

## Stoppregler

- **Inget nytt i det gamla** från ett fastställt datum. Nya behov byggs på den nya plattformen, och det gamla får bara felrättningar.
- **Ingen refaktorering i det gamla.** En databas utan tester ger regressioner när den städas, och tiden behövs för det nya.
- **Inget område utan dataägare.** Ägaren godkänner högarna, avstämningen och slutdatumet.
- **Ingen omdesign under avstämning.** Ändringar av affärsregler sker efter att den gamla siffran är återskapad och förklarad.

## Återgång

Det gamla lever till avstämningen är godkänd och slutdatumet är passerat. Om något går fel efter att en rapport flyttats pekas rapporten tillbaka mot det gamla. Efter slutdatumet finns återgången bara som en säkerhetskopia av det gamla, inte som drift.

## Roller

| Roll | Ansvar |
| --- | --- |
| Dataägare | Äger definitioner och regler inom området. Godkänner högarna, avstämningen, referensdata och slutdatum |
| BI (Business intelligence)-teamet (Business intelligence) | Bygger modeller, tester och avstämning. Äger regelkatalogen och avvecklingsloggen |
| Plattformsansvarig | Äger Terraform, miljöerna, behörigheterna och kostnadsuppföljningen |
| Rapportägare | Flyttar och testar rapporter i sitt område och godkänner kompatibilitetsvyerna |
| Ledningen | Beslutar prioriteringsordning, slutdatum och resurser |

## Risker

| Risk | Följd | Hantering |
| --- | --- | --- |
| Affärsregler finns bara i huvudet på en person | Regeln går förlorad eller byggs fel | Regelkatalogen skrivs i fas 0 tillsammans med den som kan reglerna, och genomläses av verksamheten |
| Omfånget växer ("när det ändå byggs om") | Området blir aldrig klart | Ändringar av regler väntar tills avstämningen är godkänd. Nya önskemål läggs på en lista |
| Parallellkörning kostar dubbelt | Budgeten överskrids | Parallellkörningen begränsas till ett område i taget och stängs av vid godkänd avstämning |
| Gamla siffror visar sig vara fel | Förtroendekris hos verksamheten | Dataägaren involveras från fas 0, och avvikelser redovisas med orsak |
| Mekanisk översättning av dbt (data build tool)-modeller tar längre tid än beräknat | Fas 2 försenas | Hög två innehåller bara objekt med lågt värde. Volymen mäts i fas 0 |
| Nycklar mellan system är instabila | Rapporterna ändras när matchningen förbättras | Nycklar tilldelas en gång och sparas, enligt datamodellen |
| Rapporter byggs om en gång för mycket | Rapportägarna tröttnar | Kompatibilitetsvyer gör att rapporten flyttas en gång och förbättras senare |

## Beslut som behövs

1. Godkänna planen och sorteringen i tre högar.
2. Utse dataägare per område.
3. Fastställa datumet från vilket inget nytt byggs i det gamla.
4. Fastställa toleranser för avstämningen per mått.
5. Besluta hur länge det gamla får finnas som skrivskyddad kopia, och vad som måste arkiveras.
6. Besluta resurser för parallellkörningen under varje område.

## Ordlista

| Begrepp | Förklaring |
| --- | --- |
| ADF (Azure Data Factory) | Microsofts tjänst som flyttar data från ett system till ett annat enligt ett schema. |
| Avstämning | Kontroll av att den nya plattformen ger samma siffror som den gamla, eller att avvikelserna är förklarade. |
| BI (Business intelligence) | Rapporter och analyser som beskriver verksamheten. |
| CI/CD (Continuous integration och continuous delivery) | Automatisk kontroll och leverans av kodändringar, så att ändringar testas innan de når produktion. |
| CRM (Customer relationship management) | System för kundkontakter, förfrågningar och kampanjer. |
| dbt (data build tool) | Verktyget som bygger och testar tabellerna i dataplattformen. |
| Facit | Sparade siffror från de gamla rapporterna, som den nya plattformens siffror jämförs mot. |
| GDPR (General data protection regulation) | EU:s dataskyddsförordning för personuppgifter. |
| Kompatibilitetsvy | En vy som ger en ny tabell samma kolumner som en gammal, så att en rapport kan byta källa utan att byggas om. |
| Lineage | Spårning av vilka tabeller och rapporter som bygger på vilka andra. |
| Regelkatalog | Lista över affärsregler med ägare, källa och status. |
| SQL (Structured query language) | Språket som används för att hämta och bearbeta data i databaser. |
| T-SQL (Transact-SQL) | Microsofts variant av SQL, som används i SQL Server. |
| Terraform | Verktyg som skapar och ändrar molnresurser från kod, så att miljöerna blir likadana. |
