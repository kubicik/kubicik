/**
 * Sample trip: "Víkend v Praze" — demonstrates full trip layout with cover photo,
 * stops, descriptions and photo galleries.
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

const SLUG = "vikend-v-praze"

const stopsData = [
  {
    title: "Staroměstské náměstí",
    lat: 50.08724,
    lng: 14.42076,
    date: new Date("2024-05-10"),
    description: `Začali jsme tam, kde Praha začíná – na Staroměstském náměstí. Přišli jsme hodinu před polednem, záměrně, abychom chytili odbití Orloje. Náměstí bylo plné turistů, ale i tak má místo svou atmosféru – gotická věž radnice, Týnský chrám za zády, domy v různých pastelových barvách lemující prostor ze všech stran.

Orloj odbil přesně ve dvanáct. Figurky se roztočily, smrt zakývala kosou, kohoutek zakokrhal. Děti koukaly s otevřenou pusou, my jsme fotili a snažili se nevypadat jako turisté – s omezeným úspěchem.

Po chvíli procházení jsme zastavili v kavárně u náměstí. Káva, trdelník (turistická past, ale dobrá turistická past) a výhled na dění. Praha se nestydí za svou krásu a Staroměstské náměstí je přesně tím srdcem, které to celé drží pohromadě.`,
    photos: [
      { url: "/uploads/stops/sample-prague-1a.jpg", caption: "Orloj – dvanáct hodin" },
      { url: "/uploads/stops/sample-prague-1b.jpg", caption: "Pohled z Týnského chrámu přes náměstí" },
    ],
  },
  {
    title: "Karlův most",
    lat: 50.08632,
    lng: 14.41155,
    date: new Date("2024-05-10"),
    description: `Karlův most je jedno z těch míst, která znáte ze stovek fotek – a přesto vás překvapí, když na něm stojíte. Poledne bylo možná nejhorší čas z hlediska davů, ale světlo bylo nádherné: zlatavé, ostré, s výhledem na Pražský hrad v pozadí.

Prošli jsme most celý od začátku do konce, mezi sochami světců, kolem malířů a hudebníků. Každá socha má svůj příběh – Jan Nepomucký, jehož bronzové doteky jsou ze staletí opravdu lesklé, různí světci a mučedníci. Průvodce by tu vydal na celé odpoledne, ale my se spokojili s tím, co jsme cítili: that sense of history under your feet.

Na druhém konci mostu jsme se otočili a vyfotili výhled zpět. Věže na obou koncích, řeka dole, hradní silueta nahoře. Klasika, která nikdy neomrzí.`,
    photos: [
      { url: "/uploads/stops/sample-prague-2a.jpg", caption: "Pohled z mostu na Hradčany" },
      { url: "/uploads/stops/sample-prague-2b.jpg", caption: "Sochy a věže Karlova mostu" },
    ],
  },
  {
    title: "Pražský hrad",
    lat: 50.09016,
    lng: 14.40003,
    date: new Date("2024-05-11"),
    description: `Druhý den jsme zasvětili hradu. Vyšli jsme pěšky ze Malostranského náměstí – schody, úzké uličky, pak náhle brána a výhled dolů na celé město. Ten moment, kdy Praha leží před vámi jako na dlani, je těžko popsatelný.

Hrad sám je vlastně celé malé město – katedrála sv. Víta dominuje areálu a je to architektonický poklad. Gotické klenby, vitrážová okna, ticho uvnitř oproti ruchu venku. Trávili jsme tam přes hodinu, aniž bychom se nudili.

Zlatá ulička byl příjemné překvapení – barevné domečky zabudované přímo do hradní zdi, dříve obývané zlatníky a alchymisty, dnes obchůdky. Dítě v každém z nás chtělo jedno z těch malých vchodů vyzkoušet.

Odpoledne jsme strávili v přilehlých zahradách s výhledem na město. Najít klidnou lavičku, rozbalit sendvič a jen koukat – to je ten luxus, kvůli kterému se jezdí na výlety.`,
    photos: [
      { url: "/uploads/stops/sample-prague-3a.jpg", caption: "Nádvoří Pražského hradu" },
      { url: "/uploads/stops/sample-prague-3b.jpg", caption: "Katedrála sv. Víta" },
      { url: "/uploads/stops/sample-prague-3c.jpg", caption: "Zlatá ulička" },
    ],
  },
  {
    title: "Vinohrady – podvečer",
    lat: 50.07521,
    lng: 14.44126,
    date: new Date("2024-05-11"),
    description: `Víkend jsme zakončili v sousedství, které Praha ukazuje málo – Vinohrady. Pryč od turistických proudů, do čtvrti s krásnými secesními domy, kavárnami pro místní a klidnými parky.

Náměstí Míru a okolí bylo přesně tím, co jsme potřebovali po dvou dnech chůze: kavárna, místní pivo, pozorování běžného pražského života. Žádné Orloje, žádní průvodci s deštníky – jen město, které dýchá normálně.

Na závěr jsme si dali večeři v restauraci na rohu. Svíčková, knedlo-vepřo-zelo, jedno z těch míst, kde menu není přeloženo do čtyř jazyků a číšník vás nepozdravil anglicky. To byl ten nejlepší možný konec víkendu.

Praha je velká, nahustěná a přetouristická v centru – ale odejít pár zastávek metrem a najít tohle ticho? Za to stojí za to se vrátit.`,
    photos: [
      { url: "/uploads/stops/sample-prague-4a.jpg", caption: "Secesní ulice Vinohrad" },
      { url: "/uploads/stops/sample-prague-4b.jpg", caption: "Podvečer v kavárně" },
    ],
  },
]

async function main() {
  const prisma = createPrismaClient()

  try {
    const existing = await prisma.trip.findUnique({ where: { slug: SLUG } })
    if (existing) {
      await prisma.trip.delete({ where: { slug: SLUG } })
      console.log("Deleted existing sample trip")
    }

    const trip = await prisma.trip.create({
      data: {
        slug: SLUG,
        title: "Víkend v Praze",
        description:
          "Dva dny v srdci Čech – Staroměstské náměstí, Karlův most, Pražský hrad a klidné Vinohrady. Praha jako turistická destinace i jako živé město najednou.",
        startDate: new Date("2024-05-10"),
        endDate: new Date("2024-05-11"),
        coverPhoto: "/uploads/covers/sample-prague.jpg",
        participants: JSON.stringify(["Zbynek", "Věrka"]),
        published: true,
      },
    })

    console.log(`Created trip: ${trip.title}`)

    for (let i = 0; i < stopsData.length; i++) {
      const s = stopsData[i]
      const stop = await prisma.stop.create({
        data: {
          tripId: trip.id,
          title: s.title,
          description: s.description,
          date: s.date,
          lat: s.lat,
          lng: s.lng,
          order: i,
        },
      })

      for (let j = 0; j < s.photos.length; j++) {
        await prisma.photo.create({
          data: {
            stopId: stop.id,
            url: s.photos[j].url,
            caption: s.photos[j].caption,
            order: j,
          },
        })
      }

      console.log(`  [${i + 1}] ${s.title} – ${s.photos.length} foto`)
    }

    console.log(`\nDone! Sample trip ready at /trips/${SLUG}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
