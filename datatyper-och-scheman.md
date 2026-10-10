# Datatyper och schemastruktur

Dokumentet beskriver vilka typer av data plattformen hanterar, var varje typ ligger i Unity Catalog (katalog och schema), hur objekten namnges och hur referensdataflödet ([`referensdata-flode.svg`](referensdata-flode.svg)) matar strukturen. Det gäller målarkitekturen med alternativ C ([`malarkitektur.md`](malarkitektur.md)).

Avsnitten märkta Bedömning är en slutsats av resonemanget i dokumentet. Avsnitten märkta Dokumenterat bygger på leverantörens dokumentation.

## 1. Datatyper

| Typ | Vad det är | Ägare | Ändras | Exempel |
| --- | --- | --- | --- | --- |
| Referensdata | Kodlistor och uppslagsvärden som andra data klassificeras med | Verksamheten | Sällan | Bränsletyper, ordertyper, landskoder |
| Affärsmappning | Manuell koppling från ett värde till ett annat för rapportering, inom samma bolag | Verksamheten | Vid omorganisationer | Telefonkö till kostnadsställe, konto till rapportrad |
| Hierarki | Över- och underordning mellan värden | Verksamheten | Vid omorganisationer | Koncern, bolag, anläggning, avdelning |
| Xref (cross reference, korsreferens) | Koppling mellan samma entitet i olika system | Datateamet eller verksamheten | Följer masterdata | Kund-id i Källsystem A mot kund-id i Källsystem B och Källsystem C. Kostnadsställe i Källsystem C mot kostnadsställe i Källsystem A |
| Masterdata | Verksamhetens kärnentiteter med eget id och livscykel | Verksamheten, ofta ett källsystem | Löpande | Kunder, fordon, verkstäder, anställda |
| Transaktionsdata | Händelser som inträffat | Källsystemet | Läggs till, ändras inte | Fakturor, samtal, bokade verkstadstider |
| Metadata | Data om data | Plattformen | Vid ändringar i modeller | Kolumnbeskrivningar, taggar, lineage |

Skillnaden mellan affärsmappning och xref ligger i vad som kopplas. En affärsmappning översätter ett värde till en annan klassificering (kö till kostnadsställe). En xref binder ihop samma sak i två system (kostnadsställe i system A till kostnadsställe i system B).

## 2. Analys: var ska referensdata och xref ligga?

Unity Catalog har tre nivåer: katalog, schema och tabell. Katalogen är isoleringsenheten i alternativ C, eftersom den binds ISOLATED till ett workspace och ligger på eget storage-konto. Frågan gäller därför om referensdata och xref behöver en egen katalog, ett eget schema eller bara ett namnprefix.

| Alternativ | Fördelar | Nackdelar | Bedömning |
| --- | --- | --- | --- |
| **A. Egen katalog `{miljö}_ref`** | Tydlig avgränsning | Tre extra kataloger med egna bindningar, storage och Terraform-kod. Referensdata har samma åtkomstkrets som core, så ingen isolering vinns | Avvisas |
| **B. Schema per typ i `{miljö}_core`** | Rättigheter kan sättas per schema. Catalog Explorer och lineage visar typen. Dokumentation kan skrivas per schema | Fler schema att skapa | **Valt** |
| **C. Alla typer i ett schema, med prefix** | Minst antal objekt | Rättigheter, sök och dokumentation blandar typerna. Ett nytt prefix kräver ingen strukturändring, vilket gör att konventionen luckras upp med tiden | Avvisas |
| **D. dbt (data build tool) seeds** | Version i Git, ändring kräver pull request | Verksamheten kan inte ändra filen själv. Passar bara data som utvecklare äger | Används för små tekniska listor |

Dokumenterat: rättigheter i Unity Catalog kan ges på katalog-, schema- och tabellnivå och ärvs nedåt, så en grant på ett schema gäller alla tabeller i det.

Bedömning: alternativ B ger bäst balans. Schemat ger en grant-enhet och en plats i katalogträdet utan kostnaden för en ny katalog. Verksamhetens filer går genom referensdataflödet, och dbt-seeds används bara för listor som utvecklarna själva äger, till exempel en lista över miljönamn.

### Landning i raw eller direkt i core

ADF (Azure Data Factory) läser Excel-filen in i `{miljö}_raw` och lämnar den oförändrad. Typning, rensning och regler ligger i dbt. Det följer samma mönster som övriga källor, så referensdata behöver ingen särbehandling i pipelinen, och en misslyckad körning kan alltid spelas om från raw.

## 3. Schemastruktur

```text
{miljö}_raw
  └── referensdata      Excel-filer inlästa av ADF, oförändrade, en tabell per dataset

{miljö}_core
  ├── staging           stg_   typade och rensade källdata, inklusive referensdata från raw
  ├── ref               ref_   referensdata, affärsmappningar och hierarkier
  ├── xref              xref_  korsreferenser mellan system
  ├── intermediate      int_   mellansteg i transformationerna
  └── marts             dim_ och fct_   det Power BI (Business intelligence) läser

{miljö}_hr
  └── samma lager som core, med egen åtkomstkrets
```

Bedömning: `marts` motsvarar gold-lagret i övriga dokument. Bara `marts` behöver speglas till Fabric, eftersom Power BI läser dimensioner och fakta. `ref` och `xref` är byggdelar för dbt och behöver inte vara synliga för rapportanvändare.

Rättigheter per schema:

| Schema | Skriver | Läser |
| --- | --- | --- |
| `raw.referensdata` | ADF-pipelinens service principal | dbt-jobbets service principal |
| `staging`, `ref`, `xref`, `intermediate` | dbt-jobbets service principal | BI-teamet (Business intelligence) för felsökning |
| `marts` | dbt-jobbets service principal | Analytiker och Power BI-modeller |

## 4. Namnstandard

Standarden följer dbt:s och Kimballs vanliga konventioner.

| Objekt | Mönster | Exempel |
| --- | --- | --- |
| Katalog | `{miljö}_{lager}` | `prod_core` |
| Schema | Gemener, engelska, snake_case | `staging`, `ref`, `xref`, `marts` |
| Rå tabell | Datasetets namn | `referensdata.queue_cost_center` |
| Staging | `stg_{källa}__{entitet}` (två understreck) | `stg_referensdata__queue_cost_center` |
| Referensdata, mappning, hierarki | `ref_{entitet}` | `ref_fuel_type`, `ref_queue_cost_center` |
| Korsreferens | `xref_{entitet}` | `xref_cost_center`, `xref_customer` |
| Dimension | `dim_{entitet}` | `dim_cost_center` |
| Fakta | `fct_{händelse}` | `fct_calls` |

Kolumner:

| Kolumn | Betydelse |
| --- | --- |
| `{entitet}_key` | Surrogatnyckel, till exempel `cost_center_key` |
| `{entitet}_code` | Affärskod, till exempel `queue_code` |
| `source_system`, `source_{entitet}_code` | Källsystem och dess kod i xref-tabeller |
| `valid_from`, `valid_to`, `is_current` | Giltighetsperiod. Öppet slutdatum är `9999-12-31` |
| `_source_file`, `_source_version`, `_loaded_at` | Teknisk spårbarhet i raw och staging. Ledande understreck skiljer dem från affärskolumner |

Bedömning: namn på objekt och kolumner skrivs på engelska, och dokumentation och beskrivningar på svenska. Det stämmer med `dim_customer` och övriga modeller, och SQL (Structured query language) blir läsbar för alla som känner dbt-konventionerna.

### Surrogatnycklar

Nycklar skapas deterministiskt med `dbt_utils.generate_surrogate_key` från affärskoden. Identity-kolumner i Delta ger olika nycklar i utveckling, test och produktion för samma rad, vilket gör att xref-tabeller och tester inte går att jämföra mellan miljöerna. Bedömning.

### Giltighetsperioder

Verksamheten fyller i `valid_from` i Excel. `valid_to` räknas ut av dbt som dagen före nästa `valid_from` för samma nyckel. Det tar bort den vanligaste felkällan, överlappande perioder, eftersom användaren aldrig skriver slutdatum. Bedömning.

## 5. Vad som hamnar var

| Typ | Schema | Prefix | Exempel | Källa |
| --- | --- | --- | --- | --- |
| Referensdata | `ref` | `ref_` | `ref_fuel_type` | Excel via referensdataflödet |
| Affärsmappning | `ref` | `ref_` | `ref_queue_cost_center` | Excel via referensdataflödet |
| Hierarki | `ref` | `ref_` | `ref_cost_center_hierarchy` | Excel via referensdataflödet |
| Xref, manuell | `xref` | `xref_` | `xref_cost_center` | Excel via referensdataflödet |
| Xref, genererad | `xref` | `xref_` | `xref_customer` | dbt-modell som matchar på organisationsnummer, personnummer, regnr eller VIN (Vehicle identification number) |
| Masterdata | `marts` | `dim_` | `dim_customer`, `dim_cost_center` | Källsystemen via staging |
| Transaktionsdata | `marts` | `fct_` | `fct_calls` | Källsystemen via staging |
| Metadata | Unity Catalog | Kommentarer och taggar | `pii`, `domain` | dbt:s modellfiler och Terraform |

Schemat avgörs av vad objektet är. Ursprunget avgörs av vem som underhåller det. En xref över kostnadsställen ligger därför i `xref` även om den kommer från en Excel-fil, och en kundxref ligger i samma schema även om den genereras av dbt.

Genererade xref-tabeller ska inte ligga i Excel. De växer med datan och går inte att underhålla för hand. Bara de undantag som matchningen inte klarar, till exempel ett par hundra kunder utan organisationsnummer, hanteras i en liten manuell fil som dbt läser som ett komplement.

## 6. Hur referensdataflödet använder strukturen

| Steg i flödet | Vad som händer i strukturen |
| --- | --- |
| 2. Logic App kopierar filen | Filen skrivs till containern `test` i storage-kontot `referensdata` |
| 3. Validering | Azure Function kontrollerar filens struktur mot datasetets kontrakt |
| 4. Inläsning | ADF läser filen till `test_raw.referensdata.{dataset}` |
| 5. dbt run och dbt test | `stg_` bygger i `test_core.staging`, `ref_` och `xref_` i `test_core.ref` och `test_core.xref`, därefter modellerna nedströms i `marts`. Körningen väljs med taggen `referensdata` |
| 8. Publicering | Logic App kopierar filen från `test` till `prod` efter godkännande |
| 9. Produktion | ADF läser containern `prod` till `prod_raw.referensdata.{dataset}` vid ordinarie körning, och dbt bygger samma modeller i `prod_core` |

Koden är densamma i alla miljöer. Bara `target` och katalog skiljer, som i övriga dbt-projekt.

## 7. Datakontrakt: vem testar vad

Samma regel ska finnas på ett ställe. Annars drar kontraktet i Azure Function och testerna i dbt isär.

| Kontroll | Där | Skäl |
| --- | --- | --- |
| Förväntade kolumner, datatyper, obligatoriska fält, filformat | Azure Function före inläsning | Strukturfel gör att filen inte går att läsa in alls |
| Unik nyckel, giltiga kostnadsställen, täckning, relationer | dbt-tester efter inläsning | Reglerna gäller innehållet och behöver ofta andra tabeller att jämföra mot |

Exempel på modellfil för en affärsmappning:

```yaml
models:
  - name: ref_queue_cost_center
    description: Telefonkö till kostnadsställe med giltighetsperiod. Ägare ekonomi.
    data_tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns: [queue_code, valid_from]
    columns:
      - name: queue_code
        data_tests: [not_null]
      - name: cost_center_key
        data_tests:
          - not_null
          - relationships:
              to: ref('dim_cost_center')
              field: cost_center_key
```

Täckningstestet varnar och stoppar inte körningen, eftersom en ny kö i telefonsystemet är en normal händelse och inget fel i filen:

```sql
-- tests/assert_all_queues_mapped.sql
{{ config(severity='warn') }}

select distinct c.queue_code
from {{ ref('stg_telephony__calls') }} c
left join {{ ref('ref_queue_cost_center') }} m
  on c.queue_code = m.queue_code
 and c.call_date between m.valid_from and m.valid_to
where m.queue_code is null
```

Varningen går till dataägaren som en lista över köer som saknar mappning.

## 8. Avgöranden

1. Referensdata, mappningar och xref ligger som egna schema i `{miljö}_core`, och inte som egna kataloger.
2. Excel-filer landar oförändrade i `{miljö}_raw.referensdata` och går genom `staging` till `ref` och `xref`.
3. Schemat avgörs av vad objektet är. Ursprunget avgör bara hur det laddas.
4. Genererade xref-tabeller byggs av dbt. Bara små undantagsfiler underhålls manuellt.
5. Verksamheten anger `valid_from`. dbt räknar ut `valid_to`.
6. Surrogatnycklar skapas deterministiskt från affärskoden.
7. Strukturkontroller ligger i Azure Function och innehållskontroller i dbt.
8. Bara `marts` speglas till Fabric.

## 9. Öppna punkter

- **Detaljnivå för `dim_cost_center`.** Ekonomi behöver bestämma på vilken nivå kostnadsställen ska konformeras innan xref-filen fylls i, eftersom två system ofta delar upp samma verksamhet olika.
- **Data i test.** Täckningstestet och intervalljoinen ger bara ett meningsfullt svar om test har en rimlig mängd transaktionsdata. Hur testkatalogen fylls behöver avgöras.
- **Spegling på schemanivå.** Fabric-spegling ska väljas för `marts` och inte för övriga schema. Kontrollera mot aktuell dokumentation att urvalet kan göras på schemanivå i den tjänstnivå som används.
- **Namnkonventionen.** Engelska objektnamn är en bedömning. Ändra den innan den första modellen skapas, eftersom ett byte efteråt kräver omdöpning i alla modeller och rapporter.
