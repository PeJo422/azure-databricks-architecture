# Databricks: do's and don'ts

Gäller målarkitekturen med alternativ C: två subscriptions, tre workspaces, en Unity Catalog-metastore.

## Unity Catalog och kataloger

### Do
- Lägg all data i Unity Catalog. Varje tabell ska nås via `catalog.schema.tabell`.
- Bind varje katalog ISOLATED till sin miljös workspace. Bind storage credentials och external locations på samma sätt.
- Ge rättigheter till Entra-grupper på kontonivå. Använd inte enskilda användare eller workspace-lokala grupper.
- Ge rättigheter på schema- eller katalognivå (`USE CATALOG`, `USE SCHEMA`, `SELECT`). Det är enklare att granska än grants per tabell.
- Använd managed tables som standard. Unity Catalog sköter då lagring, rensning och optimering.
- Lägg till kommentarer och taggar på tabeller och kolumner. De blir dokumentation och används i sök och lineage.

### Don't
- Använd inte `hive_metastore`. Det är den gamla metastoren utan styrning, och data där syns inte i Unity Catalog.
- Peka inte nya tabeller direkt mot `abfss://`-sökvägar. Läs filer via external locations och volumes.
- Ge inte `ALL PRIVILEGES` eller ägarskap till personer. Låt en grupp eller service principal äga katalogerna.
- Skapa inte kataloger, scheman eller grants för hand i användargränssnittet. Allt ska gå genom Terraform, annars glider miljöerna isär.

## Workspaces och miljöer

### Do
- Använd ett workspace per miljö: utveckling, test och produktion.
- Låt utvecklare arbeta i utveckling, i egna scheman eller med egna dbt (data build tool)-targets.
- Låt bara pipelinens service principal deploya till test och produktion.
- Skapa workspaces och deras inställningar med Terraform.

### Don't
- Skapa inte workspaces per team eller projekt. Dela upp med kataloger och scheman i stället.
- Ge inte utvecklare skrivrättigheter i test eller produktion.
- Läs inte produktionsdata från utveckling. Om utveckling behöver realistisk data ska det ske genom en styrd och granskad väg.

## Compute och kostnad

### Do
- Använd serverless SQL (Structured query language) warehouses för dbt och för frågor från användare.
- Använd jobbkluster eller serverless jobs för schemalagda körningar.
- Sätt kort auto-stop på warehouses i utveckling och test.
- Tagga warehouses och jobb per miljö och team, och följ kostnaden i systemtabellen `system.billing.usage`.
- Sätt budgetlarm per subscription.

### Don't
- Kör inte schemalagda jobb på all-purpose-kluster. De kostar mer per DBU (Databricks unit) än jobbkompute.
- Låt inte kluster stå igång utan auto-terminate.
- Välj inte större warehouse innan ni har mätt. Börja litet och skala upp när query-historiken visar att det behövs.

## dbt (data build tool)

### Do
- Använd samma kod i alla miljöer. Bara `target` och `catalog` i `profiles.yml` ska skilja.
- Bygg slim CI (Continuous integration) med `state:modified+ --defer`.
- Rensa CI-schemat efter varje körning.
- Materialisera marts-modeller som `table` eller `incremental` om de ska speglas till Fabric.
- Kör produktion med en service principal och OAuth (Open authorization) M2M (Machine to machine).

### Don't
- Hårdkoda inte katalognamn i modellerna. Använd `target.catalog` eller `{{ ref() }}`.
- Kör inte dbt mot produktion från en utvecklares dator.
- Låt inte CI läsa produktionsdata om den innehåller personuppgifter. Låt `--state` peka på testkörningens artefakter.

## Säkerhet och nätverk

### Do
- Ge varje miljö en egen Access Connector med managed identity, med roll bara på den miljöns lagring.
- Stäng av delade nycklar (account keys) på storage-kontona.
- Släpp in serverless mot låst lagring med NSP (Network security perimeter) och service tag `AzureDatabricksServerless.<region>`.
- Lägg hemligheter i Databricks secret scopes kopplade till Azure Key Vault.

### Don't
- Använd inte personliga access tokens (PAT) för automatisering. Använd service principals med OAuth.
- Lita inte på allowlisting av subnät för serverless, eftersom det inte fungerar.
- Lägg inte lösenord eller nycklar i notebooks, kod eller Git.

## Notebooks och kod

### Do
- Ha all kod i Git via Git folders och deploya med Declarative Automation Bundles.
- Lägg logik som ska återanvändas i Python-moduler eller dbt-modeller, inte i notebooks.
- Använd notebooks för utforskning och felsökning.

### Don't
- Schemalägg inte notebooks från någons användarmapp.
- Låt inte produktionsjobb köras som en person. Jobb ska ägas av och köras som en service principal.
- Kopiera inte notebooks mellan workspaces för hand.

## Delta-tabeller

### Do
- Låt predictive optimization sköta `OPTIMIZE` och `VACUUM` på managed tables. Kör `OPTIMIZE` manuellt på stora gold-tabeller före spegling till Fabric om filantalet växer.
- Använd liquid clustering på stora tabeller i stället för partitionering.
- Använd `MERGE` för inkrementella laddningar.

### Don't
- Partitionera inte tabeller under cirka 1 TB.
- Kör inte `VACUUM` med kortare retention än standard (7 dagar) utan att förstå vad det gör med time travel.
- Låt inte antalet små filer växa okontrollerat. Direct Lake i Fabric har en gräns på 5 000 filer per tabell på F64 (Fabric-kapacitet, nivå 64).

## Fabric och Power BI (Business intelligence)

### Do
- Spegla bara produktionskatalogen till Fabric och läs den med Direct Lake.
- Kontrollera att tabellerna Power BI ska läsa är fysiska tabeller.
- Mät förbrukningen med Capacity Metrics-appen under testperioden.

### Don't
- Räkna inte med att vyer, materialized views eller tabeller med radfilter eller kolumnmaskering speglas. Det gör de inte.
- Lägg inte HR (Human resources)-data med Unity Catalog-policys i en katalog som speglas. Använd en egen semantisk modell med RLS (Row level security), eller håll den utanför speglingen.

## Arbetssätt

### Do
- Börja med en liten pilot: en källa, ett dbt-projekt, hela vägen till Power BI.
- Skriv ner namnkonventioner för kataloger, scheman, jobb och grupper innan ni skapar något.
- Läs Databricks dokumentation om Unity Catalog best practices innan ni sätter behörigheter.

### Don't
- Flytta inte allt från SQL Server på en gång.
- Bygg inte egna lösningar för sådant Unity Catalog redan gör, som lineage, åtkomstloggar och dataklassning.

---

Punkterna om partitionering under cirka 1 TB och predictive optimization är allmän praxis och står inte i målarkitekturdokumentet. Kontrollera dem mot Databricks aktuella dokumentation.
