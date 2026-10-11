# azure-databricks-architecture

Arkitektur för en dataplattform på Azure med Databricks, dbt (data build tool) och Fabric.

| Fil | Innehåll |
| --- | --- |
| [`malarkitektur.md`](malarkitektur.md) | Arkitekturdokumentet: övervägda alternativ, varför alternativ C föreslås, isolering, dbt, Terraform, Fabric, kostnad, källor och ordlista |
| [`malarkitektur-alternativ-c.drawio`](malarkitektur-alternativ-c.drawio) | Arkitekturdiagram för alternativ C. Öppnas i draw.io eller på app.diagrams.net |
| [`databricks-dos-and-donts.md`](databricks-dos-and-donts.md) | Do's and don'ts för ett team som är nytt på Databricks |
| [`referensdata-flode.svg`](referensdata-flode.svg) | Flöde för referensdata: Excel-filer från SharePoint testas i containern `test`, körs genom dbt i test och publiceras till `prod` efter godkännande av dataägaren |
| [`referensdata-flode.drawio`](referensdata-flode.drawio) | Samma flöde som redigerbar draw.io-fil |
| [`datatyper-och-scheman.md`](datatyper-och-scheman.md) | Referensdata, masterdata, xref och andra datatyper: var de ligger i Unity Catalog, namnstandard, tester och hur referensdataflödet använder strukturen |
| [`dataplan-2027.md`](dataplan-2027.md) | Plan för 2027: värdeområden, frågor och beslut, AI, självbetjäning, färdplan per kvartal och beslut för ledningen |
| [`migreringsplan.md`](migreringsplan.md) | Migrering från befintliga SQL-modeller: tre högar, faser, avstämning mot facit, rapporter, stoppregler, roller och risker |
| [`datamodellering.md`](datamodellering.md) | Datamodellering enligt Kimball med integrationslager: lager, entiteter, nycklar, matchning, historik, faktatabeller och tester |
