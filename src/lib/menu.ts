// The drinks menu, as data.
//
// Transcribed from the printed "Crescent Moon Drinks Menu A5 16pp"
// (public/uploads/, the same file /menu links to). The public /menu page, the
// homepage's wine facts and scripts/seed-stock.ts all read from here, so a
// price or a wine changes in one place.
//
// Spelling follows the printed menu, with its obvious typos corrected. Where a
// wine was already on the old site, its name keeps the old site's spelling
// (Albariño, Crémant, Laurent-Perrier, d'Abruzzo) because stock items are
// matched by exact name.

export type Tag = "V" | "VE" | "ORG";

export interface MenuItem {
  name: string;
  tags?: Tag[];
  /** Wines: country of origin. */
  origin?: string;
  /** Wines: 1-5 driest to sweetest, or A-E light to full-bodied (reds). */
  key?: string;
  note?: string;
  award?: string;
  /** Bottles and cans: the measure, e.g. "330ml". */
  size?: string;
  /** One price per column of the group; null where the printed menu is blank. */
  cells?: (string | null)[];
  /** Shown in the homepage's "By the glass" list. */
  featured?: boolean;
}

export interface MenuGroup {
  title?: string;
  subtitle?: string;
  columns: string[];
  /** Printed beside the column headings, e.g. "Mixer included". */
  columnNote?: string;
  /** One price for the whole group, e.g. cocktails. */
  groupPrice?: string;
  /** Items are made to order (cocktails) or are not stock lines. */
  stocked?: boolean;
  layout?: "rows" | "cards";
  items: MenuItem[];
}

export interface MenuSection {
  id: string;
  title: string;
  intro?: string;
  groups: MenuGroup[];
  footnote?: string;
}

const GLASS = ["125ml", "250ml", "750ml"];
const SPIRIT = ["25ml", "50ml"];
const MIXER = "Mixer included";

export const MENU: MenuSection[] = [
  {
    id: "wine",
    title: "The Wine Cellar",
    intro:
      "Discover our carefully curated wine list, thoughtfully selected to complement every palate and occasion. Whether you’re seeking something refreshing, complex or bold, we have the perfect pour for you.",
    groups: [
      {
        title: "Something White",
        columns: GLASS,
        stocked: true,
        items: [
          { name: "Viña Palomeras Navarra Blanco", tags: ["VE"], origin: "Spain", key: "1", cells: ["6.00", "11.95", "29.95"],
            note: "A great little house white made in Navarra, just North of Rioja. Super fresh and easy drinking with pear drop and apple notes.",
            award: "SWA Bronze Award" },
          { name: "Sereno Catarratto Pinot Grigio", tags: ["V"], origin: "Italy", key: "2", cells: ["6.50", "12.95", "32.50"],
            note: "Forget the usual bland and boring Pinot Grigio. Sereno is made in Sicily which is much warmer than the Pinot Grigio made in Veneto. Warmer climate means riper grapes which mean more flavour. Still light but with tropical notes behind the usual apple and lemon." },
          { name: "Janelas Antigas Vinho Verde", tags: ["VE"], origin: "Portugal", key: "2", cells: ["6.50", "12.95", "32.50"],
            note: "Crisp and clean with a distinct mineral glint, and a zippy touch of fizziness. Just imagine drinking this whilst sat on a Portuguese beach munching on freshly grilled sardines.",
            award: "SWA Gold Award" },
          { name: "Chacabuco Los Haroldos Viognier", origin: "Argentina", key: "2", cells: ["7.00", "13.95", "34.95"],
            note: "Known as the ‘white wine for red wine drinkers’, Viognier is a lovely, rich, full-bodied white with a creamy texture and oodles of peach and apricot fruit." },
          { name: "3 Passo Bianco Chardonnay Fiano", tags: ["VE", "ORG"], origin: "Italy", key: "2", cells: ["7.50", "14.95", "37.50"],
            note: "Are you an ABC? Will you drink Anything But Chardonnay? You need to try this. There’s not a lot of oak in this organic Italian blend of Chardonnay and Fiano so it’s star bright with citrus notes, grapefruit and pineapple that all culminate to a long finish.",
            award: "Global Organic & Vegan Masters Gold Award" },
          { name: "Long White Cloud Sauvignon Blanc", tags: ["VE"], origin: "New Zealand", key: "2", cells: ["8.00", "15.95", "39.95"], featured: true,
            note: "Once described as ‘being slapped in the face by a passionfruit’, The Long White Cloud is an absolute benchmark Marlborough; the passionfruit flavours are supported by a cornucopia of gooseberry, elderflower, grapefruit and hints of freshly mown grass." },
          { name: "Teixadal Albariño Treixadura", origin: "Spain", key: "2", cells: ["8.00", "15.95", "39.95"],
            note: "Class in glass from North West Spain. A stone-fruit scented beauty from the shores of the Atlantic. If you were in Galicia you would be sipping this on the beach with your freshly barbecued sardines. Lovely." },
          { name: "Villa Pani Gavi", tags: ["VE"], origin: "Italy", key: "2", cells: ["9.00", "17.95", "44.95"],
            note: "Some people would prefer a Gavi di Gavi as opposed to a Gavi (which this wine is). Don’t be one of those people. There’s no difference between the two wines at all beyond a geographical distinction. It’s more important who the producer is. Luckily, we’ve sourced this from a fabulous producer as this wine is awesome. Intense, refined and peachy." },
          { name: "Lacheteau Boisjoli Sancerre", origin: "France", key: "1", cells: ["10.50", "20.95", "52.50"],
            note: "Sancerre is arguably the greatest expression of Sauvignon Blanc. Less ‘in your face’ than a New Zealand example, Sancerre is more floral and crisp." },
          { name: "Chateau des Correaux St Veran", tags: ["VE"], origin: "France", key: "1", cells: ["12.50", "24.95", "59.95"],
            note: "You want White Burgundy but you can’t afford the crazy prices? Relax, we’ve got you. St. Veran is the real thing without busting the wallet. From one of the most Southerly appellations in Burgundy, this is a rich, buttery delight." },
        ],
      },
      {
        title: "A Touch of Colour",
        subtitle: "Pink & orange",
        columns: GLASS,
        stocked: true,
        items: [
          { name: "Sereno Catarratto Pinot Grigio Rosé", tags: ["V"], origin: "Italy", key: "2", cells: ["6.00", "11.95", "29.95"],
            note: "Made in Sicily. You’ll enjoy the extra depth and flavour of strawberry and cream flavours." },
          { name: "La Baume Rosé", tags: ["VE", "ORG"], origin: "France", key: "3", cells: ["8.00", "15.95", "39.95"],
            note: "Made by the only winery in the world to be bombed by wine terrorists. Fact! For lovers of elegant, crisp and dry rosé." },
          { name: "Ultimate Côtes de Provence Rosé", origin: "France", key: "2", cells: ["10.00", "19.95", "49.95"],
            note: "Grab yourself possibly the most beautiful wine bottle ever designed and pour yourself a glass. Star bright liquid with dashing red fruits and subtle spice notes." },
          { name: "Calmel & Joseph Pomone Orange Wine", tags: ["VE", "ORG"], origin: "France", key: "1", cells: ["8.00", "15.95", "39.95"],
            note: "The great Orange wine revolution continues. Calmel and Joseph might just be our favourite producers from Southern France, and their brand new release is the perfect introduction to this style of wine. Ripe, textured and exciting." },
          { name: "Logan Clementine Pinot Gris Orange", tags: ["VE"], origin: "Australia", key: "2", cells: ["9.00", "17.95", "44.95"], featured: true,
            note: "An absolute gem of a wine from Australia. This is what orange wines should be; organically farmed, natural yeasts, no added sulphur, two weeks skin-contact. If that’s all just wine blurb to you just try a glass. Rich and textural with red apple, fennel, cherry and lemon notes. Absolutely stunning wine." },
        ],
      },
      {
        title: "Something Red",
        columns: GLASS,
        stocked: true,
        items: [
          { name: "Viña Palomeras Navarra Tinto", tags: ["VE"], origin: "Spain", key: "C", cells: ["6.00", "11.95", "29.95"],
            note: "A lovely house red made with 100% Tempranillo. Medium-bodied with soft fruit.",
            award: "SWA Bronze Award" },
          { name: "Patriarche Merlot", tags: ["VE"], origin: "France", key: "B", cells: ["6.50", "12.95", "32.50"],
            note: "A super-soft, almost luxurious Merlot from the South of France. Probably the greatest ‘all-rounder’ red, with ripe plummy fruit, with a sprinkling of dark chocolate and black cherry." },
          { name: "Dega Montepulciano d'Abruzzo", tags: ["VE", "ORG"], origin: "Italy", key: "C", cells: ["7.00", "13.95", "34.95"],
            note: "If you think of Italy as a boot, then Abruzzo is the bit behind the knee. Home of the Montepulciano grape, it delivers fresh raspberry and plum notes with a little herb complexity." },
          { name: "Balauri Pinot Noir", tags: ["VE"], origin: "Romania", key: "B", cells: ["7.00", "13.95", "34.95"], featured: true,
            note: "Quite simply, how can Pinot Noir, which makes the world’s most expensive wines, make a wine this good at this price. A Romanian Pinot Noir that really over-delivers. It’s light and fresh, incredibly smooth and packed full of raspberry, strawberry and violet.",
            award: "SWA Bronze Award" },
          { name: "Descobre Douro Tinto", tags: ["VE"], origin: "Portugal", key: "D", cells: ["8.00", "15.95", "39.50"],
            note: "Expect a big, concentrated wine with lots of dark fruit. You are not going to be disappointed with this bold beauty." },
          { name: "Progreso Malbec", tags: ["VE"], origin: "Argentina", key: "D", cells: ["8.00", "15.95", "39.50"],
            note: "For a grape that most people hadn’t heard of 20 years ago, Malbec has come a long way. Progreso is a superb, full-bodied and organic Malbec bursting with summer fruits supported by touches of black pepper." },
          { name: "Doppio Primitivo di Manduria", origin: "Italy", key: "C", cells: ["8.50", "16.95", "42.50"],
            note: "Big, bold and dangerous to know. A brooding beast of a wine with great big dollops of black fruit and sweet spice. Stunning." },
          { name: "Cotes du Rhone La Grand Comtadine", origin: "France", key: "C", cells: ["9.00", "17.95", "44.95"],
            note: "By far the best loved wine in our recent ‘Call My Bluff’ tasting, this Cotes du Rhone is a revelation. Medium-to-full bodied with a great big dollop of cherry and blackberry fruit over sweet spice. Scrummy.",
            award: "SWA Gold Award" },
          { name: "Crozes Hermitage Comtadine", origin: "France", key: "D", cells: ["12.50", "24.95", "59.95"],
            note: "The ‘baby brother’ of Hermitage, a wine which some people say is the greatest of all reds. Here you get some of that big, powerful, dark fruit laden flavour over layers of classic Syrah black pepper. Serious wine for serious people." },
        ],
      },
      {
        title: "Sparkle or Fizz",
        columns: ["125ml", "200ml", "750ml"],
        stocked: true,
        items: [
          { name: "Pirani Prosecco", tags: ["V"], origin: "Italy", key: "2", cells: [null, "11.95", "34.95"], featured: true,
            note: "There’s Prosecco and there’s Prosecco. You could indulge yourself in ‘pile it high, sell it cheap’ supermarket fizz or you could go for the real thing. Pirani really delivers; fermented longer for a creamier texture and smaller bubbles, this is what Prosecco is meant to taste like.",
            award: "SWA Silver Award" },
          { name: "Sauvion Crémant de Loire Blanc", tags: ["VE", "ORG"], origin: "France", key: "1", cells: [null, null, "44.95"],
            note: "If you go to a French supermarket you’ll be confronted by a wall of Crémant, over here you’ll be lucky if you can find one. It’s a sparkling wine from France, made in the ‘Champagne Method’ but not from Champagne. They are incredibly good value and drunk by people ‘in the know’." },
          { name: "Silverhand Estate Silver Reign Brut Rosé", tags: ["VE", "ORG"], origin: "England", key: "1", cells: [null, null, "54.95"],
            note: "From the UK’s largest organic vineyard in Kent, Silver Reign rosé is a superb example of what English wine does best. Strawberry and raspberry fruit at the fore develops into crisp citrus notes layered over the tiniest of bubbles." },
          { name: "Ayala Brut Majeur Champagne NV", origin: "France", key: "1", cells: ["14.50", null, "74.95"],
            note: "Ayala is owned by Bollinger, and is a much more delicate Champagne than that monster. A lower dosage means a drier and fresher style, but still with complex notes of brioche and fresh dough." },
          { name: "Taittinger Brut", origin: "France", key: "1", cells: ["17.50", null, "94.95"],
            note: "From one of the last family owned Grand Marque Champagne houses, Taittinger Brut Reserve is blended from the very best grapes from 35 vineyards. Notes of white peach, blossom and vanilla on the nose lead to a fresh yet complex palate with a creamy texture." },
          { name: "Laurent-Perrier Cuvée Rosé", origin: "France", key: "2", cells: [null, null, "165.00"],
            note: "Showing off a glorious pink colour, the palate explodes with fresh raspberry, wild strawberry and a touch of citrus, it pirouettes across the palate with fine bubbles and a crisp, dry wink at the finish." },
        ],
      },
    ],
  },
  {
    id: "cocktails",
    title: "Cocktails",
    intro: "Made by Edmunds, expert mixologists from Bury St Edmunds.",
    groups: [
      {
        columns: [],
        groupPrice: "12.95",
        layout: "cards",
        items: [
          { name: "Amaretto Sour", note: "The distinctive flavour of Luxardo Amaretto paired with the sharpness of freshly squeezed lemons, it’s uniquely refreshing and memorable." },
          { name: "Bloody Mary", note: "Perfectly combining The Pickle House’s award-winning Spiced Tomato Mix with Sapling vodka." },
          { name: "Cosmopolitan", note: "A deliciously classic blend of Absolut Citron vodka, Cointreau, cranberry and lime." },
          { name: "Elderflower Collins", note: "Floral and oh so refreshing with a subtle hint of cucumber. Made using Adnams Copper House gin and served with soda." },
          { name: "Espresso Martini", note: "Sapling vodka blended with Fair’s velvety Café liqueur to create a rich and silky cocktail with a hint of vanilla. Made with real coffee." },
          { name: "Kumquat Margarita", note: "El Rayo tequila, Fair Kumquat liqueur, agave nectar and fresh lime juice." },
          { name: "Lychee Martini", note: "The unmistakable aroma and sweetness of fresh lychee combines with Sapling vodka." },
          { name: "Mojito", note: "Suffolk Distillery rum, mint, soda and lime make this Cuban cocktail a timeless classic." },
          { name: "Negroni", note: "Adnams Copper House gin, Vermouth and Campari create this Italian classic." },
          { name: "Old Fashioned", note: "Bourbon and Adnams Single Malt whisky, lightly sweetened and aromatised with bitters." },
          { name: "Passionfruit Martini", note: "Sharp and fruity passionfruit liqueur mixed with Sapling vodka." },
          { name: "Strawberry Daiquiri", note: "Suffolk Distillery rum, fresh strawberries and lime make up this bright summer cocktail." },
        ],
      },
    ],
  },
  {
    id: "spritz",
    title: "Everything Spritz",
    groups: [
      {
        columns: [""],
        items: [
          { name: "Aperol Spritz", note: "Aperol, Prosecco, Soda.", cells: ["13.50"] },
          { name: "Hugo Spritz", note: "Elderflower, Gin, Prosecco, Soda.", cells: ["16.00"] },
          { name: "Limoncello Spritz", note: "Limoncello, Prosecco, Soda.", cells: ["16.00"] },
          { name: "Tequila Spritz", note: "Tequila, Prosecco, Lime, Soda.", cells: ["16.00"] },
          { name: "Campari Spritz", note: "Campari, Prosecco, Soda.", cells: ["16.00"] },
        ],
      },
    ],
  },
  {
    id: "spirits",
    title: "Spirits",
    groups: [
      {
        title: "Rum",
        columns: SPIRIT,
        columnNote: MIXER,
        items: [
          { name: "Lambs Navy", note: "Distinctive taste of natural sweet cane and butter rum, finishing warm, dry and spicy.", cells: ["7.00", "10.50"] },
          { name: "Captain Morgan Spiced", note: "Launched in the 1980s, this is a blend of Caribbean rum, flavourings and spices.", cells: ["7.00", "10.50"] },
          { name: "Captain Morgan Dark", note: "Flavours of toffee and vanilla are perfectly balanced by the smoky cask finish.", cells: ["7.00", "10.50"] },
          { name: "Bacardi", note: "Aromatic white rum with delicate floral and fruity notes.", cells: ["7.00", "10.50"] },
          { name: "Sailor Jerry Spiced", note: "Rum based spirit flavoured with vanilla, lime and five spices.", cells: ["7.00", "10.50"] },
          { name: "Kraken Black Spiced Roast Coffee", note: "A rich fusion of spiced Caribbean rum and fine Arabica bean coffee.", cells: ["7.50", "11.00"] },
          { name: "Doorly’s 3 Year Old", note: "Tropical palate of coconut, pineapple and sweet hay.", cells: ["7.50", "11.00"] },
          { name: "Las Olas Spiced", note: "Bursting with vanilla pods, golden cherries, roasted coffee beans, cinnamon and citrus.", cells: ["8.00", "12.00"] },
          { name: "Bumbu Original", note: "Tropical fruit and spices with a splash of ginger beer for complexity.", cells: ["8.00", "12.00"] },
        ],
      },
      {
        title: "Gin",
        columns: SPIRIT,
        columnNote: MIXER,
        items: [
          { name: "Gordon’s", note: "Juniper-led with lemon zest and peppery spice plus peppermint and liquorice freshness.", cells: ["7.00", "10.50"] },
          { name: "Gordon’s Pink", note: "Naturally sweet strawberries and raspberries with a tang of redcurrant.", cells: ["7.00", "10.50"] },
          { name: "Bombay Sapphire", note: "A tantalising, smooth and complex taste.", cells: ["8.00", "12.00"] },
          { name: "Adnams Copper House Dry Gin", note: "Elegant and approachable, classically charged with juniper, rich with floral and citrus notes.", cells: ["8.00", "12.00"] },
          { name: "Adnams Copper House Pink Gin", note: "Vibrant raspberry aromas while still maintaining the character of true gin.", cells: ["8.00", "12.00"] },
          { name: "Hendrick’s", note: "Quirky gin with cucumber being the primary botanical used for a refreshing taste.", cells: ["8.00", "12.00"] },
          { name: "Hendrick’s Grand Cabaret", note: "Crafted with a sense of untamed exuberance offering decadent stone fruit flavours.", cells: ["8.00", "12.00"] },
          { name: "Hendrick’s Chocolate Orange", note: "The original bright juniper character is enhanced by the bright and citrusy elements of orange blossom finished with a slight note of sweetness from the cacao.", cells: ["8.00", "12.00"] },
          { name: "Plymouth", note: "Zingy juniper with rich lemon and orange enhanced by subtle rooty notes and white pepper.", cells: ["8.00", "12.00"] },
          { name: "Adnams First Rate Triple Malt Dry Gin", note: "A particular Southwold spirit made using locally farmed barley, wheat and oat.", cells: ["9.00", "14.00"] },
        ],
      },
      {
        title: "Vodka",
        columns: SPIRIT,
        columnNote: MIXER,
        items: [
          { name: "Smirnoff", note: "The world’s best selling vodka. Thrice distilled and ten times filtered for purity.", cells: ["7.00", "10.50"] },
          { name: "Fris", note: "Exceptionally clean and crisp from the freeze filtered process.", cells: ["7.00", "10.50"] },
          { name: "Smirnoff Raspberry Crush", note: "Natural raspberry flavour meets unmistakably smooth vodka for a deliciously juicy taste.", cells: ["7.50", "11.00"] },
          { name: "Haku", note: "100% Japanese vodka carefully filtrated through bamboo charcoal for a subtle sweet taste.", cells: ["8.00", "12.00"] },
          { name: "Grey Goose", note: "Clean palate with mineral cracked pepper notes and faint, delicate flavours of aniseed.", cells: ["8.00", "12.00"] },
        ],
      },
      {
        title: "Whiskey",
        columns: SPIRIT,
        columnNote: MIXER,
        items: [
          { name: "Famous Grouse", note: "Balanced, biscuit-laden palate with a core of thick, creamy malt.", cells: ["7.00", "10.50"] },
          { name: "Isle of Jura 10 Year Old", note: "Lingering taste of sweet pear, crushed apples and maple syrup.", cells: ["7.75", "11.75"] },
          { name: "Glenmorangie 12 Year Old", note: "Creamy vanilla and a rush of citrus layered with honey and peach.", cells: ["7.75", "11.75"] },
          { name: "Monkey Shoulder", note: "Very malty palate redolent of berry fruit, juicy toasted barley, cloves and butterscotch.", cells: ["7.75", "11.75"] },
          { name: "Jameson", note: "Light and approachable with a mellow palate of creamy barley and nutmeg spice.", cells: ["7.75", "11.75"] },
          { name: "Talisker Skye Single Malt", note: "A bonfire of peat crackling with black pepper, with a touch of brine and dry barley.", cells: ["9.00", "13.50"] },
          { name: "Laphroaig Islay Single Malt", note: "Smoky, muscular peat notes with big doses of salt, black pepper and cardamom.", cells: ["9.00", "13.50"] },
          { name: "Johnnie Walker Black Label", note: "Elegantly rich with caramel, vanilla and an oily nuttiness.", cells: ["9.00", "13.50"] },
          { name: "Bowmore 12 Year Single Malt", note: "Beautiful coastal notes with gentle peat and balanced floral elements.", cells: ["9.00", "13.50"] },
        ],
      },
      {
        title: "Bourbon & Tennessee Whisky",
        columns: SPIRIT,
        columnNote: MIXER,
        items: [
          { name: "Jack Daniel’s", note: "Toasty oak with spicy vanilla and mocha coffee finishing with a lingering charcoal note.", cells: ["7.00", "10.50"] },
          { name: "Southern Comfort", note: "Mellow honeyed, sweet palate with dried peach and strong marmalade flavours.", cells: ["7.00", "10.50"] },
          { name: "Buffalo Trace", note: "Perfectly balanced flavours of sweet oak and spice that make for a smooth finish.", cells: ["7.75", "11.75"] },
          { name: "Makers Mark", note: "Well-matured flavours of fruit cake and honey with overripe banana and nutty characters.", cells: ["7.75", "11.75"] },
          { name: "Four Roses", note: "Sweet, crisp nose with a lovely caramel and toffee note that show good length.", cells: ["8.00", "12.00"] },
        ],
      },
      {
        title: "Brandy & Cognac",
        columns: SPIRIT,
        items: [
          { name: "Three Barrels VSOP", note: "A superior smooth and velvety taste with hints of almond and walnut.", cells: ["7.00", "10.50"] },
          { name: "Courvoisier VS", note: "A fruity, delicate taste and a bouquet filled with ripe fruit and spring flowers.", cells: ["7.00", "14.00"] },
          { name: "Hennessy VS", note: "This VS is a blend of over 40 eaux-de-vie from the Cognac region’s four premier crus and is the world’s bestselling Cognac.", cells: ["8.00", "12.00"] },
          { name: "Remy Martin XO", note: "Aromas of late summer fruit is combined with floral notes of white flowers such as jasmine with mature flavours of juicy plums and candied oranges and a hint of hazelnuts and cinnamon. On the palate, the velvet smooth texture, with lingering finish.", cells: ["17.50", "35.00"] },
        ],
      },
      {
        title: "Tequila & Sambuca",
        columns: ["25ml"],
        items: [
          { name: "Tequila Rose", note: "Sweet and creamy with balanced notes of strawberry and tequila.", cells: ["3.50"] },
          { name: "Antica Classic Sambuca", note: "Distinct aniseed flavour with a sweet aftertaste.", cells: ["4.00"] },
          { name: "Antica Amaretto Sambuca", note: "Italian Sambuca flavoured with nutty almonds.", cells: ["4.00"] },
          { name: "Antica Liquorice Sambuca", note: "Italian Sambuca flavoured with liquorice.", cells: ["4.00"] },
          { name: "1800 Silver Tequila", note: "Smooth, premium tequila with a well-balanced taste of sweet fruit and pepper.", cells: ["4.50"] },
          { name: "Black Gold Coffee Tequila", note: "Luxurious coffee tequila with smooth, rich hints of coffee beans.", cells: ["5.50"] },
          { name: "Patrón Silver Tequila", note: "Light but spicy cracked black pepper palate with an earthy, pineapple, herbaceous core.", cells: ["6.50"] },
          { name: "Don Julio 1942", note: "Aged for at least 30 months in American white oak, this is a remarkably smooth and incredibly complex Tequila with notes of tropical fruit, agave and a hint of cinnamon.", cells: ["17.50"] },
        ],
      },
      {
        title: "Liqueurs",
        columns: SPIRIT,
        items: [
          // Limoncello's and Baileys' descriptions repeat Campari's and Tia
          // Maria's on the printed menu. Kept as printed until the bar says what
          // they should be.
          { name: "Aperol", note: "A classic rhubarb and orange flavoured aperitif from Italy.", cells: ["2.50", "5.00"] },
          { name: "Campari", note: "Rich aromas with an exquisite taste which has made it the world’s favourite Italian liqueur.", cells: ["3.50", "7.00"] },
          { name: "Limoncello", note: "Rich aromas with an exquisite taste which has made it the world’s favourite Italian liqueur.", cells: ["3.50", "7.00"] },
          { name: "Tia Maria", note: "Based on neutral cane spirit with vanilla flavouring and sweetened with sugar.", cells: ["3.50", "7.00"] },
          { name: "Baileys", note: "Based on neutral cane spirit with vanilla flavouring and sweetened with sugar.", cells: ["3.50", "7.00"] },
          { name: "Drambuie", note: "A herbal Scotch whisky based liqueur with saffron, honey and fennel seed characters.", cells: ["4.50", "9.00"] },
          { name: "Cointreau", note: "Incomparable balance of zesty, fresh fruity notes and a sublime, long finish.", cells: ["4.50", "9.00"] },
          { name: "Disaronno (with mixer)", note: "Rich aromas with an exquisite taste which has made it the world’s favourite Italian liqueur.", cells: ["7.00", "10.50"] },
        ],
      },
    ],
  },
  {
    id: "beer",
    title: "Draught & Bottles",
    groups: [
      {
        title: "On tap",
        columns: ["½ pint", "Pint"],
        items: [
          { name: "Cruzcampo", note: "A classic from Seville famed for its pale lager. This crisp and refreshing beer has a delicate balance of malt sweetness and mild hop bitterness with a golden hue.", cells: ["3.50", "6.95"] },
          { name: "Camden Eazy IPA", note: "A stone fruit juicy, golden-hazy, desert island treasure. And you found it. Eazy peazy.", cells: ["3.50", "6.95"] },
          { name: "Sale di Mare by Birra Moretti", note: "With a light body and crisp finish, this Italian beer captures the essence of coastal life with a subtle hint of citrus and a touch of sea salt. Sale di Mare translates to Sea Salt in English.", cells: ["3.50", "6.95"] },
          { name: "Guinness", note: "Legendary, iconic Irish stout. The black stuff. No other choice required!", cells: ["3.65", "7.25"] },
        ],
      },
      {
        title: "Bottles",
        columns: [""],
        items: [
          { name: "Asahi Super Dry", note: "Our favourite Japanese beer - crisp and smooth with a subtle bitterness that gives a dry finish.", size: "330ml", cells: ["5.50"] },
          { name: "Adnams Southwold", note: "The famous Adnams Southwold bitter from up the road in Suffolk. Amber in colour with a rich malt backbone, toasty caramel notes and gentle bitterness from the hops selection.", size: "500ml", cells: ["6.95"] },
          { name: "Aspall Suffolk Cyder", note: "Fruity, dry, thirst-quenching, lip-smacking cider.", size: "330ml", cells: ["6.95"] },
          { name: "Old Mout Cider Kiwi & Lime", note: "Crisp citrus notes with hints of kiwi and baked apple.", size: "500ml", cells: ["6.95"] },
          { name: "Old Mout Cider Berries & Cherries", note: "Sunset red colour with bursts of red berry.", size: "500ml", cells: ["6.95"] },
          { name: "Old Mout Cider Pineapple & Raspberry", note: "Cider blend with pineapple and raspberry juice.", size: "500ml", cells: ["6.95"] },
          { name: "Old Mout Cider Mango & Passionfruit", note: "Juicy mango meets zingy passionfruit for the optimal tropical, thirst-quenching flavour.", size: "500ml", cells: ["6.95"] },
          { name: "Noam", note: "Characterised by the savoury flavours of the delicate ‘Smaragd’ hop, fused with a signature herbal base note.", size: "340ml", cells: ["7.25"] },
        ],
      },
    ],
  },
  {
    id: "low-no",
    title: "Low / No Alcohol",
    groups: [
      {
        title: "Beer & Cider",
        columns: [""],
        items: [
          { name: "Lucky Saint 0.5%", note: "We think it’s the best of the bunch, brewed in the heart of Germany using traditional methods. A refreshing taste with a light golden hue and crisp finish.", size: "330ml", cells: ["5.50"] },
          { name: "Kopparberg Strawberry & Lime 0%", note: "Fresh strawberry with a subtle hint of lime for a refreshing taste without the compromise.", size: "500ml", cells: ["5.50"] },
          { name: "Guinness 0.0%", note: "We can’t tell the difference... So good!", size: "538ml", cells: ["6.00"] },
          { name: "Adnams Ghost Ship 0%", note: "The alcohol-free version of the famous Ghost Ship pale ale from up the road in Suffolk. Pale in colour with an amber hue and citrus notes.", size: "500ml", cells: ["6.50"] },
        ],
      },
      {
        title: "Spirits",
        columns: SPIRIT,
        columnNote: MIXER,
        items: [
          { name: "Sipsmith FreeGlider Non-Alcoholic Gin", note: "Carefully crafted with juniper and citrus; uncompromising on quality, flavour and enjoyment.", cells: ["6.50", "9.50"] },
        ],
      },
      {
        title: "Mocktails",
        columns: [""],
        items: [
          { name: "Bellini", note: "Sparkling drink crafted with a fusion of rich peach, aromatic bitters and dry white wine.", cells: ["7.50"] },
          { name: "Paloma", note: "Bittersweet pink grapefruit with refreshing lime and zesty tequila flavours.", cells: ["7.50"] },
          { name: "Moscow Mule", note: "Delicate balance of vodka flavours with lime, mint and fiery ginger.", cells: ["7.50"] },
          { name: "Mojito", note: "Rum flavours with mint extract and refreshing lime.", cells: ["7.50"] },
        ],
      },
    ],
  },
  {
    id: "soft",
    title: "Soft Drinks & Mixers",
    groups: [
      {
        title: "Bottled & Canned",
        columns: [""],
        items: [
          { name: "Marlish Still Water", size: "330ml", cells: ["1.75"] },
          { name: "Marlish Sparkling Water", size: "330ml", cells: ["1.75"] },
          { name: "Coke", size: "200ml", cells: ["3.00"] },
          { name: "Diet Coke", size: "200ml", cells: ["3.00"] },
          { name: "Fever-Tree Tonic", size: "200ml", cells: ["3.00"] },
          { name: "Fever-Tree Mediterranean Tonic", size: "200ml", cells: ["3.00"] },
          { name: "Fever-Tree Light Tonic", size: "200ml", cells: ["3.00"] },
          { name: "Fever-Tree Ginger Ale", size: "200ml", cells: ["3.00"] },
          { name: "Fever-Tree Lemonade", size: "200ml", cells: ["3.00"] },
          { name: "Fentimans Ginger Beer", size: "275ml", cells: ["4.50"] },
          { name: "Frobishers Apple Juice", size: "250ml", cells: ["4.50"] },
          { name: "Frobishers Orange Juice", size: "250ml", cells: ["4.50"] },
          { name: "Frobishers Tomato Juice", size: "250ml", cells: ["4.50"] },
          { name: "Frobishers Cranberry Juice", size: "250ml", cells: ["5.50"] },
        ],
      },
      {
        title: "Draughts",
        columns: ["½ pint", "Pint"],
        items: [
          { name: "Coke", cells: ["2.50", "4.00"] },
          { name: "Diet Coke", cells: ["2.50", "4.00"] },
          { name: "Lemonade", cells: ["2.50", "4.00"] },
        ],
      },
    ],
  },
  {
    id: "food",
    title: "Food, Snacks & Hot Drinks",
    intro:
      "We have a variety of locally supplied food, snacks and hot drinks available. For a guide selection, please refer to the information below. This will change seasonally. Please speak to the bar staff or wider team to find out more about availability and prices.",
    groups: [
      {
        columns: [],
        stocked: true,
        items: [
          { name: "Cheese board" },
          { name: "Charcuterie board" },
          { name: "Giant pitted olives" },
          { name: "Smoked almonds" },
          { name: "Dingley Dell beer sticks" },
          { name: "Sausage roll", note: "Saturday & Sunday only. Limited availability." },
          { name: "Toasties", note: "Ask the team for seasonal choices." },
          { name: "Luxurious hand-cooked crisps", note: "Various flavours available that are gluten free and vegan, or gluten free and dairy free." },
          { name: "Variety of coffee and teas", note: "Oat milk and 1883 syrup flavours available upon request." },
        ],
      },
    ],
    footnote: "Check out our specials board or ask the team for seasonal options.",
  },
];

// ---------- facts derived from the menu ----------

const num = (p: string) => Number.parseFloat(p);

function wineGroups(): MenuGroup[] {
  return MENU.find((s) => s.id === "wine")?.groups ?? [];
}

export function wineCount(): number {
  return wineGroups().reduce((n, g) => n + g.items.length, 0);
}

/** Lowest price in a group's column, formatted as printed ("6.00"). */
function lowest(groups: MenuGroup[], column: string): string | null {
  let best: string | null = null;
  for (const g of groups) {
    const i = g.columns.indexOf(column);
    if (i < 0) continue;
    for (const item of g.items) {
      const c = item.cells?.[i];
      if (c && (best === null || num(c) < num(best))) best = c;
    }
  }
  return best;
}

function section(id: string): MenuSection | undefined {
  return MENU.find((s) => s.id === id);
}

export const MENU_FACTS = {
  wines: wineCount(),
  /** Cheapest 125ml glass. */
  glassFrom: lowest(wineGroups(), "125ml"),
  cocktailPrice: section("cocktails")?.groups[0]?.groupPrice ?? null,
  cocktailCount: section("cocktails")?.groups[0]?.items.length ?? 0,
  spritzFrom: lowest(section("spritz")?.groups ?? [], ""),
  pintFrom: lowest(section("beer")?.groups ?? [], "Pint"),
  mocktailFrom: lowest(section("low-no")?.groups.filter((g) => g.title === "Mocktails") ?? [], ""),
  softFrom: lowest(section("soft")?.groups ?? [], ""),
  spiritCount: (section("spirits")?.groups ?? []).reduce((n, g) => n + g.items.length, 0),
};

/** The homepage's "By the glass" list: the smallest measure each featured wine is poured in. */
export function featuredByTheGlass(): { name: string; measure: string; price: string }[] {
  return wineGroups().flatMap((g) =>
    g.items
      .filter((i) => i.featured)
      .map((i) => {
        const at = (i.cells ?? []).findIndex((c) => c !== null);
        return { name: i.name, measure: g.columns[at], price: i.cells![at]! };
      }),
  );
}

/** The food and snacks, as named on the printed menu. */
export function fromTheCounter(): string[] {
  return (section("food")?.groups ?? []).flatMap((g) => g.items.map((i) => i.name));
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** 30 → "Thirty", 35 → "Thirty-five". For the homepage copy; 1-99 only. */
export function inWords(n: number): string {
  const w = n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  return w.charAt(0).toUpperCase() + w.slice(1);
}
