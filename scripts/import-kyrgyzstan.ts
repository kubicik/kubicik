/**
 * Import script for the 2025 Kyrgyzstan trip from GPX data.
 */
import path from "path"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../src/generated/prisma/client"
import dotenv from "dotenv"

dotenv.config()

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`
  const authToken = process.env.TURSO_AUTH_TOKEN
  const adapter = new PrismaLibSql(authToken ? { url, authToken } : { url })
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])
}

const stops = [
  {
    title: "«Manas» International Airport",
    lat: 43.059247,
    lng: 74.47619,
    date: new Date("2025-07-06"),
    description: null,
  },
  {
    title: "Burana Tower",
    lat: 42.746429,
    lng: 75.250082,
    date: new Date("2025-07-06"),
    description: `Naše první zastávka po příletu do Biškeku – věž Burana, jeden z nejvýznamnějších historických památníků Kyrgyzstánu. Bylo něco po osmé ráno, a protože jsme přistáli ve 4:15, byli jsme rádi, že jsme holky vůbec přenesli do auta. V autě spal i zbytek posádky, takže jejich přesun k věži připomínal spíš vykládku zavazadel než rodinný výlet. Ale vzduch byl svěží, slunce nízko a před námi se tyčila 25-metrová cihlová věž, která kdysi bývala součástí města Balasagun – centra karachanského chanátu z 9.–11. století.

Původní výška minaretu byla prý až 45 metrů, ale zemětřesení v 15. století ho značně zkrátilo. Uvnitř věže vede točité a velmi úzké schodiště – na výměnu názorů se tu není prostor, takže se čeká, než někdo sleze, nebo vyleze. Je to krátký, ale intenzivní výstup.

Z vrcholu věže se otevírá krásný výhled na okolní planinu, zemědělská pole a siluetu hor na obzoru – překvapivě klidné a fotogenické místo. Dětem se nahoře líbilo, i když Michaela pro jistotu poznamenala, že dolů už nikdy nepůjde. A jako třešnička na dortu: pod věží postává pán s majestátním orlem. Za malý poplatek si ho můžete vyfotit na ruce – orla, ne pána – a děti mají první kontakt s místní faunou vyřešen.`,
  },
  {
    title: "Konorchek kaňon",
    lat: 42.595013,
    lng: 75.780277,
    date: new Date("2025-07-06"),
    description: `Tahle výprava začala skoro symbolicky – v kaňonu Konorchek jsme potkali český pár z Pardubic, kteří svou cestu po Kyrgyzstánu právě končili. Naše naopak teprve začínala – a lepší úvod jsme si snad ani nemohli přát. Čekala nás zhruba 10km túra nádherným prostředím – skalní brány, úzké soutěsky, přelézačky i lanové úseky. Všechno, co děti milují (a dospělí trochu míň).

Emička, Mája i Míša šly výborně – tempo si držely samy, bavilo je objevovat cestu, prolézat terén a překonávat překážky. Možná to byl i nejlepší lék na časový posun – místo aby řešily, že je pět ráno podle našeho těla, soustředily se na to, jak přelézt další balvan nebo kam povede stezka dál. Rodiče v závěsu, samozřejmě.

Trasa do kaňonu není oficiálně značená, ale dá se dobře sledovat – vede vyschlým korytem řeky a pak lehkým stoupáním k majestátním červeným skalám. V odpoledním světle doslova žhnou. Vhodné boty, hodně vody, opalovací krém a offline mapa jsou nutnost – stín je vzácný a signál neexistuje.`,
  },
  {
    title: "Cholpon-Ata",
    lat: 42.642528,
    lng: 77.084636,
    date: new Date("2025-07-06"),
    description: `Po příjezdu na ubytování v Cholpon-Atě jsme dospělí padli jako šutry, ale holky měly ještě energie na rozdávání. Zatímco my bojovali s únavou a cestovní realitou, Ema, Mája i Míša rozjely fotbal na zahradě a ještě stihly menší průzkum u jezera. Přistání u Issyk-Kulu jak má být – klid, voda, balón a dětská výdrž.`,
  },
  {
    title: "Petroglyfy muzeum",
    lat: 42.658037,
    lng: 77.057386,
    date: new Date("2025-07-07"),
    description: `Petroglyfy v Cholpon-Atě nás příjemně překvapily. Původně jsme šli „jen mrknout na pár kamenů s obrázky", ale z výletu se stal malý archeologický lov. Emi, Mája i Míša byly úplně pohlcené hledáním rytin – běhaly mezi balvany a každou objevenou kresbu slavily jako objev století. A jak známe ty dvě starší, Mája a Emi si tyto výjevy kamzíků a slunečních symbolů zapsaly hluboko do paměti – až podezřele hluboko.

Samotný areál je rozlehlý – cca 42 hektarů otevřené krajiny s tisíci let starými skalními rytinami, z nichž některé sahají až do 800 př. n. l. Problém je, že značení funguje hlavně v přední části – dál už se hledá stylem „přibližně tu někde to je". Takže i když jsme chtěli najít „všechny petroglyfy", brzy jsme pochopili, že nám bude muset stačit vzorek. Přesto je to fascinující místo – ticho, výhled na hory a kameny, které vyprávějí příběhy staré tisíce let.

Rozhodně doporučujeme ráno nebo večer – v poledne se krajina mění ve sluneční gril. A pokud máte děti, určitě je vezměte – tady se kombinuje dobrodružství, kultura a pohyb v jednom. A když najdete jeleny nebo slunce vyryté do kamene, zažijete ten moment „kouzla cestování".`,
  },
  {
    title: "Bosteri pláž",
    lat: 42.64823,
    lng: 77.192385,
    date: new Date("2025-07-07"),
    description: `Pláž v Bosteri je všechno, jen ne klidné horské jezero – a právě to z ní dělá zážitek. Koupání v Issyk-Kulu tady probíhá uprostřed kolotočů, stánků s rybou, vařenou kukuřicí, cukrovou vatou. Všude spousta lidí, slunečníků, šumící hudba – ale místo má kouzlo. Je to taková středoasijská verze Riviéry s nádechem divočiny.

Loďky a vodní skútry projíždějí jen pár metrů od břehu, což možná není úplně bezpečnostní sen rodiče, ale děti to nadchlo. Voda je krásně čistá, teplá a osvěžující. Pláž je písečná s mělkým vstupem, ideální pro děti. Bosteri je možná trochu bláznivá, ale i díky tomu má šmrnc.`,
  },
  {
    title: "Chon Ak-Suu (Grigor'yevskoye Gorge)",
    lat: 42.828431,
    lng: 77.446328,
    date: new Date("2025-07-07"),
    description: `Údolí Chon-Ak-Suu (nebo také Grigorievské) nás přivítalo pozvolna – silnice sjízdná, výběrčí u vjezdu (cca 100 som za auto + dospělí) nás zdraví s úsměvem a zvoláním „Alláh akbar" – jiný svět, ale pohodová atmosféra. Údolím se vine divoká řeka, kolem ní desítky jurtových kempů, pasoucí se koně, ovce a občas ztracený turista.

My jsme to brali až dozadu – co to šlo. Cesta postupně ztrácela asfalt, štěrk, smysl… a pak jsme přejeli most, který držel silou vůle a víry. Tam nás okamžitě odchytili místní chlapi s koňmi. Po krátkém, ale intenzivním vyjednávání (a mávání rukama) jsme vzali 6 koní – každý měl svého, holky (Emička, Mája, Míša) dostaly malé vodiče a vyrazili jsme k jezeru. 2 hodiny v sedle – pro děti dobrodružství, pro rodiče tak trochu fyzická výzva.

Po návratu jsme zkusili popojet ještě dál – silnice spíš „nesilnice", ale zahlédli jsme krásnou jurtu u řeky a jeli se zeptat. Místo bylo plné, ale domácí nám s klidem vyklidili svou vlastní jurtu a rovnou začali vařit večeři. Rýže s masem, servírovaná stylově do čajových misek – kulturní zážitek i malý logistický oříšek. Všichni se najedli, smáli, holky měly radost, jen na mě a Věrku nezbyla matrace – a tak každé otočení v noci bylo připomínkou, že kyrgyzský komfort má svá pravidla.

Ráno nás probudilo slunce, vůně ohně a stádo ovcí, které se prohánělo kolem jurty. Když jsme se rozloučili, cítili jsme vděk a možná i trochu dojetí – tohle nebylo jen přespání, ale opravdový zážitek pohostinnosti. A pak už směr Karakol.`,
  },
  {
    title: "Karakol",
    lat: 42.491681,
    lng: 78.390173,
    date: new Date("2025-07-08"),
    description: null,
  },
  {
    title: "Jeti-Ögüz (Sedm býků)",
    lat: 42.339038,
    lng: 78.238133,
    date: new Date("2025-07-08"),
    description: `Jeti-Ögüz – neboli „Sedm býků" – patří k nejznámějším přírodním scenériím Kyrgyzstánu. Sedm rudých skalních věží vyrůstá z krajiny jako z pohádky. Jenže… my jich napočítali víc. Ema řekla devět, Míša možná deset a Mája navrhla, že některé se asi počítají dvakrát. Pravděpodobně nejsme první, kdo v tom nemá jasno – a právě tím je to místo tak zábavné.

Podle legendy skály vznikly ze sedmi býků patřících jednomu chánovi, který kvůli žárlivosti nechal zabít krásnou dívku, jež ho zradila s jiným. Po jejím smrti se země otřásla a stádo bylo proměněno v kámen – symbol hněvu, bolesti a osudu, který nikdo neunikne. Každý z býků má být jiný – silný, pokorný, vzdorovitý… možná proto ten počet nikdy nesedí.

Na místo jsme dorazili autem – vyhlídka je hned u silnice, ideální na zastavení během dne. Pro děti úžasné místo – velkolepé, s příběhem a ideální pro debatu „co vlastně vidíme". Třeba to nakonec opravdu není o číslech.`,
  },
  {
    title: "Ak-Suu termály",
    lat: 42.458927,
    lng: 78.541356,
    date: new Date("2025-07-08"),
    description: `Po dlouhém dni na cestách nebo v sedle jsme si zasloužili trochu odpočinku – a termály v Ak-Suu byly perfektní volba. Leží jen pár kilometrů od Karakolu a jsou jedny z nejznámějších v oblasti. Voda tu má teplotu kolem 40 °C a vytéká z přírodního minerálního pramene, který je využíván už od sovětských dob.

Areál není úplně moderní – připomíná spíš retro lázně z 80. let, ale vše je čisté a funkční. Celkově skvělá večerní zastávka – není to wellness resort, ale zážitek rozhodně ano.`,
  },
  {
    title: "Karakol – město",
    lat: 42.489078,
    lng: 78.384374,
    date: new Date("2025-07-09"),
    description: `V Karakolu jsme zůstali dvě noci – a bylo to přesně tak akorát. Jeden celý den jsme si rezervovali na město samotné. Žádné přesuny, žádné hory, žádné brody – jen městský život, kultura a volné toulání.

Ráno jsme začali stylově – snídaní v Altyn Kumara, kterou jsme si okamžitě zamilovali a večer tam zamířili znovu. Výborné jídlo, vstřícná obsluha a zázemí, které potěší i unaveného cestovatele s dětmi (a s chutí na něco víc než instantní nudle).

První zastávka pak vedla na trh – místo, které má vlastní duši. Není to jen tržiště, je to živý organismus. Směsice vůní, lidí, barev a zvuků. Holky sledovaly ovoce a ořechy, my ceny a kvalitu. K tomu projel tuk-tuk, který vypadal, že místo benzínu jezdí na výpary z gumy a černé magie. Ale všechno dohromady to dávalo smysl. Tady to byl Kyrgyzstán bez filtru.

Poté jsme zamířili za duchovnem – pravoslavný kostel s krásnou architekturou a Dunganova mešita, postavená bez jediného hřebíku. Stejně jako jurty – tady se prostě ví, jak spojit věci pevně i bez železa. Obě stavby zaujaly děti i dospělé – každá jiným způsobem, ale obě zapůsobily.

V rámci poznávání jsme se mrkli i do regionálního muzea. Prošli jsme ho rychleji, protože děti už tahaly za nohy, ale přesto nabídlo pěkný přehled historie, kultury i sovětských stop. Zoo jsme zařadili jako oddechovku – příjemná malá zahrada, která nezabere mnoho času, ale děti pobaví a nás zaujal lev a medvědi.

Na závěr jsme došli k čerstvě otevřenému stadionu – moderní, čistý, vonící novotou. S míčem v ruce jsme si prošli okolí, koukli na trávník a zhodnotili, že tu rozhodně roste další fotbalová generace (i když bez dresů Tottenhamu to asi nepůjde).

Večer jsme to zpečetili další návštěvou Altyn Kumara, skvělou večeří a pocitem, že Karakol jsme stihli za den, ale poznali víc než v některých jiných městech za tři.`,
  },
  {
    title: "Altyn Arashan (parking)",
    lat: 42.452087,
    lng: 78.533359,
    date: new Date("2025-07-10"),
    description: null,
  },
  {
    title: "Altyn Arashan",
    lat: 42.372149,
    lng: 78.612159,
    date: new Date("2025-07-10"),
    description: `Náš cíl byl jasný – Altyn-Arashan, legendární horské údolí s termálními prameny a jedním z nejhezčích výhledů v celé oblasti. Jenže jak už to v Kyrgyzstánu bývá, realita se neptá. Po pokusu dojet co nejblíž autem jsme narazili na kameny, které vypadaly spíš jako zkouška podvozku rallye kamionu. Vzdáváme to, chybí 13 kilometrů – jdeme pěšky.

Po cestě nás míjely brutální terénní vozy, které skákaly přes balvany, zatímco my jsme šlapali s dětmi, batohy a vírou v krásu cíle. Prostředí bylo nádherné – řeka, lesy, výhledy – ale kolem 5. kilometru nás chytila přeháňka. Déšť trval asi dvě kilometry, pak se počasí umoudřilo a my se po cca třech hodinách dostali až nahoru. Otevřel se nám výhled do údolí jako z pohádky: mezi jurtami, zelení a horami tu probublávají termální prameny.

Jenže... veřejné přístupy k termálům téměř neexistují. Kdo tu má „lázně", postavil si zastřešenou kulnu, kterou pronajímá. Do jedné z nich jsme alespoň nakoukli, ale s dětmi to nedávalo smysl. Místo toho dostaly Emička, Mája a Míša zaslouženou odměnu – půlhodinovou projížďku na koních.

Po projížďce jsme věděli, že pršet bude znovu – a taky že jo. Nejdřív slabý déšť, pak silnější… a pak už jen pořádný liják. Zbytek cesty jsme šli úplně promočení – dešťovky nám tekly do bot a nálada se držela jen díky holkám, které si sice postěžovaly (a kdo by ne!), ale statečně kráčely dál. Žádné drama, žádná scéna – jen „když už, tak jdeme".

Po 8–9 kilometrech jsme konečně dorazili k autu. Byli jsme durch, ale plní hrdosti. Děti to zvládly líp než leckterý dospělý. A my jsme věděli, že na tenhle den jen tak nezapomeneme.`,
  },
  {
    title: "Altyn Arashan (parking) – návrat",
    lat: 42.452123,
    lng: 78.533367,
    date: new Date("2025-07-10"),
    description: null,
  },
  {
    title: "Ak-Terek",
    lat: 42.234951,
    lng: 77.71867,
    date: new Date("2025-07-10"),
    description: null,
  },
  {
    title: "Skazka (pohádkový kaňon)",
    lat: 42.156401,
    lng: 77.354071,
    date: new Date("2025-07-11"),
    description: `Pohádkový kaňon Skazka dělá čest svému jménu – barevné skály, labyrint cestiček a scenérie jako z jiného světa. Místy to chtělo trochu lezeckého ducha, ale děti i dospělí si se vším poradili. Slunce svítilo, foťáky jely naplno a fantazie pracovala na plné obrátky.`,
  },
  {
    title: "Salburun (orlí show)",
    lat: 42.104445,
    lng: 76.789617,
    date: new Date("2025-07-11"),
    description: `Orlí show Salburun patří k těm zážitkům, které vás překvapí hloubkou tradice i samotným provedením. Nejde jen o to, že se vám nad hlavou proletí orel s rozpětím křídel přes metr a půl – jde i o celý příběh za tím.

Během show nám průvodce vysvětlil, že k lovu se používají výhradně samice orla – jsou větší, silnější a chytřejší než samci. Výcvik trvá přibližně tři měsíce, ale vztah s trenérem pak trvá klidně 20 let. A to nejlepší? Po této době je orel vypuštěn zpět do volné přírody, aby zakončil život svobodně. Věrnost se u orlů nečeká – vztah je pevný, ale vždy s respektem k přirozenosti.

Kromě orlů jsme viděli i výcvik tradičních pasteveckých psů, kteří s orlem spolupracují. Fascinující tým – každý ví, co má dělat, žádná přetahovaná ega (na rozdíl od nás lidí). Když orel loví, nikdy to není jen pro zábavu – vždy dostane čerstvé maso jako odměnu. A že to dělal s chutí, to děti poznaly hned.

Pro Emičku, Máju i Míšu to byla magická zkušenost – zvířata, tradice, příběh. A když se na konci mohly s orlem i vyfotit, bylo jasno – jeden z vrcholů dne. I pro nás dospělé – protože koukat se orlovi do očí zblízka, to není každý den.`,
  },
  {
    title: "Tuz-Köl (slané jezero)",
    lat: 42.252592,
    lng: 76.748407,
    date: new Date("2025-07-11"),
    description: `Tuz-Köl na první pohled moc krásy nepobral – žádné pláže, spíš bláto a sůl. Ale právě proto jsme přijeli: vyzkoušet si vlastní kyrgyzské Mrtvé moře. Jezero nemá žádný přítok ani odtok, a protože voda pomalu vysychá, sůl se tu hromadí – výsledkem je extrémní slanost a tělo, které plave samo.

Míše to šlo nejlíp – ležela jak na matraci. Emi se snažila držet balanc a Mája to radši po pár minutách vzdala se slovy „to je fakt divný". Bláto mezi prsty, sůl všude a smích z toho, jak se nedá normálně ponořit – z Tuz-Kölu si odnášíme netradiční, ale památný zážitek.`,
  },
  {
    title: "Ak-Sai kaňon",
    lat: 42.201792,
    lng: 76.872123,
    date: new Date("2025-07-11"),
    description: `Z Tuz-Kölu jsme vyrazili po pobřeží směrem ke kaňonu Ak-Sai – podle knihy offroad obtížnosti 4, což by normálně šlo. Jenže ta nepočítala s tím, že letošní deště cestu vymlely tak, že z ní zbyla drsná jízda plná kamenů a děr. Bahno nebylo, ale trať si vzala, co mohla. Místy jsme zvládli víc, než jsme čekali – ale jeden úsek nás zastavil.

Auto dostalo pár šrámů a já rychle pochopil, že na takový výjezd nemám potřebné řidičské schopnosti. Naštěstí s námi byli dva zkušení offroaďáci – ne že by nás tahali, ale vzájemně si pomáhali a nám ukázali, co s autem vůbec jde dělat. Přepínali si podvozky jak ze sci-fi filmu a nám pomohli vyjet tím, že poradili a ukázali správnou stopu. Respekt.

Když jsme konečně dorazili do samotného kaňonu Ak-Sai, byl nádherný – klidný, průjezdný, s krásnou krajinou. Po všem tom napětí jako odměna. Zážitek, na který se nezapomíná – a člověk si zapamatuje i to, že přepínač „režim podvozku" není jen marketing.`,
  },
  {
    title: "Kyzyl-Tuu",
    lat: 42.184331,
    lng: 76.673326,
    date: new Date("2025-07-11"),
    description: `Po dlouhém dni jsme dorazili do Kyzyl-Tuu – nenápadné vesnice, která je vlastně národní továrnou na výrobu jurt. Každý tu dělá něco – někdo ohýbá dřevo, jiný plete stěny, další šije plstěné krytiny. Ať jste kdekoli, pravděpodobně jste pár metrů od vznikající jurty.

Ubytování jsme našli útulné a pohodlné, a hlavně s neuvěřitelně milou paní domácí. Hned se pustila do večeře, a ta byla skvělá – vydatná, domácí, s péčí. Ráno jsme dostali snídani a pak nás vzala ven: ukázala nám vlastní jurty, suvenýry a vysvětlila celý proces stavby jurty – od ohýbání dřeva po finální montáž. Holky koukaly s otevřenou pusou a my taky – tolik ruční práce, tradice a hrdosti.

Na rozloučenou nám ještě zabalila tašku ovoce a poslala nás dál. Z Kyzyl-Tuu jsme odjížděli s pocitem, že jsme nakoukli pod pokličku něčemu opravdovému. A to se počítá.`,
  },
  {
    title: "Kochkor",
    lat: 42.214226,
    lng: 75.752981,
    date: new Date("2025-07-12"),
    description: `Přejezd do Kočkoru byl klidnější – nutně. Emičku přepadla horečka a bylo jasné, že den bude ve znamení odpočinku a regenerace. Cesta ale i tak nabídla krásné výhledy – fascinovala nás stavba železnice, která se zařezává přímo do skal a vytváří působivý kontrast mezi technikou a krajinou. Objevili jsme také vodní rezervoár, který krajinu neruší, ale naopak ji doplňuje – příjemné místo na chvíli ticha.

Zatímco Emička odpočívala, řešili jsme, jak zabavit Máju a Míšu. A našli jsme parádní řešení: dílna na výrobu tradičních koberců. Děvčata okamžitě zaujaly barvy, vzory, ruční práce i samotné prostředí. Strávily tam čas plně soustředěné a nadšené – bylo to přesně to, co potřebovaly. A my taky.

Ráno pak Emička vstala svěží a usměvavá – pravou nohou přímo zpět do dobrodružství. Kočkor se tak stal nejen odpočinkem, ale i malým vítězstvím nad horečkou a důkazem, že i klidnější den má na cestě svoje místo.`,
  },
  {
    title: "Terskey Torpok 3132 m",
    lat: 41.732059,
    lng: 75.428267,
    date: new Date("2025-07-13"),
    description: `Cesta k Son-Kulu přes průsmyk Terskey Torpok byla přesně taková, jakou jsme si přáli – malebná, klidná a s každým kilometrem krásnější. Krajina se zvedá do výšky přes 3100 metrů, mění se v holé pláně s pasoucími se koňmi a jurtami v dálce.

Na několika místech jsme zastavili – nejen kvůli výhledům, ale i díky krásným setkáním. Holky u jedné jurty rozdaly bonbony místním dětem, které si je nejdřív trochu stydlivě, ale pak s radostí převzaly. Okamžitě vznikl úsměv na obou stranách. Chvíli jsme pak pozorovali místní koně – blízko, volně, s elegancí, která patří k téhle krajině stejně jako hory.

Terskey Torpok nebyl jen průjezd – byl to zážitek. Vzpomínka na výšku, přírodu a krátké lidské spojení. Son-Kul se blížil – ale už samotná cesta za to stála.`,
  },
  {
    title: "Son-Kul",
    lat: 41.766772,
    lng: 75.138345,
    date: new Date("2025-07-13"),
    description: `Son-Kul nás přivítal v celé své kráse – otevřená krajina, tyrkysové jezero, nekonečné nebe. Našli jsme náš kemp a hned i vlastní jurtu, která se stala základnou pro všechno další. První na řadě byl piknik – konzerva s červenými rybičkami se stala nečekaným hitem, doladili jsme to melounem a míčem. Fotbal, smích a první kontakt s volností planiny.

Brzy poté dorazil pastevec a domluvili jsme si hodinovou jízdu na koních – každé z holek mělo vlastního, jen Verča s Emičkou dostaly trochu živější kousek, který vyžadoval plnou pozornost. Míša si mezitím klidně jezdila mezi stádem ovcí, jako by tam patřila odjakživa. Atmosféra dokonalá – vítr, koně, prostor.

Večer nás čekalo překvapení – hvězdná obloha, jakou člověk z Česka nezná. Ticho, světla žádná, jen vesmír nad hlavou. Ráno snídaně a procházka k jezeru, kolem zvířat a jurt. Holky začaly mluvit o tom, že by chtěly vidět kok-boru – místní jezdeckou hru s kozou místo míče. Překvapení? Nečekali jsme, že to budou chtít ony.

Ve vedlejším táboře to ale dokázali zorganizovat – za 15 000 somů jsme měli vlastní kok-boru show. A stálo to za každý som: neuvěřitelná jízda, síla, technika. Hráči na koních jako z jiného světa, souhra a tvrdost zároveň. My i děti jsme jen zírali.

Son-Kul pro nás nebyl jen ikonická destinace – byl to zážitek, který spojil všechno: přírodu, zvířata, kulturu i emoce. A zůstal hluboko v nás.`,
  },
  {
    title: "Naryn",
    lat: 41.427244,
    lng: 75.995954,
    date: new Date("2025-07-14"),
    description: null,
  },
  {
    title: "Tash-Rabat",
    lat: 40.856511,
    lng: 75.279704,
    date: new Date("2025-07-15"),
    description: `Návštěva Tash Rabat nebyla původně v plánu, ale ukázala se jako skvělý tah – naplánovali jsme si ho jako „mezikus" kvůli počasí, ale den se proměnil ve klidnou a vizuálně nádhernou etapu. Po cestě jsme míjeli duhové hory, barevné linie v horninách, které působily téměř neskutečně.

Zastávka u Tash Rabat znamenala návrat do historie – kamenný karavanseráj z 15. století byl kdysi útočištěm pro obchodníky, mnichy i poutníky na Hedvábné stezce. Leží ve výšce kolem 3200 metrů nad mořem, jen kousek od dnešní hranice s Čínou – což jsme si připomněli čistě symbolicky, protože dál už to stejně nejde.

Karavanseráj je působivá kamenná stavba s více než 30 místnostmi, rozloženými kolem hlavní síně. Vstup je možný (většinou s drobným poplatkem) a atmosféra uvnitř je až mystická – temné stěny, nízké průchody, pocit dávného klidu a síly.

My jsme tu hlavně piknikovali, děti pobíhaly kolem jako kozorožci a my dospělí jsme si vychutnávali ticho a otevřený prostor. Výhledy do okolních hor byly dechberoucí a celá oblast působila jako z jiné doby. Zastávka, která měla být „vycpávka", se změnila v den, na který si budeme pamatovat s vděčností.`,
  },
  {
    title: "Koshoy Korgon",
    lat: 41.123483,
    lng: 75.698787,
    date: new Date("2025-07-15"),
    description: `Koshoy Korgon jsme zařadili jako zajímavou zastávku během odpočinkového dne – a rozhodně si to zasloužila. Tato hliněná pevnost ze starověku stojí na planině kousek od At-Bashi a svou přítomností připomíná, že historie Kyrgyzstánu není jen o horách a pastevcích, ale i o opevněných místech, která hlídala cesty a křižovatky.

Pevnost má půdorys cca 250 x 250 metrů a můžete si ji pohodlně obejít po okraji. Není nijak udržovaná, takže působí trochu jako hliněná duchovní ruina – doslova se rozpadá před očima, což jí paradoxně dodává atmosféru pomíjivosti. Děti vnímaly prostor jako obří bludiště, dospělí jako historický otisk ve vyschlé krajině.

Vhodné jako krátká zastávka, když nechcete výšlapy, ale přesto něco vidět. A navíc – mít pevnost skoro pro sebe není úplně běžný zážitek.`,
  },
  {
    title: "Naryn – průjezd",
    lat: 41.427159,
    lng: 75.995953,
    date: new Date("2025-07-15"),
    description: null,
  },
  {
    title: "Köl-Suu yurt camp",
    lat: 40.748578,
    lng: 76.397902,
    date: new Date("2025-07-16"),
    description: `Cesta do kempu u Köl-Suu není jen výlet – je to zkouška odvahy, brzd a duševní rovnováhy. Trasa z Narynu má 140 km, ale reálně se to táhne jako věčnost. Silnice rychle mizí a přechází v nejhorší polní cestu, jakou jsme kdy jeli. K tomu déšť, bahno, kluzké úseky nad prudkými svahy – a výhled minimální. Z auta se občas stane bobová dráha.

Po cestě nás čekal i přejezd vojenského kontrolního bodu v čínském pohraničí. Naštěstí jsme byli připraveni – 30 € za každého člena posádky a šustění eur otevřelo bránu i bez očního kontaktu s vojákem. S povolením v ruce jsme pokračovali dál, až jsme se vyhrabali do kempu, kde se všechno blýskalo – kromě nás a auta, které vypadalo jako čerstvě vylovené z jezera bláta.

Bláto jsme se pokusili sundat víckrát, ale úspěšné bylo až mytí v Biškeku. V kempu jsme si rovnou nechali zatopit v jurtě, protože venku lilo a všichni doufali, že předpověď na zítřek nelže. A nelhala.

Po dešti jsme vylezli na skálu a rozhlédli se po celém údolí. Holky šplhaly jako kamzíci, my jsme sledovali světlo, jak se dere mezi mraky. Večer jsme se v jurtě ohřívali, hráli Černého Petra a připravovali se na noc, která podle všech teploměrů měla klesnout blízko k nule.

Ráno nás přivítalo sluncem, osvícenými horami a ideálními podmínkami – po snídani jsme tak mohli vyrazit pěšky na 14km trasu k samotnému jezeru Kel-Suu.`,
  },
  {
    title: "Köl-Suu",
    lat: 40.69894,
    lng: 76.389864,
    date: new Date("2025-07-17"),
    description: `Köl-Suu je jedno z těch míst, které člověk nezapomene. Celých 14 kilometrů tam i zpět jsme šli pěšky – horským údolím, mezi skalami a potoky. Počasí nám přálo, ale poslední kilometr byl opravdu náročnější terénem po skále. Výhledy se otevíraly postupně – a když jsme dorazili k jezeru, bylo to jako vstoupit do jiného světa.

Věrka s Jitkou trochu bojovaly s výškovou nemocí, ale všechno zvládly. Holky šlapaly s lehkostí, zdravily koně, telata a jedno malé tele se s nimi dokonce rádo vyfotilo. U jezera jsme nastoupili na loďku, a i když měla Maruška zprvu obavy, překonala strach a stala se z ní hrdá námořnice. Kapitán nás zavezl do skryté jeskyně, výhledy byly jako z filmu.

Celý výlet ke Köl-Suu byl fyzicky náročnější, ale o to víc stál za to. Krása, klid, zážitek – a děti, které to celé ušly s úsměvem.`,
  },
  {
    title: "Köl-Suu yurt camp – návrat",
    lat: 40.748566,
    lng: 76.39772,
    date: new Date("2025-07-17"),
    description: null,
  },
  {
    title: "Kochkor – průjezd",
    lat: 42.214186,
    lng: 75.752978,
    date: new Date("2025-07-17"),
    description: null,
  },
  {
    title: "Kol-Ukok",
    lat: 42.097227,
    lng: 75.908237,
    date: new Date("2025-07-18"),
    description: `Když jsme jeli ke Kol-Ukoku, chtěli jsme navštívit ještě jedno jezero o kus dál. Cesta tam ale byla… strašná. Těžko popsat jinak – kamenitá, rozbitá, nekonečná. Po hodině jízdy jsme konečně dorazili k jezeru, plní nadšení. To nám vydrželo přesně do okamžiku, kdy jsme zaparkovali a vše v autě začalo blikat, pípat a hlásit poplach. Brzda, která už dřív pískala, se zřejmě rozpadla. V nadmořské výšce přes 3000 m, bez signálu a jen se čtyřmi jurtami v okolí.

Začal stres – jestli to není poloosa, co budeme dělat, jestli odtud vůbec odjedeme. Místní stavěli jurty a byli ochotní pomoci, ale nejdřív prý museli dostavět střechu. Mezitím jsme auto vyklidili a děti se skvěle zabavily – honily telata, hrály si u vody a naprosto neřešily paniku rodičů. Kol-Ukok měl tyrkysovou vodu a naprostý klid. A my nervy v kýblu.

Postupně jsme tým opravářů doplnili o tři dělníky, kteří o půl kilometru dál stavěli cestu (mají pětiletý projekt, prý to stihnou za dva). Jeden z nich se „prý vyzná v autech", takže jsme vytvořili multifunkční krizový tým. Výsledkem bylo rozhodnutí: brzdu ucpat, aby nekapal olej, a dočasně ji vyřadit z provozu.

První pokus – výstřižek z plastové lahve – selhal s výbuchem. Druhý pokus – kolečko z plechovky – vydržel a prošel zátěžovým testem. Kluci nás uklidnili: „Na dvě brzdy jsme jezdili vždycky. Tři jsou luxus." Po pěti hodinách improvizací a smíchem přes slzy jsme měli pojízdné auto a obrovskou úlevu.

Druhé jezero jsme už nedali, ale Kol-Ukok nám zůstane v paměti ne kvůli výšlapu, ale kvůli tomu, jak jsme se z toho všichni dostali. A dětem? Těm stačila voda, zvířata a žádná túra. Byly nadšené. A my nakonec taky.`,
  },
  {
    title: "Biškek & Somewhere Bistro",
    lat: 42.887461,
    lng: 74.604483,
    date: new Date("2025-07-18"),
    description: `Příjezd do Biškeku byl jako poslední zkouška nervů. Město se hromadně přestavuje – silnice rozkopané, objížďky nedávají smysl a doprava se plazí. Zacpané ulice, hodinová zdržení a vedro tomu nepřidalo. Přímo na jedné křižovatce jsme viděli pěstní souboj mezi řidiči – jeden vyskočil z auta, skočil druhému dovnitř a začal ho mlátit. Ten to řešil couváním a rovnou vrazil do dalšího auta. My jsme stihli zmizet dřív, než se to začalo sypat.

Policie? Ta, co jinak šikanuje řidiče na každém rohu, zřejmě řešila něco důležitějšího než pokuty.

Naše ubytování, které jsme měli domluvené, se zhroutilo – po několika hodinách napsali, že vlastně nemají místo. Naštěstí Booking zafungoval a za pět minut jsme měli nový hotel jen kousek dál – příjemný, čistý, zachránil večer.

A pak přišla zlatá tečka: pár minut pěšky od hotelu jsme našli bistro Somewhere. Majitel byl nadšený, když uviděl naše barvy Tottenhamu, obsluha si nás doslova hýčkala, jídlo skvělé a na čepu IPA, kterou bychom čekali spíš v Londýně než v Kyrgyzstánu. Po všech těch kopcích, telatech, jurtech a opravách auta to byla nečekaná, civilizovaná, příjemná tečka.`,
  },
  {
    title: "Ala Archa",
    lat: 42.540117,
    lng: 74.48164,
    date: new Date("2025-07-19"),
    description: `Naše poslední přírodní zastávka v Kyrgyzstánu – národní park Ala Archa. Dorazili jsme pohodlně, auto poslouchalo, ale po všech předchozích zážitcích jsme už neměli chuť testovat jeho limity. U vstupu jsme zaplatili 200 somů za vstup a pokračovali dál autobusem až do horní části parku.

Příroda samotná – krásná. Údolí, řeka, hory v dálce. Ale… lidí hodně. A co víc – všude začínají růst amfiteátry, kiosky, stánky. Na jedné ze skal už stojí nový resort, ke kterému se buduje lanovka. Člověk vnímá, že divoký a syrový Kyrgyzstán, který jsme zažili u jezer, v jurtách nebo na hřbetech koní, tady pomalu mizí.

Byl to hezký výlet – ale upřímně? Pokud hledáte autentičnost a klid, najdete ji spíš jinde. Ala Archa je dnes víc turistický park než horské dobrodružství, ač jde si najít cíle, které nejsou v tom centru dění jako je vodopád nebo ledovec. Možná dobré na první výlet z Biškeku, ale my už jsme byli jinde – a to nejen geograficky.`,
  },
  {
    title: "Biškek & Panfilov Park",
    lat: 42.87962,
    lng: 74.600199,
    date: new Date("2025-07-20"),
    description: `Po návratu z Ala Archa jsme se v Biškeku usadili doslova na skok od hlavního náměstí Ala-Too, které jsme během dvou dnů viděli víc než některé sousedy doma za měsíc. Po výletě jsme dali klidný večer – procházka do nové hospody (pěkná, krátká, hlavně klimatizovaná) a pak večerní život na náměstí, kde se po západu slunce děje to hlavní. Teploty sice stále 34 °C, ale proti dennímu peklu to byla osvěžující změna.

Z náměstí jsme se přesunuli do Panfilov parku, kde kolotoče hrají hlavní roli – a protože si všechny holky výletem vysloužily metál, první jízdy (ano, rovnou několik) proběhly ještě ten večer. Největší láska? Kobra – kolotoč, který holky nadchl, Věrku lehce vyděsil a zbytek rodiny pobavil.

Nedělní den začal plánem navštívit slavný Oš bazar – jenže v neděli má zavřeno kvůli úklidu. Tak jsme naskočili do auta a vyrazili do náhradního bazaru, kde jsme našli obchodní centrum se suvenýry. Tam holky prohrabaly peněženky, zvažovaly každou somovou investici a odcházely nadšené – a o pár vlasů chudší rodiče (vybrat si mezi čepicí a náramkem byl existenční problém).

Odpoledne? Čtyřhodinová kolotočová smršť. Děti nadšené, my spokojení, že radost má poslední slovo výletu. Spát jsme šli na tři hodiny, zabalili batohy, vzpomínky, suvenýry – a hurá domů.`,
  },
  {
    title: "«Manas» International Airport – odlet",
    lat: 43.059239,
    lng: 74.476184,
    date: new Date("2025-07-21"),
    description: null,
  },
]

async function main() {
  const prisma = createPrismaClient()

  try {
    // Remove existing trip if it exists
    const existing = await prisma.trip.findUnique({ where: { slug: "2025-kyrgyzstan" } })
    if (existing) {
      await prisma.trip.delete({ where: { slug: "2025-kyrgyzstan" } })
      console.log("Deleted existing trip")
    }

    const trip = await prisma.trip.create({
      data: {
        slug: "2025-kyrgyzstan",
        title: "2025 Kyrgyzstan",
        country: "Kyrgyzstán",
        tripType: "roadtrip",
        description:
          "Rodinná cesta do Kyrgyzstánu – přes jezero Issyk-Kul, divoké kaňony, jezdecké stepi Son-Kulu až po daleké jezero Köl-Suu u čínských hranic. Čtrnáct dní, tři holky, jedno auto a spousta nezapomenutelných zážitků.",
        tips: JSON.stringify({
          logistika: [
            "Čeští občané nepotřebují vízum – vstup je bezpoplatkový po dobu 30 dní.",
            "Auto: doporučujeme pronájem 4WD v Biškeku (cca 80–120 $/den), naprostá nutnost pro Köl-Suu, Kol-Ukok nebo Ak-Sai kaňon.",
            "Ubytování: mix jurtových kempů (Son-Kul, Köl-Suu), guesthouses a hotelů – vše rezervujte nejdříve den předem nebo na místě.",
            "Platby: hotovost v somech, kartou téměř nikde. Výběr z bankomatu v Biškeku nebo Karakolu.",
            "SIM karta: Beeline nebo O! – koupit na letišti hned po příletu, data fungují i v horách.",
          ],
          pozor: [
            "Cesty: mnohé offroad trasy jsou na mapě označeny jako silnice – realita je jiná. Vždy ověřte aktuální stav.",
            "Výšková nemoc: na Son-Kulu (3016 m) a Köl-Suu (3200 m) hrozí – první den netrekujte a pijte hodně vody.",
            "Pohraničí s Čínou u Köl-Suu: nutný povolený pass (30 €/os. přes místní agenturu v Narynu).",
            "Benzín: tankujte vždy, kde to jde – v horách čerpací stanice nejsou.",
            "Počasí: v červenci teploty od 0 °C v noci na horách po 35 °C v Biškeku – balte na všechno.",
          ],
        }),
        startDate: new Date("2025-07-06"),
        endDate: new Date("2025-07-21"),
        participants: JSON.stringify(["Zbynek", "Věrka", "Ema", "Mája", "Míša"]),
        published: true,
      },
    })

    console.log(`Created trip: ${trip.title} (${trip.id})`)

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i]
      await prisma.stop.create({
        data: {
          tripId: trip.id,
          title: stop.title,
          description: stop.description,
          date: stop.date,
          lat: stop.lat,
          lng: stop.lng,
          order: i,
        },
      })
      console.log(`  [${i + 1}/${stops.length}] ${stop.title}`)
    }

    console.log(`\nDone! Created trip with ${stops.length} stops.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
