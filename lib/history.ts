// Local history content for the county and its towns. Single source of truth:
// the homepage HistoryTabs component renders it, buildHistoryJsonLd emits it as
// schema.org Place data, and /llms.txt summarizes it for AI assistants.
//
// `key` doubles as the town slug for the five towns (matches lib/site.ts TOWNS),
// so a town's history links to its /[town] page. "county" is the overview.
// Facts are drawn from the Tennessee Encyclopedia, town records, and Wikipedia;
// keep the voice plain and the dates checkable.

export interface HistoryPlace {
  /** Town slug (matches TOWNS) or "county" for the overview. */
  key: string;
  label: string;
  /** Short kicker shown above the heading, e.g. "Settled 1807". */
  meta: string;
  paragraphs: string[];
  facts: string[];
}

export const PLACES: HistoryPlace[] = [
  {
    key: "county",
    label: "Marshall County",
    meta: "Formed 1836 · Seat: Lewisburg",
    paragraphs: [
      "Marshall County was carved out of four older counties in 1836. The legislature pulled land from Giles, Bedford, Lincoln, and Maury, drew a new boundary, and named the place for John Marshall, the chief justice of the Supreme Court. The county seat took its own name from Meriwether Lewis, the explorer, who died not far from here on the Natchez Trace.",
      "For most of its life this was farm country, and good farm country at that. By the late 1930s the county raised more Jersey dairy cattle than anywhere else in the nation. The walking horse registry started in Lewisburg around the same time. People here still measure the year by planting, foaling, and the county fair.",
    ],
    facts: [
      "Established by the state legislature in 1836 from parts of Giles, Bedford, Lincoln, and Maury counties.",
      "Named for John Marshall, the longest-serving chief justice of the U.S. Supreme Court.",
      "Home to a U.S. Dairy Experiment Station; by the late 1930s, the top Jersey cattle county in the country.",
      "The Tennessee Walking Horse Breeders’ Association was organized in Lewisburg in 1935.",
    ],
  },
  {
    key: "lewisburg",
    label: "Lewisburg",
    meta: "County seat",
    paragraphs: [
      "Lewisburg sits at the center of the county, laid out around a courthouse square the way county seats usually are. The current courthouse went up in 1929. Walk the square and you’ll still find the old Ladies Rest Room, built in 1924 so women who came in from the farms had somewhere to sit and wait; people say it was the first building of its kind in Tennessee.",
      "The town made its name on pencils. Factories here turned out millions of them for decades, enough that Lewisburg went by “Pencil City” for a stretch. And in 1935 a group of horsemen met here and started the registry that put the Tennessee Walking Horse on the map.",
    ],
    facts: [
      "Named for Meriwether Lewis of the Lewis and Clark expedition.",
      "The Marshall County Courthouse was completed in 1929 in Colonial Revival style.",
      "The Ladies Rest Room on the square dates to 1924.",
      "A center of pencil manufacturing for generations; J.R. Moon Pencil Company opened here in 1961.",
    ],
  },
  {
    key: "chapel-hill",
    label: "Chapel Hill",
    meta: "On the Duck River",
    paragraphs: [
      "Chapel Hill grew up in the north end of the county, along the Duck River. It began as a Bedford County settlement and only became part of Marshall later, after the lines were redrawn. The railroad came through and gave the town its early trade.",
      "Confederate cavalry general Nathan Bedford Forrest was born just outside Chapel Hill in 1821; a marker notes the spot. Henry Horton State Park, on the river nearby, opened in the 1960s and carries the name of a Tennessee governor who lived in the county.",
    ],
    facts: [
      "Sits on the Duck River in the northern part of Marshall County.",
      "Began as part of Bedford County before the county lines shifted.",
      "Birthplace of Nathan Bedford Forrest (1821).",
      "Henry Horton State Park, built in the 1960s, lies just north of town.",
    ],
  },
  {
    key: "cornersville",
    label: "Cornersville",
    meta: "Settled 1807",
    paragraphs: [
      "Cornersville is one of the oldest settlements around. John Haynes put down stakes here in 1807, back when the place was briefly called Marathon. It took its lasting name from its spot near the corner where four counties once met: Giles, Maury, Bedford, and Lincoln.",
      "It incorporated in 1830 as part of Giles County and didn’t join Marshall until 1870, when the legislature redrew the boundary and moved the whole district over. The Greek Revival Methodist church on the main road has stood since 1852.",
    ],
    facts: [
      "First settled by John Haynes in 1807; once known as Marathon.",
      "Incorporated in 1830; named for the meeting point of four counties.",
      "Annexed from Giles County into Marshall County in 1870.",
      "Its Methodist church, built in 1852, is a local landmark.",
    ],
  },
  {
    key: "petersburg",
    label: "Petersburg",
    meta: "On the county line",
    paragraphs: [
      "Petersburg is split down the middle by the county line; part of the town sits in Marshall, part in Lincoln. It was founded in 1814 and incorporated in 1837, which makes it one of the older towns in this corner of Tennessee.",
      "For years the railroad ran through it, and that made it a busy trading stop and the second largest town in the county. The depot days are gone, but the old downtown still reads like the railroad village it was.",
    ],
    facts: [
      "Founded in 1814; incorporated in 1837.",
      "Straddles the line between Marshall and Lincoln counties.",
      "Once a railroad town and the county’s second largest.",
    ],
  },
  {
    key: "belfast",
    label: "Belfast",
    meta: "Unincorporated community",
    paragraphs: [
      "Belfast took its name straight from Belfast in Northern Ireland. The post office opened in 1836, the same year the county was formed, and the first store followed in 1838. It has stayed small ever since, a crossroads community more than a town.",
      "It sits about halfway between Nashville and Huntsville, in the rolling pasture country that suits horses and cattle. Quiet, green, and easy to drive past if you blink.",
    ],
    facts: [
      "Named after Belfast in Northern Ireland.",
      "Post office established in 1836; first store opened in 1838.",
      "An unincorporated community in horse and cattle country.",
      "Roughly midway between Nashville and Huntsville.",
    ],
  },
];
