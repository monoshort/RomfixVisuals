(function () {
  const STORAGE_KEY = "romfix-lang";

  /** Nederlands → doeltaal. Langste zinnen eerst (wordt gesorteerd). */
  const EN = {
    "Romfix funderings rekenhulp": "Romfix foundation calculator",
    "funderings rekenhulp": "foundation calculator",
    "Romfix — funderings rekenhulp": "Romfix — foundation calculator",
    "Interactieve Romfix funderings rekenhulp — laagopbouw, wapening en stijfheid live.":
      "Interactive Romfix foundation calculator — layer build-up, reinforcement and stiffness live.",
    "Werk van onder naar boven. Wijzigingen zie je direct in profiel en tabel.":
      "Work from the bottom up. Changes show immediately in the profile and table.",
    "Vier stappen, onder → boven. Klik Open om direct naar de juiste laag te gaan.":
      "Four steps, bottom → top. Click Open to jump to the right layer.",
    "Klik op een laag in het profiel om te bewerken. W = wapening aan.":
      "Click a layer in the profile to edit. W = reinforcement on.",
    "Klik op de laag die je wilt aanpassen. Rechts wijzig je dikte, materiaal en wapening.":
      "Click the layer you want to change. On the right you edit thickness, material and reinforcement.",
    "Hoe werkt deze tool": "How this tool works",
    "Stap 1 ondergrond, 2 verbetering, 3 fundering, 4 bovenbouw. Klik de laag die je wilt aanpassen.":
      "Step 1 subgrade, 2 improvement, 3 foundation, 4 surface. Click the layer you want to change.",
    "Stap <strong>1</strong> ondergrond, <strong>2</strong> verbetering, <strong>3</strong> fundering, <strong>4</strong> bovenbouw. Klik de laag die je wilt aanpassen.":
      "Step <strong>1</strong> subgrade, <strong>2</strong> improvement, <strong>3</strong> foundation, <strong>4</strong> surface. Click the layer you want to change.",
    "Klik op de laag die je wilt aanpassen.": "Click the layer you want to change.",
    "Klik een stap of de laag in het profiel.": "Click a step or the layer in the profile.",
    "Verbetering": "Improvement",
    "Bovenbouw": "Surface",
    "E-modulus bestaande bodem — geen dikte.": "E-modulus of the existing soil — no thickness.",
    "Dikte + vulmateriaal, optioneel wapening.": "Thickness + fill material, optional reinforcement.",
    "Nominale dikte + overhoogte. R'Cel 100/150/200 mm, werkingsdikte standaard 300 mm.":
      "Nominal thickness + surcharge. R'Cel 100/150/200 mm, effective thickness 300 mm by default.",
    "Eén toplaag; telt in dikte, niet in Romfix-stijfheid.":
      "One surface course; counts in thickness, not in Romfix stiffness.",
    "Alleen gewapend terwijl je invult": "Reinforced only while you enter values",
    "Gewapend boven, ongewapend ter vergelijking eronder":
      "Reinforced on top, unreinforced below for comparison",
    "Laat ongewapend zien": "Show unreinforced",
    "Vergelijking onder het gewapende profiel, zelfde diktes.":
      "Comparison under the reinforced profile, same thicknesses.",
    "MPa per laag en stijfheidsfactor": "MPa per layer and stiffness factor",
    "Alleen voor bevoegde gebruikers. Capping en geavanceerde instellingen.":
      "Authorised users only. Capping and advanced settings.",
    "Onjuist wachtwoord.": "Incorrect password.",
    "Tik hier om de PDF te openen": "Tap here to open the PDF",
    "Projectnaam (voor PDF)": "Project name (for PDF)",
    "Projectnaam voor PDF en mail": "Project name for PDF and email",
    "Printvenster geopend. Kies ‘Opslaan als PDF’ voor een kopie.":
      "Print dialog opened. Choose ‘Save as PDF’ for a copy.",
    "PDF klaar. Werkt de download niet? Tik op ‘Tik hier om de PDF te openen’.":
      "PDF ready. Download not working? Tap ‘Tap here to open the PDF’.",
    "PDF maken lukte niet. Probeer Chrome of Safari, niet de in-app browser van Telegram.":
      "Could not create the PDF. Try Chrome or Safari, not Telegram’s in-app browser.",
    "Kopieer deze link:": "Copy this link:",
    "Romfix B.V. · www.romfix.nl · geen bindende projectberekening":
      "Romfix B.V. · www.romfix.nl · not a binding project calculation",
    "Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.":
      "Romfix recommends an R'tex separation fabric at every transition between foundation materials.",
    "Romfix-advies (lichte ophoging)": "Romfix advice (lightweight fill)",
    "Gebruik Argex (of vergelijkbaar) als ophoging tot bodemniveau, omwikkeld in zwaar geotextiel met ca. 1 m overlap/inklemming. Daarboven een druklaag van menggranulaat 0/31,5 met 150 mm PRS-Neoloy / Romfix-cel gevuld met menggranulaat, plus ca. 200 mm menggranulaat erboven. Scheiding met R'tex bij elke materiaalsprong. Asfaltvoorbeeld: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.":
      "Use Argex (or similar) as fill up to ground level, wrapped in heavy geotextile with about 1 m overlap/anchorage. Above that, a load-distribution layer of mixed granulate 0/31.5 with a 150 mm PRS-Neoloy / Romfix cell filled with mixed granulate, plus about 200 mm of mixed granulate on top. Separate with R'tex at every material transition. Asphalt example: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.",
    "Indicatieve Romfix-berekening (werkboek v2.3). Geen bindende projectberekening. Controleer met ontwerp, verkeersklasse en sondering. Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.":
      "Indicative Romfix calculation (workbook v2.3). Not a binding project calculation. Check against design, traffic class and CPT. Romfix recommends an R'tex separation fabric at every transition between foundation materials.",
    "Kies één toplaag (bestrating, asfalt of beton). Bij bestrating: straatzand, drainagemortel of split eronder — samen bovenconstructie.":
      "Choose one surface course (paving, asphalt or concrete). For paving: bedding sand, drainage mortar or chippings underneath — together they form the pavement.",
    "Fundering + overhoogte en Ondergrond verbetering. Constructietype bepaalt Capping/RoadBase.":
      "Foundation + surcharge and subgrade improvement. Construction type sets Capping/RoadBase.",
    "Onderdeel onderconstructie. Overhoogte telt mee in totale funderingdikte.":
      "Part of the substructure. Surcharge counts in the total foundation thickness.",
    "Onderlaag onder de druklaag — eigen materiaal en eigen wapening/SIF.":
      "Lower layer under the load-distribution layer — own material and own reinforcement/SIF.",
    "Bovenste laag van de lichte fundering — eigen materiaal en eigen wapening/SIF.":
      "Top layer of the lightweight foundation — own material and own reinforcement/SIF.",
    "Onderdeel onderconstructie. Verbeterlaag op de ondergrond.":
      "Part of the substructure. Improvement layer on the subgrade.",
    "E-modulus van de ondergrond.": "E-modulus of the subgrade.",
    "Verhoogt de totale funderingdikte (max. werkingsdikte wapening).":
      "Increases total foundation thickness (max. effective reinforcement thickness).",
    "Standaard 300 mm — de MIF-waarden zijn bepaald over 300 mm funderingsmateriaal.":
      "Default 300 mm — MIF values are determined over 300 mm of foundation material.",
    "Wapening staat uit — dikte wordt pas meegenomen als je wapening aanzet.":
      "Reinforcement is off — thickness is only included when you switch reinforcement on.",
    "Soort materiaal legt de ongewapende stijfheid (In) vast. Die gaat mee in de MIF.":
      "Material type sets the unreinforced stiffness (In). That feeds into the MIF.",
    "Druklaag-materiaal wijzigen laat BIMS/schuimglas in het profiel staan.":
      "Changing load-distribution material leaves BIMS/foam glass in the profile.",
    "Wijzig hier het licht materiaal, niet de druklaag. Of kies ↩ standaard fundering.":
      "Change the lightweight material here, not the load-distribution layer. Or choose ↩ standard foundation.",
    "↩ Terug naar standaard fundering": "↩ Back to standard foundation",
    "↩ Standaard fundering (geen BIMS/schuimglas)": "↩ Standard foundation (no BIMS/foam glass)",
    "— profiel wordt één laag; materiaal van de druklaag wordt overgenomen.":
      "— profile becomes one layer; load-distribution material is kept.",
    "Kies een toplaag met dikte > 0.": "Choose a surface course with thickness > 0.",
    "Één laag: bestrating, asfalt of beton.": "One layer: paving, asphalt or concrete.",
    "Één laag: bestrating, asfalt of beton. Onder bestrating kies je de onderlaag.":
      "One layer: paving, asphalt or concrete. Under paving you choose the bedding.",
    "Producthoogte van de cel — 100, 150 of 200 mm. Vulling boven de cel: max. 150 mm gewapend, de rest ongebonden.":
      "Cell product height — 100, 150 or 200 mm. Fill above the cell: max. 150 mm reinforced, the rest unbound.",
    "Volgt uit de stijfheid van de ondergrond en de ongewapende stijfheid van deze laag.":
      "Follows from subgrade stiffness and the unreinforced stiffness of this layer.",
    " Ondergrond hier = stijfheid onder de fundering.": " Subgrade here = stiffness under the foundation.",
    " Ondergrond hier = E-modulus bestaande bodem.": " Subgrade here = E-modulus of the existing soil.",
    " Boven 250 MPa loopt de extra factor terug: wapening telt mee, niet 2–3× de cataloguswaarde.":
      " Above 250 MPa the extra factor drops: reinforcement still counts, not 2–3× the catalogue value.",
    "Alleen deze laag. Standaard E'Grid (SIF 5). Mag ook uit, of het systeem — los van schuimglas.":
      "This layer only. Default E'Grid (SIF 5). May also be off, or the system — independent of foam glass.",
    "Equivalente stijfheid (vulmateriaal + onderliggende lagen):":
      "Equivalent stiffness (fill + layers below):",
    "Equivalente stijfheid": "Equivalent stiffness",
    "vulmateriaal + onderliggende lagen": "fill + layers below",
    "vaste equivalente E": "fixed equivalent E",
    "vaste stijfheid bovenconstructie (geen Romfix)": "fixed pavement stiffness (no Romfix)",
    "Equivalent E": "Equivalent E",
    "Geen bindende projectberekening": "Not a binding project calculation",
    "Controleer met ontwerp, verkeersklasse en sondering.":
      "Check against design, traffic class and CPT.",
    "Profiel gewapend vs ongewapend": "Profile reinforced vs unreinforced",
    "Romfix funderings rekenhulp v2.3 · indicatief": "Romfix foundation calculator v2.3 · indicative",
    "Effectieve werkingsdikte eerste wapeningsrij": "Effective thickness of first reinforcement row",
    "Dikte lichte laag (BIMS/schuimglas)": "Thickness of lightweight layer (BIMS/foam glass)",
    "Licht vulmateriaal (BIMS/schuimglas)": "Lightweight fill (BIMS/foam glass)",
    "Wapening schuimglas / BIMS": "Foam glass / BIMS reinforcement",
    "Wapening schuimglas": "Foam glass reinforcement",
    "Wapening druklaag": "Load-distribution reinforcement",
    "Materiaal cappinglaag": "Capping-layer material",
    "Materiaal in fundering": "Material in foundation",
    "Materiaaltype": "Material type",
    "— Kies materiaal —": "— Choose material —",
    "Hydraulisch menggranulaat": "Hydraulic mixed granulate",
    "Steenslag/steenmengsels": "Crushed stone / stone mix",
    "Goed gegradeerd zand": "Well-graded sand",
    "Veen/slappe klei": "Peat / soft clay",
    "Vaste klei": "Stiff clay",
    "Menggranulaat": "Mixed granulate",
    "Betongranulaat": "Concrete granulate",
    "Metselwerkpuin": "Masonry rubble",
    "Schuimglas / BIMS": "Foam glass / BIMS",
    "Schuimglas": "Foam glass",
    "Drainagemortel": "Drainage mortar",
    "Straatzand": "Bedding sand",
    "Bestrating": "Paving",
    "Onder bestrating, max 20 cm": "under paving, max 20 cm",
    "onder bestrating, max 20 cm": "under paving, max 20 cm",
    "ca. 5 cm": "approx. 5 cm",
    "max 18 cm": "max 18 cm",
    "20–25 cm": "20–25 cm",
    "Fundering + overhoogte": "Foundation + surcharge",
    "Ondergrond verbetering": "Subgrade improvement",
    "ondergrond verbetering": "subgrade improvement",
    "Bovenconstructie totaal": "Pavement total",
    "Bovenconstructie": "Pavement",
    "bovenconstructie": "pavement",
    "Onderconstructie": "Substructure",
    "onderconstructie": "substructure",
    "Constructietype": "Construction type",
    "Beton + fundering": "Concrete + foundation",
    "Asfalt + fundering": "Asphalt + foundation",
    "Bestrating + fundering": "Paving + foundation",
    "Klinkers + fundering": "Paving + foundation",
    "Actieve berekening:": "Active calculation:",
    "Fundering (nominaal)": "Foundation (nominal)",
    "Fundering nominaal": "Foundation nominal",
    "Fundering totaal": "Foundation total",
    "Fundering E:": "Foundation E:",
    "E-modulus vulmateriaal": "Fill E-modulus",
    "E-modulus druklaag": "Load-distribution E-modulus",
    "E-modulus ondergrond": "Subgrade E-modulus",
    "E-modulus": "E-modulus",
    "Dikte druklaag": "Load-distribution thickness",
    "Dikte asfalt": "Asphalt thickness",
    "Deklaag, tussenlaag en onderlaag, elk apart.": "Wearing course, binder course and base course, each on its own.",
    "Asfaltlagen": "Asphalt layers",
    "Asfalt totaal": "Asphalt total",
    "Asfalt totaal:": "Asphalt total:",
    "Elke laag apart.": "Each layer on its own.",
    "Deklaag": "Wearing course",
    "Tussenlaag": "Binder course",
    "3 lagen": "3 layers",
    "Dikte beton": "Concrete thickness",
    "Dikte bestrating": "Paving thickness",
    "Dikte laag": "Layer thickness",
    "Dikte (mm)": "Thickness (mm)",
    "Licht fundering": "Lightweight foundation",
    "lichte fundering": "lightweight foundation",
    "Licht vulmateriaal": "Lightweight fill",
    "Ongewapende stijfheid In / W": "Unreinforced stiffness In / W",
    "Ongewapend boven R'Cel": "Unreinforced above R'Cel",
    "Ongewapend boven:": "Unreinforced above:",
    "Vulling gewapend boven R'Cel": "Reinforced fill above R'Cel",
    "Effectieve werkingsdikte fundering": "Effective foundation reinforcement thickness",
    "Werkingsdikte wapening": "Effective reinforcement thickness",
    "Werkingsdikte OGV": "OGV effective thickness",
    "Werkingsdikte:": "Effective thickness:",
    "MIF en werkingsdikte": "MIF and effective thickness",
    "Wapening fundering": "Foundation reinforcement",
    "Wapening OGV": "OGV reinforcement",
    "Romfix-wapening op deze laag": "Romfix reinforcement on this layer",
    "Wapeningsconfiguratie": "Reinforcement configuration",
    "Geen wapening op deze laag": "No reinforcement on this layer",
    "Geen wapening": "No reinforcement",
    "Alleen geogrid": "Geogrid only",
    "Alleen geocel": "Geocell only",
    "Wapening druklaag": "Pressure-layer reinforcement",
    "Romfix-systeem": "Romfix system",
    "Los van de wapening op de fundering. Standaard geogrid bij een gewapende fundering.":
      "Independent of the foundation reinforcement. Geogrid by default when the foundation is reinforced.",
    "Op de onderlaag kies je de wapening. De druklaag stel je hierboven apart in. Overhoogte blijft ongewapend.":
      "Choose the reinforcement on the lower layer. Set the pressure layer above, separately. The surcharge stays unreinforced.",
    "Geogrid + geocel": "Geogrid + geocell",
    "Zonder wapening → met wapening": "Unreinforced → reinforced",
    "Zonder wapening": "Unreinforced",
    "Met wapening": "Reinforced",
    "zonder wapening": "unreinforced",
    "met wapening": "reinforced",
    "Stijfheid fundering": "Foundation stiffness",
    "Stijfheidstabel": "Stiffness table",
    "Stijfheid": "Stiffness",
    "Pakketdikte": "Total thickness",
    "Totale pakketdikte": "Total thickness",
    "diepte onderkant": "depth to bottom of",
    "Rekenwijze ongewapende stijfheid": "Unreinforced stiffness method",
    "Vast — In = W, SIF doet niet mee": "Fixed — In = W, SIF is not used",
    "Vrij — W volgt uit laagdikte en ondergrond": "Free — W follows from layer thickness and subgrade",
    "Vast: In en W zijn gelijk — het programma rekent met de ingevulde ongewapende stijfheid.":
      "Fixed: In and W are equal — the tool uses the entered unreinforced stiffness.",
    "Vrij: W volgt uit laagdikte en stijfheid van de ondergrond; alleen voor ongebonden materialen.":
      "Free: W follows from layer thickness and subgrade stiffness; unbound materials only.",
    "Menggranulaat en andere zelfbindende materialen staan altijd op vast.":
      "Mixed granulate and other self-binding materials are always fixed.",
    "Vast: rekenen met de ingevulde ongewapende stijfheid van de (onder)fundering. SIF doet niet mee in de ontwerpberekening.":
      "Fixed: use the entered unreinforced stiffness of the (sub)foundation. SIF is not used in the design calculation.",
    "× sterker": "× stronger",
    "sterker": "stronger",
    "Hoogte R'Cel": "R'Cel height",
    "Infill in R'Cel (OGV)": "Infill in R'Cel (OGV)",
    "Infill in R'Cel": "Infill in R'Cel",
    "SIF fundering": "Foundation SIF",
    "SIF OGV": "OGV SIF",
    "MIF fundering": "Foundation MIF",
    "MIF OGV": "OGV MIF",
    "Vulmateriaal OGV": "OGV fill material",
    "Vulmateriaal fundering": "Foundation fill material",
    "Vulmateriaal": "Fill material",
    "druklaag + schuimglas/BIMS": "load-distribution + foam glass/BIMS",
    "Onderlaag ·": "Lower layer ·",
    "Onderlaag": "Lower layer",
    "Druklaag ·": "Load-distribution ·",
    "Druklaag": "Load-distribution layer",
    "Overhoogte · ongewapend": "Surcharge · unreinforced",
    "Overhoogte ·": "Surcharge ·",
    "Overhoogte": "Surcharge",
    "Fundering ·": "Foundation ·",
    "Fundering /": "Foundation /",
    "Fundering": "Foundation",
    "nominale fundering": "nominal foundation",
    "Gewichtcompensatie": "Weight compensation",
    "Gewicht": "Weight",
    "lichter": "lighter",
    "zwaarder": "heavier",
    "in balans": "in balance",
    "Zelfde hoogte slappe klei": "Same height soft clay",
    "T.o.v. dezelfde hoogte slappe klei": "Vs. the same height of soft clay",
    "Maaiveld": "Ground level",
    "maaiveld": "ground level",
    "op de verharding": "at the pavement",
    "onder de verharding": "below the pavement",
    "onder het pakket": "below the package",
    "Maaiveld op de verharding": "Ground level at the pavement",
    "Maaiveld onder het pakket": "Ground level below the package",
    "Hele pakket boven maaiveld, veen wordt niet afgetrokken":
      "Whole package above ground level, peat is not subtracted",
    "Slappe klei alleen in het cunet": "Soft clay only in the trench",
    "boven maaiveld telt volledig mee": "above ground level counts in full",
    "Bims": "Bims",
    "Schuimglas / Bims": "Foam glass / Bims",
    "Schuimglas / puimsteen": "Foam glass / pumice",
    "Puimsteen": "Pumice",
    "Wapening schuimglas / puimsteen": "Foam glass / pumice reinforcement",
    "↩ Standaard fundering (geen puimsteen/schuimglas)": "↩ Standard foundation (no pumice/foam glass)",
    "Argex": "Argex",
    "Wapening op de lichte laag": "Reinforcement on the lightweight layer",
    "Lichte laag tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Lightweight layer up to 1000 mm; the foundation grows with it, the load-distribution layer stays.",
    "Wapening schuimglas / Bims": "Foam glass / Bims reinforcement",
    "Dikte lichte laag (Bims/schuimglas)": "Thickness of lightweight layer (Bims/foam glass)",
    "Licht vulmateriaal (Bims/schuimglas)": "Lightweight fill (Bims/foam glass)",
    "↩ Standaard fundering (geen Bims/schuimglas)": "↩ Standard foundation (no Bims/foam glass)",
    "Druklaag-materiaal wijzigen laat Bims/schuimglas in het profiel staan.":
      "Changing load-distribution material leaves Bims/foam glass in the profile.",
    "Schuimglas/Bims tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Foam glass/Bims up to 1000 mm; the foundation grows with it, the load-distribution layer stays.",
    "Schuimglas/BIMS tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Foam glass/BIMS up to 1000 mm; the foundation grows with it, the load-distribution layer stays.",
    "funderingdikte": "foundation thickness",
    "fundering": "foundation",
    "laagdikte": "layer thickness",
    "Ondergrond": "Subgrade",
    "ondergrond": "subgrade",
    "Gewapend": "Reinforced",
    "Ongewapend": "Unreinforced",
    "gewapend": "reinforced",
    "ongewapend": "unreinforced",
    "ongew. onder": "unreinf. below",
    "Toplaag:": "Surface course:",
    "Toplaag": "Surface course",
    "toplaag": "surface course",
    "Kies toplaag": "Choose surface course",
    "Printen / PDF": "Print / PDF",
    "Download PDF": "Download PDF",
    "PDF maken…": "Creating PDF…",
    "Mailen": "Email",
    "Link delen": "Share link",
    "Link gekopieerd.": "Link copied.",
    "Gedeeld.": "Shared.",
    "Handleiding": "Guide",
    "Standaard modus": "Standard mode",
    "Expert mode": "Expert mode",
    "Standaard fundering": "Standard foundation",
    "Inklappen": "Collapse",
    "Uitklappen": "Expand",
    "Annuleren": "Cancel",
    "Inloggen": "Log in",
    "Wachtwoord": "Password",
    "Wap. (mm)": "Reinf. (mm)",
    "Wapening": "Reinforcement",
    "wapening": "reinforcement",
    "Deellagen": "Sub-layers",
    "DEELLAGEN": "SUB-LAYERS",
    "Profiel": "Profile",
    "Invoer diktes": "Input thicknesses",
    "Invoer E & wapening": "Input E & reinforcement",
    "Invoer": "Input",
    "Laagmodel gewapend": "Layer model reinforced",
    "Laagmodel ongewapend": "Layer model unreinforced",
    "Lagen": "Layers",
    "Laag": "Layer",
    "Factor": "Factor",
    "Zonder": "Unreinf.",
    "Met": "Reinf.",
    "Onderdeel": "Item",
    "Waarde": "Value",
    "Toelichting": "Notes",
    "indicatief": "indicative",
    "Open": "Open",
    "Aan": "On",
    "Uit": "Off",
    "Type": "Type",
    "Boven": "Pavement",
    "Asfalt": "Asphalt",
    "Beton": "Concrete",
    "Split": "Chippings",
    "Zand": "Sand",
    "Kies": "Choose",
    "geen": "none",
    "Project": "Project",
    "Romfix-berekening": "Romfix calculation",
    "Romfix berekening": "Romfix calculation",
    "Pakket ": "Total ",
    " · boven ": " · pavement ",
    " · fundering ": " · foundation ",
    " mm · fundering ": " mm · foundation ",
    "Licht:": "Lightweight:",
    "begrensd door fundering": "limited by foundation",
    "Wapening uit": "Reinforcement off",
    "Wapening aan": "Reinforcement on",
    "(geen Romfix)": "(no Romfix)",
    "(gewapend max ": "(reinforced max ",
    "SIF = Support Improvement Factor · MIF = Modules Improvement Factor":
      "SIF = Support Improvement Factor · MIF = Modules Improvement Factor",
    "Capping (Series 600)": "Capping (Series 600)",
    "RoadBase (Series 800)": "RoadBase (Series 800)",
    "automatisch": "automatic",
    "Materiaal": "Material",
    "materiaal": "material",
    "Dikte": "Thickness",
    "dikte": "thickness",
    "Taal": "Language",
    "Nederlands": "Dutch",
    "Engels": "English",
    "Deens": "Danish",
    "Duits": "German",
    "Papiaments": "Papiamentu",
    "Dansk": "Danish",
    "Aangepast": "Custom",
    "werkboek": "workbook",
    "Vier stappen, onder → boven. Klik <strong>Open</strong> om direct naar de juiste laag te gaan.":
      "Four steps, bottom → top. Click <strong>Open</strong> to jump to the right layer.",
    "Klik op een laag in het profiel om te bewerken. <strong>W</strong> = wapening aan.":
      "Click a layer in the profile to edit. <strong>W</strong> = reinforcement on.",
    "wapening aan": "reinforcement on",
    "Tussen bestrating en onderconstructie — straatzand, drainagemortel of split (0–200 mm).":
      "Between paving and substructure — bedding sand, drainage mortar or chippings (0–200 mm).",
    "Tussen bestrating en substructure — straatzand, drainagemortel of split (0–200 mm).":
      "Between paving and substructure — bedding sand, drainage mortar or chippings (0–200 mm).",
    "Onderlaag bestrating": "Paving bedding",
    "Dikte straatzand (max 20 cm)": "Bedding sand thickness (max 20 cm)",
    "Dikte drainagemortel (max 20 cm)": "Drainage mortar thickness (max 20 cm)",
    "Dikte split (max 20 cm)": "Chippings thickness (max 20 cm)",
    "straatzand": "bedding sand",
    "drainagemortel": "drainage mortar",
    "Dikte druklaag en lichte laag": "Load-distribution and lightweight layer thickness",
    "en lichte laag": "and lightweight layer",
    "lichte laag": "lightweight layer",
    "LICHTE LAAG": "LIGHTWEIGHT LAYER",
    "Samen ": "Together ",
    "Eigen SIF van de onderlaag — niet die van de druklaag.":
      "Own SIF of the lower layer — not that of the load-distribution layer.",
    "Nominale fundering ": "Nominal foundation ",
    "Ongewapende stijfheid van deze laag": "Unreinforced stiffness of this layer",
    "ONGEWAPENDE STIJFHEID VAN DEZE LAAG": "UNREINFORCED STIFFNESS OF THIS LAYER",
    "Vrij: het programma toetst of de ongewapende stijfheid van de (onder)fundering voldoet. Alleen voor ongebonden materialen.":
      "Free: the tool checks whether the unreinforced stiffness of the (sub)foundation is sufficient. Unbound materials only.",
    "Vrij: het programma toetst of de ongewapende stijfheid van de (onder)foundation voldoet. Alleen voor ongebonden materialen.":
      "Free: the tool checks whether the unreinforced stiffness of the (sub)foundation is sufficient. Unbound materials only.",
    "ongewapende laag": "unreinforced layer",
    "ongewapende stijfheid": "unreinforced stiffness",
    "ongebonden materialen": "unbound materials",
    "zelfbindende materialen": "self-binding materials",
    "Bij menggranulaat of zelfbindend materiaal is vrij uitgeschakeld.":
      "For mixed granulate or self-binding material, free is disabled.",
    "Vulling gewapend:": "Reinforced fill:",
    "Gewapend totaal:": "Reinforced total:",
    "Standaard hoogte:": "Standard height:",
    " mm overhoogte": " mm surcharge",
    " overhoogte)": " surcharge)",
    " mm fundering)": " mm foundation)",
    "Romfix-wapening": "Romfix reinforcement",
    " op deze laag": " on this layer",
    "Totaal:": "Total:",
    "Boven in het pakket": "At the top of the pack",
    "In (catalogus)": "In (catalogue)",
    " (catalogus)": " (catalogue)",
    "cataloguswaarde": "catalogue value",
    "keuze ": "choice ",
    ", laag is dunner": ", layer is thinner",
    "W (zonder wapening)": "W (unreinforced)",
    "Rekenwijze": "Calculation method",
    "Vrij": "Free",
    "Vast": "Fixed",
    "150 MPa vul": "150 MPa fill",
    "50 MPa vul": "50 MPa fill",
    " MPa vul": " MPa fill",
    "vul ·": "fill ·",
    "Paving 50 + straatzand": "Paving 50 + bedding sand",
    " + straatzand ": " + bedding sand ",
  };

  const DA = {
    "Romfix funderings rekenhulp": "Romfix fundamentberegner",
    "funderings rekenhulp": "fundamentberegner",
    "Romfix — funderings rekenhulp": "Romfix — fundamentberegner",
    "Interactieve Romfix funderings rekenhulp — laagopbouw, wapening en stijfheid live.": "Interaktiv Romfix fundamentberegner — lagopbygning, armering og stivhed live.",
    "Werk van onder naar boven. Wijzigingen zie je direct in profiel en tabel.": "Arbejd nedefra og op. Ændringer vises med det samme i profil og tabel.",
    "Vier stappen, onder → boven. Klik Open om direct naar de juiste laag te gaan.": "Fire trin, bund → top. Klik Åbn for at gå direkte til det rigtige lag.",
    "Klik op een laag in het profiel om te bewerken. W = wapening aan.": "Klik på et lag i profilen for at redigere. W = armering til.",
    "Klik op de laag die je wilt aanpassen. Rechts wijzig je dikte, materiaal en wapening.": "Klik på det lag, du vil ændre. Til højre retter du tykkelse, materiale og armering.",
    "Hoe werkt deze tool": "Sådan virker værktøjet",
    "Stap 1 ondergrond, 2 verbetering, 3 fundering, 4 bovenbouw. Klik de laag die je wilt aanpassen.": "Trin 1 undergrund, 2 forbedring, 3 fundament, 4 overflade. Klik på det lag, du vil ændre.",
    "Stap <strong>1</strong> ondergrond, <strong>2</strong> verbetering, <strong>3</strong> fundering, <strong>4</strong> bovenbouw. Klik de laag die je wilt aanpassen.": "Trin <strong>1</strong> undergrund, <strong>2</strong> forbedring, <strong>3</strong> fundament, <strong>4</strong> overflade. Klik på det lag, du vil ændre.",
    "Klik op de laag die je wilt aanpassen.": "Klik på det lag, du vil ændre.",
    "Klik een stap of de laag in het profiel.": "Klik på et trin eller laget i profilen.",
    "Verbetering": "Forbedring",
    "Bovenbouw": "Overflade",
    "E-modulus bestaande bodem — geen dikte.": "E-modulus for den eksisterende jord — ingen tykkelse.",
    "Dikte + vulmateriaal, optioneel wapening.": "Tykkelse + fyldmateriale, valgfri armering.",
    "Nominale dikte + overhoogte. R'Cel 100/150/200 mm, werkingsdikte standaard 300 mm.": "Nominel tykkelse + overhøjde. R'Cel 100/150/200 mm, virkningstykkelse 300 mm som standard.",
    "Eén toplaag; telt in dikte, niet in Romfix-stijfheid.": "Ét toplag; tæller i tykkelse, ikke i Romfix-stivhed.",
    "Alleen gewapend terwijl je invult": "Kun armeret, mens du indtaster",
    "Gewapend boven, ongewapend ter vergelijking eronder": "Armeret øverst, uarmeret nedenunder til sammenligning",
    "Laat ongewapend zien": "Vis uarmeret",
    "Vergelijking onder het gewapende profiel, zelfde diktes.": "Sammenligning under det armerede profil, samme tykkelser.",
    "MPa per laag en stijfheidsfactor": "MPa pr. lag og stivhedsfaktor",
    "Alleen voor bevoegde gebruikers. Capping en geavanceerde instellingen.": "Kun for autoriserede brugere. Capping og avancerede indstillinger.",
    "Onjuist wachtwoord.": "Forkert adgangskode.",
    "Tik hier om de PDF te openen": "Tryk her for at åbne PDF'en",
    "Projectnaam (voor PDF)": "Projektnavn (til PDF)",
    "Projectnaam voor PDF en mail": "Projektnavn til PDF og mail",
    "Printvenster geopend. Kies ‘Opslaan als PDF’ voor een kopie.": "Udskrivningsvindue åbnet. Vælg ‘Gem som PDF’ for en kopi.",
    "PDF klaar. Werkt de download niet? Tik op ‘Tik hier om de PDF te openen’.": "PDF klar. Virker downloaden ikke? Tryk på ‘Tryk her for at åbne PDF'en’.",
    "PDF maken lukte niet. Probeer Chrome of Safari, niet de in-app browser van Telegram.": "PDF kunne ikke oprettes. Prøv Chrome eller Safari, ikke Telegrams in-app-browser.",
    "Kopieer deze link:": "Kopiér dette link:",
    "Romfix B.V. · www.romfix.nl · geen bindende projectberekening": "Romfix B.V. · www.romfix.nl · ikke en bindende projektberegning",
    "Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.": "Romfix anbefaler en R'tex-separationsdug ved hver overgang mellem fundamentmaterialer.",
    "Romfix-advies (lichte ophoging)": "Romfix advice (lightweight fill)",
    "Gebruik Argex (of vergelijkbaar) als ophoging tot bodemniveau, omwikkeld in zwaar geotextiel met ca. 1 m overlap/inklemming. Daarboven een druklaag van menggranulaat 0/31,5 met 150 mm PRS-Neoloy / Romfix-cel gevuld met menggranulaat, plus ca. 200 mm menggranulaat erboven. Scheiding met R'tex bij elke materiaalsprong. Asfaltvoorbeeld: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.":
      "Use Argex (or similar) as fill up to ground level, wrapped in heavy geotextile with about 1 m overlap/anchorage. Above that, a load-distribution layer of mixed granulate 0/31.5 with a 150 mm PRS-Neoloy / Romfix cell filled with mixed granulate, plus about 200 mm of mixed granulate on top. Separate with R'tex at every material transition. Asphalt example: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.",
    "Indicatieve Romfix-berekening (werkboek v2.3). Geen bindende projectberekening. Controleer met ontwerp, verkeersklasse en sondering. Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.": "Vejledende Romfix-beregning (håndbog v2.3). Ikke en bindende projektberegning. Kontrollér med design, trafikklasse og CPT. Romfix anbefaler en R'tex-separationsdug ved hver overgang mellem fundamentmaterialer.",
    "Kies één toplaag (bestrating, asfalt of beton). Bij bestrating: straatzand, drainagemortel of split eronder — samen bovenconstructie.": "Vælg ét toplag (belægning, asfalt eller beton). Ved belægning: lægsand, drænmorter eller skærver nedenunder — tilsammen overbygning.",
    "Fundering + overhoogte en Ondergrond verbetering. Constructietype bepaalt Capping/RoadBase.": "Fundament + overhøjde og underbundsforbedring. Konstruktionstype bestemmer Capping/RoadBase.",
    "Onderdeel onderconstructie. Overhoogte telt mee in totale funderingdikte.": "Del af underbygningen. Overhøjde tæller med i den samlede fundamenttykkelse.",
    "Onderlaag onder de druklaag — eigen materiaal en eigen wapening/SIF.": "Underlag under trykfordelingslaget — eget materiale og egen armering/SIF.",
    "Bovenste laag van de lichte fundering — eigen materiaal en eigen wapening/SIF.": "Øverste lag af letvægtsfundamentet — eget materiale og egen armering/SIF.",
    "Onderdeel onderconstructie. Verbeterlaag op de ondergrond.": "Del af underbygningen. Forbedringslag på underbunden.",
    "E-modulus van de ondergrond.": "E-modulus for underbunden.",
    "Verhoogt de totale funderingdikte (max. werkingsdikte wapening).": "Øger den samlede fundamenttykkelse (maks. virkningstykkelse for armering).",
    "Standaard 300 mm — de MIF-waarden zijn bepaald over 300 mm funderingsmateriaal.": "Standard 300 mm — MIF-værdierne er bestemt over 300 mm fundamentmateriale.",
    "Wapening staat uit — dikte wordt pas meegenomen als je wapening aanzet.": "Armering er fra — tykkelse medregnes først, når du slår armering til.",
    "Soort materiaal legt de ongewapende stijfheid (In) vast. Die gaat mee in de MIF.": "Materialet fastlægger den uarmerede stivhed (In). Den indgår i MIF.",
    "Druklaag-materiaal wijzigen laat BIMS/schuimglas in het profiel staan.": "Ændring af trykfordelingsmateriale lader BIMS/skumglas blive i profilen.",
    "Wijzig hier het licht materiaal, niet de druklaag. Of kies ↩ standaard fundering.": "Ændr det lette materiale her, ikke trykfordelingslaget. Eller vælg ↩ standardfundament.",
    "↩ Terug naar standaard fundering": "↩ Tilbage til standardfundament",
    "↩ Standaard fundering (geen BIMS/schuimglas)": "↩ Standardfundament (uden BIMS/skumglas)",
    "— profiel wordt één laag; materiaal van de druklaag wordt overgenomen.": "— profilen bliver ét lag; materialet fra trykfordelingslaget beholdes.",
    "Kies een toplaag met dikte > 0.": "Vælg et toplag med tykkelse > 0.",
    "Één laag: bestrating, asfalt of beton.": "Ét lag: belægning, asfalt eller beton.",
    "Één laag: bestrating, asfalt of beton. Onder bestrating kies je de onderlaag.": "Ét lag: belægning, asfalt eller beton. Under belægning vælger du underlaget.",
    "Producthoogte van de cel — 100, 150 of 200 mm. Vulling boven de cel: max. 150 mm gewapend, de rest ongebonden.": "Produkt højde af cellen — 100, 150 eller 200 mm. Fyld over cellen: maks. 150 mm armeret, resten ubundet.",
    "Volgt uit de stijfheid van de ondergrond en de ongewapende stijfheid van deze laag.": "Følger af underbundens stivhed og lagets uarmerede stivhed.",
    " Ondergrond hier = stijfheid onder de fundering.": " Underbund her = stivhed under fundamentet.",
    " Ondergrond hier = E-modulus bestaande bodem.": " Underbund her = E-modulus for den eksisterende jord.",
    " Boven 250 MPa loopt de extra factor terug: wapening telt mee, niet 2–3× de cataloguswaarde.": " Over 250 MPa falder merfaktoren: armering tæller med, ikke 2–3× katalogværdien.",
    "Alleen deze laag. Standaard E'Grid (SIF 5). Mag ook uit, of het systeem — los van schuimglas.": "Kun dette lag. Standard E'Grid (SIF 5). Kan også være fra, eller systemet — uafhængigt af skumglas.",
    "Equivalente stijfheid (vulmateriaal + onderliggende lagen):": "Ækvivalent stivhed (fyld + underliggende lag):",
    "Equivalente stijfheid": "Ækvivalent stivhed",
    "vulmateriaal + onderliggende lagen": "fyld + underliggende lag",
    "vaste equivalente E": "fast ækvivalent E",
    "vaste stijfheid bovenconstructie (geen Romfix)": "fast stivhed for overbygning (ingen Romfix)",
    "Equivalent E": "Ækvivalent E",
    "Geen bindende projectberekening": "Ikke en bindende projektberegning",
    "Controleer met ontwerp, verkeersklasse en sondering.": "Kontrollér med design, trafikklasse og CPT.",
    "Profiel gewapend vs ongewapend": "Profil armeret vs uarmeret",
    "Romfix funderings rekenhulp v2.3 · indicatief": "Romfix fundamentberegner v2.3 · vejledende",
    "Effectieve werkingsdikte eerste wapeningsrij": "Effektiv virkningstykkelse første armeringsrække",
    "Dikte lichte laag (BIMS/schuimglas)": "Tykkelse af let lag (BIMS/skumglas)",
    "Licht vulmateriaal (BIMS/schuimglas)": "Let fyldmateriale (BIMS/skumglas)",
    "Wapening schuimglas / BIMS": "Armering skumglas / BIMS",
    "Wapening schuimglas": "Armering skumglas",
    "Wapening druklaag": "Armering trykfordelingslag",
    "Materiaal cappinglaag": "Materiale i cappinglag",
    "Materiaal in fundering": "Materiale i fundament",
    "Materiaaltype": "Materialetype",
    "— Kies materiaal —": "— Vælg materiale —",
    "Hydraulisch menggranulaat": "Hydraulisk blandingsgranulat",
    "Steenslag/steenmengsels": "Knust sten / stenblanding",
    "Goed gegradeerd zand": "Velgraderet sand",
    "Veen/slappe klei": "Tørv / blød ler",
    "Vaste klei": "Stiv ler",
    "Menggranulaat": "Blandingsgranulat",
    "Betongranulaat": "Betongranulat",
    "Metselwerkpuin": "Murværksaffald",
    "Schuimglas / BIMS": "Skumglas / BIMS",
    "Schuimglas": "Skumglas",
    "Drainagemortel": "Drænmorter",
    "Straatzand": "Lægsand",
    "Bestrating": "Belægning",
    "Onder bestrating, max 20 cm": "under belægning, maks. 20 cm",
    "onder bestrating, max 20 cm": "under belægning, maks. 20 cm",
    "ca. 5 cm": "ca. 5 cm",
    "max 18 cm": "maks. 18 cm",
    "20–25 cm": "20–25 cm",
    "Fundering + overhoogte": "Fundament + overhøjde",
    "Ondergrond verbetering": "Underbundsforbedring",
    "ondergrond verbetering": "underbundsforbedring",
    "Bovenconstructie totaal": "Overbygning i alt",
    "Bovenconstructie": "Overbygning",
    "bovenconstructie": "overbygning",
    "Onderconstructie": "Underbygning",
    "onderconstructie": "underbygning",
    "Constructietype": "Konstruktionstype",
    "Beton + fundering": "Beton + fundament",
    "Asfalt + fundering": "Asfalt + fundament",
    "Bestrating + fundering": "Belægning + fundament",
    "Klinkers + fundering": "Belægning + fundament",
    "Actieve berekening:": "Aktiv beregning:",
    "Fundering (nominaal)": "Fundament (nominelt)",
    "Fundering nominaal": "Fundament nominelt",
    "Fundering totaal": "Fundament i alt",
    "Fundering E:": "Fundament E:",
    "E-modulus vulmateriaal": "E-modulus fyldmateriale",
    "E-modulus druklaag": "E-modulus trykfordelingslag",
    "E-modulus ondergrond": "E-modulus underbund",
    "E-modulus": "E-modulus",
    "Dikte druklaag": "Tykkelse trykfordelingslag",
    "Dikte asfalt": "Tykkelse asfalt",
    "Deklaag, tussenlaag en onderlaag, elk apart.": "Slidlag, bindelag og bærelag, hver for sig.",
    "Asfaltlagen": "Asfaltlag",
    "Asfalt totaal": "Asfalt i alt",
    "Asfalt totaal:": "Asfalt i alt:",
    "Elke laag apart.": "Hvert lag for sig.",
    "Deklaag": "Slidlag",
    "Tussenlaag": "Bindelag",
    "3 lagen": "3 lag",
    "Dikte beton": "Tykkelse beton",
    "Dikte bestrating": "Tykkelse belægning",
    "Dikte laag": "Lagtykkelse",
    "Dikte (mm)": "Tykkelse (mm)",
    "Licht fundering": "Letvægtsfundament",
    "lichte fundering": "letvægtsfundament",
    "Licht vulmateriaal": "Let fyldmateriale",
    "Ongewapende stijfheid In / W": "Uarmeret stivhed In / W",
    "Ongewapend boven R'Cel": "Uarmeret over R'Cel",
    "Ongewapend boven:": "Uarmeret over:",
    "Vulling gewapend boven R'Cel": "Armeret fyld over R'Cel",
    "Effectieve werkingsdikte fundering": "Effektiv virkningstykkelse fundament",
    "Werkingsdikte wapening": "Virkningstykkelse armering",
    "Werkingsdikte OGV": "Virkningstykkelse OGV",
    "Werkingsdikte:": "Virkningstykkelse:",
    "MIF en werkingsdikte": "MIF og virkningstykkelse",
    "Wapening fundering": "Armering fundament",
    "Wapening OGV": "Armering OGV",
    "Romfix-wapening op deze laag": "Romfix-armering på dette lag",
    "Wapeningsconfiguratie": "Armeringskonfiguration",
    "Geen wapening op deze laag": "Ingen armering på dette lag",
    "Geen wapening": "Ingen armering",
    "Alleen geogrid": "Kun geonet",
    "Alleen geocel": "Kun gecelle",
    "Wapening druklaag": "Armering trykfordelingslag",
    "Romfix-systeem": "Romfix-system",
    "Los van de wapening op de fundering. Standaard geogrid bij een gewapende fundering.":
      "Uafhængigt af fundamentets armering. Standard geonet når fundamentet er armeret.",
    "Op de onderlaag kies je de wapening. De druklaag stel je hierboven apart in. Overhoogte blijft ongewapend.":
      "Vælg armeringen på underlaget. Trykfordelingslaget indstilles ovenfor, for sig. Overhøjden forbliver uarmeret.",
    "Geogrid + geocel": "Geonet + gecelle",
    "Zonder wapening → met wapening": "Uarmeret → armeret",
    "Zonder wapening": "Uarmeret",
    "Met wapening": "Armeret",
    "zonder wapening": "uarmeret",
    "met wapening": "armeret",
    "Stijfheid fundering": "Stivhed fundament",
    "Stijfheidstabel": "Stivhedstabel",
    "Stijfheid": "Stivhed",
    "Pakketdikte": "Samlet tykkelse",
    "Totale pakketdikte": "Samlet tykkelse",
    "diepte onderkant": "dybde til underside af",
    "Rekenwijze ongewapende stijfheid": "Beregningsmetode uarmeret stivhed",
    "Vast — In = W, SIF doet niet mee": "Fast — In = W, SIF indgår ikke",
    "Vrij — W volgt uit laagdikte en ondergrond": "Fri — W følger af lagtykkelse og underbund",
    "Vast: In en W zijn gelijk — het programma rekent met de ingevulde ongewapende stijfheid.": "Fast: In og W er ens — programmet bruger den indtastede uarmerede stivhed.",
    "Vrij: W volgt uit laagdikte en stijfheid van de ondergrond; alleen voor ongebonden materialen.": "Fri: W følger af lagtykkelse og underbundens stivhed; kun for ubundne materialer.",
    "Menggranulaat en andere zelfbindende materialen staan altijd op vast.": "Blandingsgranulat og andre selvbindende materialer står altid på fast.",
    "Vast: rekenen met de ingevulde ongewapende stijfheid van de (onder)fundering. SIF doet niet mee in de ontwerpberekening.": "Fast: brug den indtastede uarmerede stivhed for (under)fundamentet. SIF indgår ikke i designberegningen.",
    "× sterker": "× stærkere",
    "sterker": "stærkere",
    "Hoogte R'Cel": "Højde R'Cel",
    "Infill in R'Cel (OGV)": "Fyld i R'Cel (OGV)",
    "Infill in R'Cel": "Fyld i R'Cel",
    "SIF fundering": "SIF fundament",
    "SIF OGV": "SIF OGV",
    "MIF fundering": "MIF fundament",
    "MIF OGV": "MIF OGV",
    "Vulmateriaal OGV": "Fyldmateriale OGV",
    "Vulmateriaal fundering": "Fyldmateriale fundament",
    "Vulmateriaal": "Fyldmateriale",
    "druklaag + schuimglas/BIMS": "trykfordelingslag + skumglas/BIMS",
    "Onderlaag ·": "Underlag ·",
    "Onderlaag": "Underlag",
    "Druklaag ·": "Trykfordelingslag ·",
    "Druklaag": "Trykfordelingslag",
    "Overhoogte · ongewapend": "Overhøjde · uarmeret",
    "Overhoogte ·": "Overhøjde ·",
    "Overhoogte": "Overhøjde",
    "Fundering ·": "Fundament ·",
    "Fundering /": "Fundament /",
    "Fundering": "Fundament",
    "nominale fundering": "nominelt fundament",
    "Gewichtcompensatie": "Vægtkompensation",
    "Gewicht": "Vægt",
    "lichter": "lettere",
    "zwaarder": "tungere",
    "in balans": "i balance",
    "Zelfde hoogte slappe klei": "Samme højde blød ler",
    "T.o.v. dezelfde hoogte slappe klei": "I forhold til samme højde blød ler",
    "Maaiveld": "Terræn",
    "maaiveld": "terræn",
    "op de verharding": "ved belægningen",
    "onder de verharding": "under belægningen",
    "onder het pakket": "under pakken",
    "Maaiveld op de verharding": "Terræn ved belægningen",
    "Maaiveld onder het pakket": "Terræn under pakken",
    "Hele pakket boven maaiveld, veen wordt niet afgetrokken":
      "Hele pakken over terræn, tørv trækkes ikke fra",
    "Slappe klei alleen in het cunet": "Blød ler kun i rende",
    "boven maaiveld telt volledig mee": "over terræn tæller fuldt med",
    "Bims": "Bims",
    "Schuimglas / Bims": "Skumglas / Bims",
    "Schuimglas / puimsteen": "Skumglas / pimpsten",
    "Puimsteen": "Pimpsten",
    "Wapening schuimglas / puimsteen": "Armering skumglas / pimpsten",
    "↩ Standaard fundering (geen puimsteen/schuimglas)": "↩ Standardfundament (uden pimpsten/skumglas)",
    "Argex": "Argex",
    "Wapening op de lichte laag": "Armering på det lette lag",
    "Lichte laag tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Let lag op til 1000 mm; fundamentet vokser med, tryklaget bliver.",
    "Wapening schuimglas / Bims": "Armering skumglas / Bims",
    "Dikte lichte laag (Bims/schuimglas)": "Tykkelse af let lag (Bims/skumglas)",
    "Licht vulmateriaal (Bims/schuimglas)": "Let fyldmateriale (Bims/skumglas)",
    "↩ Standaard fundering (geen Bims/schuimglas)": "↩ Standardfundament (uden Bims/skumglas)",
    "Druklaag-materiaal wijzigen laat Bims/schuimglas in het profiel staan.":
      "Ændring af trykfordelingsmateriale lader Bims/skumglas blive i profilen.",
    "Schuimglas/Bims tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Skumglas/Bims op til 1000 mm; fundamentet vokser med, tryklaget bliver.",
    "Schuimglas/BIMS tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Skumglas/BIMS op til 1000 mm; fundamentet vokser med, tryklaget bliver.",
    "funderingdikte": "fundamenttykkelse",
    "fundering": "fundament",
    "laagdikte": "lagtykkelse",
    "Ondergrond": "Underbund",
    "ondergrond": "underbund",
    "Gewapend": "Armeret",
    "Ongewapend": "Uarmeret",
    "gewapend": "armeret",
    "ongewapend": "uarmeret",
    "ongew. onder": "uarm. under",
    "Toplaag:": "Toplag:",
    "Toplaag": "Toplag",
    "toplaag": "toplag",
    "Kies toplaag": "Vælg toplag",
    "Printen / PDF": "Udskriv / PDF",
    "Download PDF": "Download PDF",
    "PDF maken…": "Opretter PDF…",
    "Mailen": "Mail",
    "Link delen": "Del link",
    "Link gekopieerd.": "Link kopieret.",
    "Gedeeld.": "Delt.",
    "Handleiding": "Vejledning",
    "Standaard modus": "Standardtilstand",
    "Expert mode": "Eksperttilstand",
    "Standaard fundering": "Standardfundament",
    "Inklappen": "Fold sammen",
    "Uitklappen": "Fold ud",
    "Annuleren": "Annuller",
    "Inloggen": "Log ind",
    "Wachtwoord": "Adgangskode",
    "Wap. (mm)": "Arm. (mm)",
    "Wapening": "Armering",
    "wapening": "armering",
    "Deellagen": "Dellag",
    "DEELLAGEN": "DELLAG",
    "Profiel": "Profil",
    "Invoer diktes": "Input tykkelser",
    "Invoer E & wapening": "Input E & armering",
    "Invoer": "Input",
    "Laagmodel gewapend": "Lagmodel armeret",
    "Laagmodel ongewapend": "Lagmodel uarmeret",
    "Lagen": "Lag",
    "Laag": "Lag",
    "Factor": "Faktor",
    "Zonder": "Uarm.",
    "Met": "Arm.",
    "Onderdeel": "Punkt",
    "Waarde": "Værdi",
    "Toelichting": "Bemærkninger",
    "indicatief": "vejledende",
    "Open": "Åbn",
    "Aan": "Til",
    "Uit": "Fra",
    "Type": "Type",
    "Boven": "Overbygning",
    "Asfalt": "Asfalt",
    "Beton": "Beton",
    "Split": "Skærver",
    "Zand": "Sand",
    "Kies": "Vælg",
    "geen": "ingen",
    "Project": "Projekt",
    "Romfix-berekening": "Romfix-beregning",
    "Romfix berekening": "Romfix beregning",
    "Pakket ": "I alt ",
    " · boven ": " · overbygning ",
    " · fundering ": " · fundament ",
    " mm · fundering ": " mm · fundament ",
    "Licht:": "Let:",
    "begrensd door fundering": "begrænset af fundament",
    "Wapening uit": "Armering fra",
    "Wapening aan": "Armering til",
    "(geen Romfix)": "(ingen Romfix)",
    "(gewapend max ": "(armeret maks. ",
    "SIF = Support Improvement Factor · MIF = Modules Improvement Factor": "SIF = Support Improvement Factor · MIF = Modules Improvement Factor",
    "Capping (Series 600)": "Capping (Series 600)",
    "RoadBase (Series 800)": "RoadBase (Series 800)",
    "automatisch": "automatisk",
    "Materiaal": "Materiale",
    "materiaal": "materiale",
    "Dikte": "Tykkelse",
    "dikte": "tykkelse",
    "Taal": "Sprog",
    "Nederlands": "Nederlandsk",
    "Engels": "Engelsk",
    "Deens": "Dansk",
    "Duits": "Tysk",
    "Papiaments": "Papiamentu",
    "Dansk": "Dansk",
    "Aangepast": "Tilpasset",
    "werkboek": "håndbog",
    "Vier stappen, onder → boven. Klik <strong>Open</strong> om direct naar de juiste laag te gaan.":
      "Fire trin, bund → top. Klik på <strong>Åbn</strong> for at gå direkte til det rigtige lag.",
    "Klik op een laag in het profiel om te bewerken. <strong>W</strong> = wapening aan.":
      "Klik på et lag i profilen for at redigere. <strong>W</strong> = armering til.",
    "wapening aan": "armering til",
    "Tussen bestrating en onderconstructie — straatzand, drainagemortel of split (0–200 mm).":
      "Mellem belægning og underbygning — lægsand, drænmorter eller skærver (0–200 mm).",
    "Tussen bestrating en substructure — straatzand, drainagemortel of split (0–200 mm).":
      "Mellem belægning og underbygning — lægsand, drænmorter eller skærver (0–200 mm).",
    "Onderlaag bestrating": "Belægningsunderlag",
    "Dikte straatzand (max 20 cm)": "Tykkelse lægsand (maks. 20 cm)",
    "Dikte drainagemortel (max 20 cm)": "Tykkelse drænmorter (maks. 20 cm)",
    "Dikte split (max 20 cm)": "Tykkelse skærver (maks. 20 cm)",
    "straatzand": "lægsand",
    "drainagemortel": "drænmorter",
    "Dikte druklaag en lichte laag": "Tykkelse trykfordelingslag og let lag",
    "en lichte laag": "og let lag",
    "lichte laag": "let lag",
    "LICHTE LAAG": "LET LAG",
    "Samen ": "I alt ",
    "Eigen SIF van de onderlaag — niet die van de druklaag.":
      "Egen SIF for underlaget — ikke trykfordelingslagets.",
    "Nominale fundering ": "Nominelt fundament ",
    "Ongewapende stijfheid van deze laag": "Uarmeret stivhed af dette lag",
    "ONGEWAPENDE STIJFHEID VAN DEZE LAAG": "UARMERET STIVHED AF DETTE LAG",
    "Vrij: het programma toetst of de ongewapende stijfheid van de (onder)fundering voldoet. Alleen voor ongebonden materialen.":
      "Fri: programmet tjekker, om den uarmerede stivhed af (under)fundamentet er tilstrækkelig. Kun ubundne materialer.",
    "Vrij: het programma toetst of de ongewapende stijfheid van de (onder)foundation voldoet. Alleen voor ongebonden materialen.":
      "Fri: programmet tjekker, om den uarmerede stivhed af (under)fundamentet er tilstrækkelig. Kun ubundne materialer.",
    "ongewapende laag": "uarmeret lag",
    "ongewapende stijfheid": "uarmeret stivhed",
    "ongebonden materialen": "ubundne materialer",
    "zelfbindende materialen": "selvbindende materialer",
    "Bij menggranulaat of zelfbindend materiaal is vrij uitgeschakeld.":
      "Ved blandingsgranulat eller selvbindende materiale er fri slået fra.",
    "Vulling gewapend:": "Armeret fyld:",
    "Gewapend totaal:": "Armeret i alt:",
    "Standaard hoogte:": "Standardhøjde:",
    " mm overhoogte": " mm overhøjde",
    " overhoogte)": " overhøjde)",
    " mm fundering)": " mm fundament)",
    "Romfix-wapening": "Romfix-armering",
    " op deze laag": " på dette lag",
    "Totaal:": "I alt:",
    "Boven in het pakket": "Øverst i pakken",
    "In (catalogus)": "In (katalog)",
    " (catalogus)": " (katalog)",
    "cataloguswaarde": "katalogværdi",
    "keuze ": "valg ",
    ", laag is dunner": ", laget er tyndere",
    "W (zonder wapening)": "W (uarmeret)",
    "Rekenwijze": "Beregningsmetode",
    "Vrij": "Fri",
    "Vast": "Fast",
    "150 MPa vul": "150 MPa fyld",
    "50 MPa vul": "50 MPa fyld",
    " MPa vul": " MPa fyld",
    "vul ·": "fyld ·",
    "Paving 50 + straatzand": "Belægning 50 + lægsand",
    " + straatzand ": " + lægsand ",
  };

  const DE = {
    "Romfix funderings rekenhulp": "Romfix Fundament-Rechenhilfe",
    "funderings rekenhulp": "Fundament-Rechenhilfe",
    "Romfix — funderings rekenhulp": "Romfix — Fundament-Rechenhilfe",
    "Interactieve Romfix funderings rekenhulp — laagopbouw, wapening en stijfheid live.":
      "Interaktive Romfix Fundament-Rechenhilfe — Schichtenaufbau, Bewehrung und Steifigkeit live.",
    "Hoe werkt deze tool": "So funktioniert das Tool",
    "Klik een stap of de laag in het profiel.": "Klicken Sie einen Schritt oder die Schicht im Profil.",
    "Klik op de laag die je wilt aanpassen.": "Klicken Sie die Schicht, die Sie ändern möchten.",
    "Klik op de laag die je wilt aanpassen. Rechts wijzig je dikte, materiaal en wapening.":
      "Klicken Sie die Schicht, die Sie ändern möchten. Rechts ändern Sie Dicke, Material und Bewehrung.",
    "Vier stappen, onder → boven. Klik Open om direct naar de juiste laag te gaan.":
      "Vier Schritte, von unten nach oben. Klicken Sie Öffnen, um direkt zur richtigen Schicht zu springen.",
    "Vier stappen, onder → boven. Klik <strong>Open</strong> om direct naar de juiste laag te gaan.":
      "Vier Schritte, von unten nach oben. Klicken Sie <strong>Öffnen</strong>, um direkt zur richtigen Schicht zu springen.",
    "Klik op een laag in het profiel om te bewerken. W = wapening aan.":
      "Klicken Sie eine Schicht im Profil, um sie zu bearbeiten. W = Bewehrung an.",
    "Klik op een laag in het profiel om te bewerken. <strong>W</strong> = wapening aan.":
      "Klicken Sie eine Schicht im Profil, um sie zu bearbeiten. <strong>W</strong> = Bewehrung an.",
    "Stap 1 ondergrond, 2 verbetering, 3 fundering, 4 bovenbouw. Klik de laag die je wilt aanpassen.":
      "Schritt 1 Untergrund, 2 Verbesserung, 3 Tragschicht, 4 Oberbau. Klicken Sie die Schicht, die Sie ändern möchten.",
    "Stap <strong>1</strong> ondergrond, <strong>2</strong> verbetering, <strong>3</strong> fundering, <strong>4</strong> bovenbouw. Klik de laag die je wilt aanpassen.":
      "Schritt <strong>1</strong> Untergrund, <strong>2</strong> Verbesserung, <strong>3</strong> Tragschicht, <strong>4</strong> Oberbau. Klicken Sie die Schicht, die Sie ändern möchten.",
    "Verbetering": "Verbesserung",
    "Bovenbouw": "Oberbau",
    "Ondergrond": "Untergrund",
    "ondergrond": "Untergrund",
    "Ondergrond verbetering": "Untergrundverbesserung",
    "ondergrond verbetering": "Untergrundverbesserung",
    "Fundering + overhoogte": "Tragschicht + Überhöhung",
    "Fundering": "Tragschicht",
    "fundering": "Tragschicht",
    "Fundering /": "Tragschicht /",
    "Fundering ·": "Tragschicht ·",
    "Overhoogte": "Überhöhung",
    "Overhoogte ·": "Überhöhung ·",
    "Overhoogte · ongewapend": "Überhöhung · unbewehrt",
    "Boven": "Oberbau",
    "Bovenconstructie": "Oberbau",
    "bovenconstructie": "Oberbau",
    "Bovenconstructie totaal": "Oberbau gesamt",
    "Onderconstructie": "Unterbau",
    "onderconstructie": "Unterbau",
    "Profiel": "Profil",
    "Handleiding": "Anleitung",
    "Open": "Öffnen",
    "Laat ongewapend zien": "Unbewehrt anzeigen",
    "Vergelijking onder het gewapende profiel, zelfde diktes.":
      "Vergleich unter dem bewehrten Profil, gleiche Dicken.",
    "Alleen gewapend terwijl je invult": "Nur bewehrt, während Sie eingeben",
    "Gewapend boven, ongewapend ter vergelijking eronder":
      "Bewehrt oben, unbewehrt darunter zum Vergleich",
    "Gewapend": "Bewehrt",
    "Ongewapend": "Unbewehrt",
    "gewapend": "bewehrt",
    "ongewapend": "unbewehrt",
    "Gewapend t.o.v. ongewapend": "Bewehrt gegenüber unbewehrt",
    "Gewapend → ongewapend": "Bewehrt → unbewehrt",
    "Zonder wapening → met wapening": "Unbewehrt → bewehrt",
    "Zonder wapening": "Unbewehrt",
    "Met wapening": "Bewehrt",
    "Stijfheidstabel": "Steifigkeitstabelle",
    "Stijfheid fundering": "Steifigkeit Tragschicht",
    "Stijfheid": "Steifigkeit",
    "MPa per laag en stijfheidsfactor": "MPa je Schicht und Steifigkeitsfaktor",
    "Pakketdikte": "Paketdicke",
    "Totale pakketdikte": "Gesamtdicke",
    "Gewicht": "Gewicht",
    "Gewichtcompensatie": "Gewichtsausgleich",
    "Gewicht pakket": "Paketgewicht",
    "lichter": "leichter",
    "zwaarder": "schwerer",
    "in balans": "im Gleichgewicht",
    "Zelfde hoogte slappe klei": "Gleiche Höhe weicher Ton",
    "T.o.v. dezelfde hoogte slappe klei": "Gegenüber gleicher Höhe weichen Tons",
    "Maaiveld": "Gelände",
    "maaiveld": "Gelände",
    "op de verharding": "an der Decke",
    "onder de verharding": "unter der Decke",
    "onder het pakket": "unter dem Paket",
    "Maaiveld op de verharding": "Gelände an der Decke",
    "Maaiveld onder het pakket": "Gelände unter dem Paket",
    "Hele pakket boven maaiveld, veen wordt niet afgetrokken":
      "Gesamtes Paket über Gelände, Torf wird nicht abgezogen",
    "Slappe klei alleen in het cunet": "Weicher Ton nur im Planum",
    "boven maaiveld telt volledig mee": "über Gelände zählt voll mit",
    "Printen / PDF": "Drucken / PDF",
    "Download PDF": "PDF herunterladen",
    "PDF maken…": "PDF wird erstellt…",
    "Mailen": "E-Mail",
    "Link delen": "Link teilen",
    "Link gekopieerd.": "Link kopiert.",
    "Tik hier om de PDF te openen": "Hier tippen, um das PDF zu öffnen",
    "Projectnaam (voor PDF)": "Projektname (für PDF)",
    "Projectnaam voor PDF en mail": "Projektname für PDF und E-Mail",
    "Profiel gewapend vs ongewapend": "Profil bewehrt vs. unbewehrt",
    "Waarden per laag": "Werte je Schicht",
    "Situatie": "Situation",
    "Waarden": "Werte",
    "Laag": "Schicht",
    "Dikte": "Dicke",
    "Dikte (mm)": "Dicke (mm)",
    "dikte": "Dicke",
    "Wapening": "Bewehrung",
    "wapening": "Bewehrung",
    "Wap. (mm)": "Bewehr. (mm)",
    "Zonder": "Unbewehrt",
    "Met": "Bewehrt",
    "Factor": "Faktor",
    "Invoer": "Eingabe",
    "Onderdeel": "Teil",
    "Waarde": "Wert",
    "Toelichting": "Erläuterung",
    "Materiaaltype": "Materialart",
    "Materiaal": "Material",
    "materiaal": "Material",
    "— Kies materiaal —": "— Material wählen —",
    "Aangepast": "Angepasst",
    "Hydraulisch menggranulaat": "Hydraulisches Mischgranulat",
    "Steenslag/steenmengsels": "Schotter / Steingemisch",
    "Goed gegradeerd zand": "Gut abgestufter Sand",
    "Veen/slappe klei": "Torf / weicher Ton",
    "Vaste klei": "Fester Ton",
    "Menggranulaat": "Mischgranulat",
    "Betongranulaat": "Betongranulat",
    "Metselwerkpuin": "Mauerwerkbruch",
    "Schuimglas": "Schaumglas",
    "Schuimglas / Bims": "Schaumglas / Bims",
    "Schuimglas / puimsteen": "Schaumglas / Bimsstein",
    "Puimsteen": "Bimsstein",
    "Wapening schuimglas / puimsteen": "Bewehrung Schaumglas / Bimsstein",
    "↩ Standaard fundering (geen puimsteen/schuimglas)": "↩ Standard-Tragschicht (kein Bimsstein/Schaumglas)",
    "Argex": "Argex",
    "Wapening op de lichte laag": "Bewehrung auf der leichten Schicht",
    "Lichte laag tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Leichte Schicht bis 1000 mm; die Tragschicht wächst mit, die Lastverteilungsschicht bleibt.",
    "Bims": "Bims",
    "Drainagemortel": "Drainagemörtel",
    "Straatzand": "Bettungssand",
    "straatzand": "Bettungssand",
    "Bestrating": "Pflaster",
    "Asfalt": "Asphalt",
    "Beton": "Beton",
    "Split": "Splitt",
    "Deklaag, tussenlaag en onderlaag, elk apart.": "Deckschicht, Binderschicht und Tragschicht, jeweils einzeln.",
    "Asfaltlagen": "Asphaltschichten",
    "Asfalt totaal": "Asphalt gesamt",
    "Asfalt totaal:": "Asphalt gesamt:",
    "Elke laag apart.": "Jede Schicht einzeln.",
    "Deklaag": "Deckschicht",
    "Tussenlaag": "Binderschicht",
    "3 lagen": "3 Schichten",
    "Zand": "Sand",
    "Klinkers + fundering": "Pflaster + Tragschicht",
    "Bestrating + fundering": "Pflaster + Tragschicht",
    "Asfalt + fundering": "Asphalt + Tragschicht",
    "Beton + fundering": "Beton + Tragschicht",
    "Constructietype": "Bauart",
    "Toplaag": "Deckschicht",
    "toplaag": "Deckschicht",
    "Kies toplaag": "Deckschicht wählen",
    "Wapeningsconfiguratie": "Bewehrungskonfiguration",
    "Wapening schuimglas / Bims": "Bewehrung Schaumglas / Bims",
    "Wapening druklaag": "Bewehrung Lastverteilungsschicht",
    "Wapening fundering": "Bewehrung Tragschicht",
    "Wapening OGV": "Bewehrung Untergrundverbesserung",
    "Geen wapening": "Keine Bewehrung",
    "Geen wapening op deze laag": "Keine Bewehrung in dieser Schicht",
    "Alleen geogrid": "Nur Geogitter",
    "Alleen geocel": "Nur Geozelle",
    "Wapening druklaag": "Bewehrung der Druckschicht",
    "Romfix-systeem": "Romfix-System",
    "Los van de wapening op de fundering. Standaard geogrid bij een gewapende fundering.":
      "Unabhängig von der Fundamentbewehrung. Standard ist Geogitter, wenn das Fundament bewehrt ist.",
    "Op de onderlaag kies je de wapening. De druklaag stel je hierboven apart in. Overhoogte blijft ongewapend.":
      "Die Bewehrung wählen Sie auf der unteren Schicht. Die Druckschicht stellen Sie darüber getrennt ein. Die Überhöhung bleibt unbewehrt.",
    "Geogrid + geocel": "Geogitter + Geozelle",
    "gewapende celhoogte": "bewehrte Zellhöhe",
    "gewapende overhoogte": "bewehrte Überhöhung",
    "ongewapende overhoogte": "unbewehrte Überhöhung",
    "Onderlaag": "Unterschicht",
    "Onderlaag ·": "Unterschicht ·",
    "Druklaag": "Lastverteilungsschicht",
    "Druklaag ·": "Lastverteilungsschicht ·",
    "E-modulus": "E-Modul",
    "E-modulus ondergrond": "E-Modul Untergrund",
    "E-modulus bestaande bodem — geen dikte.": "E-Modul des vorhandenen Bodens — keine Dicke.",
    "Dikte + vulmateriaal, optioneel wapening.": "Dicke + Füllmaterial, Bewehrung optional.",
    "Nominale dikte + overhoogte. R'Cel 100/150/200 mm, werkingsdikte standaard 300 mm.":
      "Nenndicke + Überhöhung. R'Cel 100/150/200 mm, Wirkdicke standardmäßig 300 mm.",
    "Eén toplaag; telt in dikte, niet in Romfix-stijfheid.":
      "Eine Deckschicht; zählt in der Dicke, nicht in der Romfix-Steifigkeit.",
    "× sterker": "× steifer",
    "sterker": "steifer",
    "indicatief": "indikativ",
    "werkboek": "Arbeitsbuch",
    "Romfix funderings rekenhulp v2.3 · indicatief": "Romfix Fundament-Rechenhilfe v2.3 · indikativ",
    "Taal": "Sprache",
    "Nederlands": "Niederländisch",
    "Engels": "Englisch",
    "Deens": "Dänisch",
    "Duits": "Deutsch",
    "Papiaments": "Papiamentu",
    "Dansk": "Dänisch",
    "Expert mode": "Expertenmodus",
    "Standaard modus": "Standardmodus",
    "Inklappen": "Einklappen",
    "Uitklappen": "Ausklappen",
    "Annuleren": "Abbrechen",
    "Inloggen": "Anmelden",
    "Wachtwoord": "Passwort",
    "Onjuist wachtwoord.": "Falsches Passwort.",
    "Alleen voor bevoegde gebruikers. Capping en geavanceerde instellingen.":
      "Nur für berechtigte Nutzer. Capping und erweiterte Einstellungen.",
    "Aan": "Ein",
    "Uit": "Aus",
    "geen": "keine",
    "Kies": "Wählen",
    "Project": "Projekt",
    "Laagmodel gewapend": "Schichtmodell bewehrt",
    "Laagmodel ongewapend": "Schichtmodell unbewehrt",
    "Lagen": "Schichten",
    "In (catalogus)": "In (Katalog)",
    " (catalogus)": " (Katalog)",
    "cataloguswaarde": "Katalogwert",
    "Vrij": "Frei",
    "Vast": "Fest",
    "Materiaal in fundering": "Material in der Tragschicht",
    "Licht fundering": "Leichte Tragschicht",
    "lichte fundering": "leichte Tragschicht",
    "lichte laag": "leichte Schicht",
    "SIF fundering": "SIF Tragschicht",
    "SIF OGV": "SIF Untergrundverbesserung",
    "SIF druklaag (geogrid)": "SIF Lastverteilungsschicht (Geogitter)",
    "SIF lichte laag": "SIF leichte Schicht",
    "MIF fundering": "MIF Tragschicht",
    "MIF OGV": "MIF Untergrundverbesserung",
    "MIF lichte laag": "MIF leichte Schicht",
    "Hoogte R'Cel": "Höhe R'Cel",
    "Infill in R'Cel": "Füllung in R'Cel",
    "Verschil gewapend t.o.v. ongewapend": "Unterschied bewehrt gegenüber unbewehrt",
    "Geen bindende projectberekening": "Keine verbindliche Projektberechnung",
    "Romfix B.V. · www.romfix.nl · geen bindende projectberekening":
      "Romfix B.V. · www.romfix.nl · keine verbindliche Projektberechnung",
    "Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.":
      "Romfix empfiehlt bei jedem Übergang zwischen Fundamentmaterialien ein R'tex-Trennvlies.",
    "Romfix-advies (lichte ophoging)": "Romfix advice (lightweight fill)",
    "Gebruik Argex (of vergelijkbaar) als ophoging tot bodemniveau, omwikkeld in zwaar geotextiel met ca. 1 m overlap/inklemming. Daarboven een druklaag van menggranulaat 0/31,5 met 150 mm PRS-Neoloy / Romfix-cel gevuld met menggranulaat, plus ca. 200 mm menggranulaat erboven. Scheiding met R'tex bij elke materiaalsprong. Asfaltvoorbeeld: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.":
      "Use Argex (or similar) as fill up to ground level, wrapped in heavy geotextile with about 1 m overlap/anchorage. Above that, a load-distribution layer of mixed granulate 0/31.5 with a 150 mm PRS-Neoloy / Romfix cell filled with mixed granulate, plus about 200 mm of mixed granulate on top. Separate with R'tex at every material transition. Asphalt example: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.",
    "Indicatieve Romfix-berekening (werkboek v2.3). Geen bindende projectberekening. Controleer met ontwerp, verkeersklasse en sondering. Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.":
      "Indikative Romfix-Berechnung (Arbeitsbuch v2.3). Keine verbindliche Projektberechnung. Mit Entwurf, Verkehrsklasse und Sondierung prüfen. Romfix empfiehlt bei jedem Übergang zwischen Fundamentmaterialien ein R'tex-Trennvlies.",
    "PDF klaar. Werkt de download niet? Tik op ‘Tik hier om de PDF te openen’.":
      "PDF fertig. Download klappt nicht? Tippen Sie auf „Hier tippen, um das PDF zu öffnen“.",
    "Printvenster geopend. Kies ‘Opslaan als PDF’ voor een kopie.":
      "Druckdialog geöffnet. Wählen Sie „Als PDF sichern“ für eine Kopie.",
    "Link delen": "Link teilen",
    "Kopieer deze link:": "Diesen Link kopieren:",
    "Gedeeld.": "Geteilt.",
    "Equivalente stijfheid": "Äquivalente Steifigkeit",
    "Equivalent E": "Äquivalentes E",
    "vaste equivalente E": "festes äquivalentes E",
    "Onderlaag bestrating": "Pflasterbettung",
    "Dikte straatzand (max 20 cm)": "Dicke Bettungssand (max. 20 cm)",
    "Rekenwijze": "Rechenweise",
    "Rekenwijze ongewapende stijfheid": "Rechenweise unbewehrte Steifigkeit",
    "diepte onderkant": "Tiefe Unterkante",
    "Boven in het pakket": "Oben im Paket",
    "Totaal:": "Gesamt:",
    "Samen ": "Zusammen ",
    "Wapening aan": "Bewehrung ein",
    "Wapening uit": "Bewehrung aus",
    "Standaard fundering": "Standard-Tragschicht",
    "↩ Standaard fundering (geen Bims/schuimglas)": "↩ Standard-Tragschicht (kein Bims/Schaumglas)",
    "Schuimglas/Bims tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Schaumglas/Bims bis 1000 mm; die Tragschicht wächst mit, die Lastverteilungsschicht bleibt.",
    "Producthoogte van de cel — 100, 150 of 200 mm. Vulling boven de cel: max. 150 mm gewapend, de rest ongebonden.":
      "Produkthöhe der Zelle — 100, 150 oder 200 mm. Füllung über der Zelle: max. 150 mm bewehrt, der Rest ungebunden.",
    "Op de onderlaag kies je de wapening. De druklaag heeft standaard geogrid. Overhoogte blijft ongewapend.":
      "Die Bewehrung wählen Sie in der Unterschicht. Die Lastverteilungsschicht hat standardmäßig Geogitter. Die Überhöhung bleibt unbewehrt.",
  };

  const PAP = {
    "Romfix funderings rekenhulp": "Yudansa di kálkulo di fundeshi Romfix",
    "funderings rekenhulp": "yudansa di kálkulo di fundeshi",
    "Hoe werkt deze tool": "Kon e hèrment aki ta funshoná",
    "Klik een stap of de laag in het profiel.": "Klik un paso òf e kapa den e perfil.",
    "Klik op de laag die je wilt aanpassen.": "Klik e kapa ku bo ke kambia.",
    "Klik op de laag die je wilt aanpassen. Rechts wijzig je dikte, materiaal en wapening.":
      "Klik e kapa ku bo ke kambia. Na man drechi bo ta kambia dikte, material i refuerso.",
    "Vier stappen, onder → boven. Klik Open om direct naar de juiste laag te gaan.":
      "Kuater paso, di abou pa ariba. Klik Habri pa bai direktamente na e kapa korektu.",
    "Vier stappen, onder → boven. Klik <strong>Open</strong> om direct naar de juiste laag te gaan.":
      "Kuater paso, di abou pa ariba. Klik <strong>Habri</strong> pa bai direktamente na e kapa korektu.",
    "Klik op een laag in het profiel om te bewerken. W = wapening aan.":
      "Klik un kapa den e perfil pa editá. W = refuerso aktivá.",
    "Klik op een laag in het profiel om te bewerken. <strong>W</strong> = wapening aan.":
      "Klik un kapa den e perfil pa editá. <strong>W</strong> = refuerso aktivá.",
    "Stap 1 ondergrond, 2 verbetering, 3 fundering, 4 bovenbouw. Klik de laag die je wilt aanpassen.":
      "Paso 1 fondo, 2 mehorashon, 3 fundeshi, 4 konstrukshon ariba. Klik e kapa ku bo ke kambia.",
    "Verbetering": "Mehorashon",
    "Bovenbouw": "Konstrukshon ariba",
    "Ondergrond": "Fondo",
    "ondergrond": "fondo",
    "Ondergrond verbetering": "Mehorashon di fondo",
    "ondergrond verbetering": "mehorashon di fondo",
    "Fundering + overhoogte": "Fundeshi + altu ekstra",
    "Fundering": "Fundeshi",
    "fundering": "fundeshi",
    "Fundering /": "Fundeshi /",
    "Fundering ·": "Fundeshi ·",
    "Overhoogte": "Altu ekstra",
    "Overhoogte ·": "Altu ekstra ·",
    "Boven": "Ariba",
    "Bovenconstructie": "Konstrukshon ariba",
    "bovenconstructie": "konstrukshon ariba",
    "Bovenconstructie totaal": "Konstrukshon ariba total",
    "Onderconstructie": "Konstrukshon abou",
    "Profiel": "Perfil",
    "Open": "Habri",
    "Laat ongewapend zien": "Mustra sin refuerso",
    "Vergelijking onder het gewapende profiel, zelfde diktes.":
      "Komparashon bou di e perfil reforsá, mesun dikte.",
    "Gewapend": "Reforsá",
    "Ongewapend": "Sin refuerso",
    "gewapend": "reforsá",
    "ongewapend": "sin refuerso",
    "Gewapend t.o.v. ongewapend": "Reforsá kompará ku sin refuerso",
    "Gewapend → ongewapend": "Reforsá → sin refuerso",
    "Zonder wapening": "Sin refuerso",
    "Met wapening": "Ku refuerso",
    "Stijfheidstabel": "Tabela di rigidés",
    "Stijfheid fundering": "Rigidés di fundeshi",
    "Stijfheid": "Rigidés",
    "MPa per laag en stijfheidsfactor": "MPa pa kapa i faktor di rigidés",
    "Pakketdikte": "Grotesa di pakete",
    "Totale pakketdikte": "Grotesa total",
    "Gewicht": "Peso",
    "Gewichtcompensatie": "Kompensashon di peso",
    "Gewicht pakket": "Peso di pakete",
    "lichter": "mas lihé",
    "zwaarder": "mas pisa",
    "in balans": "na balanse",
    "Zelfde hoogte slappe klei": "Mesun altu di klei suave",
    "Maaiveld": "Nivel di tera",
    "maaiveld": "nivel di tera",
    "op de verharding": "na e belag",
    "onder de verharding": "bou di e belag",
    "onder het pakket": "bou di e pakete",
    "Maaiveld op de verharding": "Nivel di tera na e belag",
    "Maaiveld onder het pakket": "Nivel di tera bou di e pakete",
    "Hele pakket boven maaiveld, veen wordt niet afgetrokken":
      "Henter pakete ariba di nivel di tera, turba no ta wordu resta",
    "Slappe klei alleen in het cunet": "Klei suave solamente den e sleuf",
    "boven maaiveld telt volledig mee": "ariba di nivel di tera ta konta kompleto",
    "Printen / PDF": "Print / PDF",
    "Download PDF": "Deskargá PDF",
    "PDF maken…": "PDF ta wordu trahá…",
    "Mailen": "Manda e-mail",
    "Link delen": "Kompartí link",
    "Link gekopieerd.": "Link kopiá.",
    "Tik hier om de PDF te openen": "Tòch aki pa habri e PDF",
    "Projectnaam (voor PDF)": "Nòmber di proyekto (pa PDF)",
    "Projectnaam voor PDF en mail": "Nòmber di proyekto pa PDF i e-mail",
    "Profiel gewapend vs ongewapend": "Perfil reforsá vs. sin refuerso",
    "Waarden per laag": "Balor pa kapa",
    "Situatie": "Situashon",
    "Waarden": "Balornan",
    "Laag": "Kapa",
    "Dikte": "Grotesa",
    "Dikte (mm)": "Grotesa (mm)",
    "dikte": "grotesa",
    "Wapening": "Refuerso",
    "wapening": "refuerso",
    "Wap. (mm)": "Ref. (mm)",
    "Zonder": "Sin refuerso",
    "Met": "Ku refuerso",
    "Factor": "Faktor",
    "Invoer": "Entrada",
    "Onderdeel": "Parti",
    "Waarde": "Balor",
    "Toelichting": "Eksplikashon",
    "Materiaaltype": "Tipo di material",
    "Materiaal": "Material",
    "materiaal": "material",
    "— Kies materiaal —": "— Skohe material —",
    "Aangepast": "Adaptá",
    "Hydraulisch menggranulaat": "Granulát mesklá hidráuliko",
    "Steenslag/steenmengsels": "Piedra parti / meskla di piedra",
    "Goed gegradeerd zand": "Santu bon graduá",
    "Veen/slappe klei": "Turba / klei suave",
    "Vaste klei": "Klei duro",
    "Menggranulaat": "Granulát mesklá",
    "Betongranulaat": "Granulát di beton",
    "Metselwerkpuin": "Restu di muraya",
    "Schuimglas": "Glas di shuma",
    "Schuimglas / Bims": "Glas di shuma / Bims",
    "Schuimglas / puimsteen": "Glas di shuma / puimsteen",
    "Puimsteen": "Puimsteen",
    "Wapening schuimglas / puimsteen": "Refuerso glas di shuma / puimsteen",
    "↩ Standaard fundering (geen puimsteen/schuimglas)": "↩ Fundeshi estándar (sin puimsteen/glas di shuma)",
    "Argex": "Argex",
    "Wapening op de lichte laag": "Refuerso riba e kapa lihé",
    "Lichte laag tot 1000 mm; de fundering groeit mee, de druklaag blijft.":
      "Kapa lihé te 1000 mm; e fundeshi krese kuné, e kapa di preshon keda.",
    "Bims": "Bims",
    "Drainagemortel": "Mortel di drenáhe",
    "Straatzand": "Santu di kama",
    "straatzand": "santu di kama",
    "Bestrating": "Plaveimentu",
    "Asfalt": "Asfalt",
    "Beton": "Beton",
    "Split": "Split",
    "Deklaag, tussenlaag en onderlaag, elk apart.": "Kapa di dek, kapa di mei i kapa abou, kada un apart.",
    "Asfaltlagen": "Kapanan di asfalt",
    "Asfalt totaal": "Asfalt total",
    "Asfalt totaal:": "Asfalt total:",
    "Elke laag apart.": "Kada kapa apart.",
    "Deklaag": "Kapa di dek",
    "Tussenlaag": "Kapa di mei",
    "3 lagen": "3 kapa",
    "Zand": "Santu",
    "Bestrating + fundering": "Plaveimentu + fundeshi",
    "Asfalt + fundering": "Asfalt + fundeshi",
    "Beton + fundering": "Beton + fundeshi",
    "Klinkers + fundering": "Plaveimentu + fundeshi",
    "Constructietype": "Tipo di konstrukshon",
    "Toplaag": "Kapa ariba",
    "toplaag": "kapa ariba",
    "Kies toplaag": "Skohe kapa ariba",
    "Wapening fundering": "Refuerso di fundeshi",
    "Wapening OGV": "Refuerso di mehorashon di fondo",
    "Geen wapening": "Sin refuerso",
    "Geen wapening op deze laag": "Sin refuerso riba e kapa aki",
    "Alleen geogrid": "Solamente geogrid",
    "Alleen geocel": "Solamente geocel",
    "Wapening druklaag": "Refuerso di kapa di preshon",
    "Romfix-systeem": "Sistema Romfix",
    "Los van de wapening op de fundering. Standaard geogrid bij een gewapende fundering.":
      "Apartá di e refuerso di e fundeshi. Geogrid ta estándar ora e fundeshi ta refuersá.",
    "Op de onderlaag kies je de wapening. De druklaag stel je hierboven apart in. Overhoogte blijft ongewapend.":
      "Skohe e refuerso riba e kapa abou. E kapa di preshon bo ta seté ariba, apartá. E altu ekstra ta keda sin refuerso.",
    "Geogrid + geocel": "Geogrid + geocel",
    "gewapende celhoogte": "altu di sel reforsá",
    "gewapende overhoogte": "altu ekstra reforsá",
    "ongewapende overhoogte": "altu ekstra sin refuerso",
    "Onderlaag": "Kapa abou",
    "Onderlaag ·": "Kapa abou ·",
    "Druklaag": "Kapa di preshon",
    "Druklaag ·": "Kapa di preshon ·",
    "E-modulus": "E-módulo",
    "E-modulus bestaande bodem — geen dikte.": "E-módulo di e tera eksistente — sin dikte.",
    "Dikte + vulmateriaal, optioneel wapening.": "Dikte + material di yena, refuerso opsional.",
    "Nominale dikte + overhoogte. R'Cel 100/150/200 mm, werkingsdikte standaard 300 mm.":
      "Dikte nominal + altu ekstra. R'Cel 100/150/200 mm, dikte efektivo 300 mm standar.",
    "Eén toplaag; telt in dikte, niet in Romfix-stijfheid.":
      "Un kapa ariba; e ta konta den dikte, no den rigidés di Romfix.",
    "× sterker": "× mas rígid",
    "sterker": "mas rígid",
    "indicatief": "indikativo",
    "werkboek": "buki di trabou",
    "Romfix funderings rekenhulp v2.3 · indicatief": "Yudansa di kálkulo di fundeshi Romfix v2.3 · indikativo",
    "Taal": "Idioma",
    "Nederlands": "Hulandes",
    "Engels": "Ingles",
    "Deens": "Danes",
    "Duits": "Aleman",
    "Papiaments": "Papiamentu",
    "Expert mode": "Modo eksper",
    "Standaard modus": "Modo standar",
    "Inklappen": "Sera",
    "Uitklappen": "Habre",
    "Annuleren": "Kanselá",
    "Inloggen": "Drenta",
    "Wachtwoord": "Kontraseña",
    "Onjuist wachtwoord.": "Kontraseña robes.",
    "Aan": "Aktivá",
    "Uit": "Apagá",
    "geen": "nada",
    "Kies": "Skohe",
    "Project": "Proyekto",
    "Laagmodel gewapend": "Modelo di kapa reforsá",
    "Laagmodel ongewapend": "Modelo di kapa sin refuerso",
    "Lagen": "Kapanan",
    "Stijfheid": "Rigidés",
    "Equivalent E": "E ekuivalente",
    "Geen bindende projectberekening": "No ta un kalkulashon di proyekto obligatorio",
    "Romfix B.V. · www.romfix.nl · geen bindende projectberekening":
      "Romfix B.V. · www.romfix.nl · no ta un kalkulashon di proyekto obligatorio",
    "PDF klaar. Werkt de download niet? Tik op ‘Tik hier om de PDF te openen’.":
      "PDF kla. Deskarga no ta funshoná? Tòch ‘Tòch aki pa habri e PDF’.",
    "Link delen": "Kompartí link",
    "Wapening aan": "Refuerso aktivá",
    "Wapening uit": "Refuerso apagá",
    "Verschil gewapend t.o.v. ongewapend": "Diferensia reforsá kompará ku sin refuerso",
    "Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.":
      "Romfix ta rekomendá un paña di separashon R'tex na kada transishon di material di fundeshi.",
    "Romfix-advies (lichte ophoging)": "Romfix advice (lightweight fill)",
    "Gebruik Argex (of vergelijkbaar) als ophoging tot bodemniveau, omwikkeld in zwaar geotextiel met ca. 1 m overlap/inklemming. Daarboven een druklaag van menggranulaat 0/31,5 met 150 mm PRS-Neoloy / Romfix-cel gevuld met menggranulaat, plus ca. 200 mm menggranulaat erboven. Scheiding met R'tex bij elke materiaalsprong. Asfaltvoorbeeld: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.":
      "Use Argex (or similar) as fill up to ground level, wrapped in heavy geotextile with about 1 m overlap/anchorage. Above that, a load-distribution layer of mixed granulate 0/31.5 with a 150 mm PRS-Neoloy / Romfix cell filled with mixed granulate, plus about 200 mm of mixed granulate on top. Separate with R'tex at every material transition. Asphalt example: 35 mm SMA-NL 11 · 60 mm AC22 bind · 90 mm AC22 base.",
    "Indicatieve Romfix-berekening (werkboek v2.3). Geen bindende projectberekening. Controleer met ontwerp, verkeersklasse en sondering. Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.":
      "Kalkulashon indikativo di Romfix (buki di trabou v2.3). No ta un kalkulashon di proyekto obligatorio. Kontrolá ku diseño, klase di tráfiko i sondeo. Romfix ta rekomendá un paña di separashon R'tex na kada transishon di material di fundeshi.",
  };

  const PACKS = { en: EN, da: DA, de: DE, pap: PAP };
  const LANGS = { nl: 1, en: 1, da: 1, de: 1, pap: 1 };

  function pairsOf(code) {
    const pack = PACKS[code];
    if (!pack) return [];
    return Object.keys(pack)
      .sort(function (a, b) {
        return b.length - a.length;
      })
      .map(function (nl) {
        return [nl, pack[nl]];
      });
  }

  let lang = "nl";
  let pairs = [];

  function isTranslated() {
    return lang !== "nl";
  }

  function readLang() {
    try {
      const u = new URL(location.href);
      const q = (u.searchParams.get("lang") || "").toLowerCase();
      if (LANGS[q]) return q;
    } catch (_) {}
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (LANGS[s]) return s;
    } catch (_) {}
    return "nl";
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) {}
    try {
      const u = new URL(location.href);
      if (lang === "nl") u.searchParams.delete("lang");
      else u.searchParams.set("lang", lang);
      history.replaceState(null, "", u.toString());
    } catch (_) {}
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-ui-lang", lang);
  }

  function isBound(ch) {
    return !ch || /[^A-Za-zÀ-ÿ]/.test(ch);
  }

  function replacePhrase(hay, needle, rep) {
    if (!needle || hay.indexOf(needle) === -1) return hay;
    let out = "";
    let i = 0;
    while (i < hay.length) {
      const j = hay.indexOf(needle, i);
      if (j < 0) {
        out += hay.slice(i);
        break;
      }
      const left = j === 0 ? "" : hay.charAt(j - 1);
      const right = hay.charAt(j + needle.length);
      if (isBound(left) && isBound(right)) {
        out += hay.slice(i, j) + rep;
        i = j + needle.length;
      } else {
        out += hay.slice(i, j + needle.length);
        i = j + needle.length;
      }
    }
    return out;
  }

  function tMix(text) {
    if (!isTranslated() || text == null) return text == null ? "" : String(text);
    let out = String(text);
    if (!out) return out;
    for (let i = 0; i < pairs.length; i++) {
      out = replacePhrase(out, pairs[i][0], pairs[i][1]);
    }
    return out;
  }

  function t(s) {
    if (s == null) return "";
    const raw = String(s);
    if (!isTranslated()) return raw;
    const pack = PACKS[lang] || {};
    if (Object.prototype.hasOwnProperty.call(pack, raw)) return pack[raw];
    return tMix(raw);
  }

  function translateNode(root) {
    if (!root || !isTranslated()) return;
    const skip = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1 };
    function walk(node) {
      if (!node) return;
      if (node.nodeType === 3) {
        const next = tMix(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName;
      if (skip[tag]) return;
      if (node.hasAttribute("data-no-i18n")) return;
      if (
        node.hasAttribute("data-i18n") ||
        node.hasAttribute("data-i18n-html") ||
        node.hasAttribute("data-i18n-placeholder")
      ) {
        return;
      }
      ["placeholder", "aria-label", "title", "alt"].forEach(function (attr) {
        if (!node.hasAttribute(attr)) return;
        if (node.hasAttribute("data-i18n-aria") && attr === "aria-label") return;
        const v = node.getAttribute(attr);
        const n = tMix(v);
        if (n !== v) node.setAttribute(attr, n);
      });
      if (tag === "INPUT" || tag === "SELECT") {
        node.childNodes.forEach(walk);
        return;
      }
      node.childNodes.forEach(walk);
    }
    walk(root);
  }

  function snapshotStatic() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (!el.hasAttribute("data-i18n-src")) {
        el.setAttribute("data-i18n-src", el.textContent);
      }
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      if (!el.hasAttribute("data-i18n-src")) {
        el.setAttribute("data-i18n-src", el.innerHTML);
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      if (!el.hasAttribute("data-i18n-ph-src")) {
        el.setAttribute("data-i18n-ph-src", el.getAttribute("placeholder") || "");
      }
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      if (!el.hasAttribute("data-i18n-aria-src")) {
        el.setAttribute("data-i18n-aria-src", el.getAttribute("aria-label") || "");
      }
    });
    if (!document.documentElement.getAttribute("data-title-nl")) {
      document.documentElement.setAttribute("data-title-nl", document.title);
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta && !meta.getAttribute("data-i18n-src")) {
      meta.setAttribute("data-i18n-src", meta.content);
    }
  }

  function applyStatic() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const src = el.getAttribute("data-i18n-src");
      if (src == null) return;
      el.textContent = isTranslated() ? tMix(src) : src;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      const src = el.getAttribute("data-i18n-src");
      if (src == null) return;
      el.innerHTML = isTranslated() ? tMix(src) : src;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      const src = el.getAttribute("data-i18n-ph-src");
      if (src == null) return;
      el.setAttribute("placeholder", isTranslated() ? tMix(src) : src);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const src = el.getAttribute("data-i18n-aria-src");
      if (src == null) return;
      el.setAttribute("aria-label", isTranslated() ? tMix(src) : src);
    });
    const titleSrc = document.documentElement.getAttribute("data-title-nl");
    if (titleSrc != null) {
      document.title = isTranslated() ? tMix(titleSrc) : titleSrc;
    }
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      const src = meta.getAttribute("data-i18n-src");
      if (src != null) meta.content = isTranslated() ? tMix(src) : src;
    }
  }

  function syncButtons() {
    document.querySelectorAll(".lang-btn[data-lang]").forEach(function (btn) {
      const on = btn.getAttribute("data-lang") === lang;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
  }

  let epoch = 0;
  let scheduled = 0;

  function apply() {
    applyStatic();
    syncButtons();
    if (isTranslated()) translateNode(document.body);
  }

  function flushLang() {
    scheduled = 0;
    persist();
    if (typeof window.RomfixI18n.onChange === "function") {
      window.RomfixI18n.onChange(lang);
    } else {
      apply();
    }
  }

  function setLang(next) {
    const n = LANGS[next] ? next : "nl";
    lang = n;
    pairs = pairsOf(lang);
    syncButtons();
    epoch += 1;
    if (scheduled) cancelAnimationFrame(scheduled);
    scheduled = requestAnimationFrame(flushLang);
  }

  function bind() {
    document.querySelectorAll(".lang-btn[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(btn.getAttribute("data-lang"));
      });
    });
    syncButtons();
  }

  snapshotStatic();
  lang = readLang();
  pairs = pairsOf(lang);
  persist();
  syncButtons();

  window.RomfixI18n = {
    t: t,
    tMix: tMix,
    lang: function () {
      return lang;
    },
    setLang: setLang,
    apply: apply,
    bind: bind,
    onChange: null,
  };
})();
