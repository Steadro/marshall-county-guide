// Closed canonical subcategory lists per category slug (schema/TAXONOMY.md).
// scripts/normalize-taxonomy.ts maps drifted values onto these;
// scripts/apply-enrichment.ts refuses to write anything off-list.
// "other" has no list yet (open category decision in TAXONOMY.md).
export const SUBCATEGORIES: Record<string, string[]> = {
  // v2: tightened to consumer-meaningful venue types. Diner folds into Restaurant,
  // Deli into Fast Food, Coffee Shop into Cafe, Pub & Bar into Bar & Grill —
  // the splits a diner-goes-here vs restaurant-goes-there don't change a choice.
  "restaurant-and-food": ["Restaurant","Cafe","Bakery","Fast Food","Food Truck","Dessert & Ice Cream","Juice & Smoothie Bar"],
  "automotive": ["Auto Repair","Tire & Auto Repair","Auto Repair & Towing","Auto Parts & Accessories","Car Wash","Body Shop","Dealership"],
  "retail-and-shopping": ["Dollar & Variety","Supercenter","Grocery","Convenience & Travel Stop","Hardware Store","Farm & Feed","Florist","Boutique","Antiques & Vintage","Home Decor","Smoke & Vape Shop","Liquidation & Discount","Jewelry"],
  "financial": ["Bank","Credit Union","CPA & Accounting","Tax Preparation","Investment & Advisory","Insurance"],
  "professional-services": ["Law Firm","Insurance Agency","Funeral Home","Web & IT Services","Marketing & Design","Photography"],
  "health-and-medical": ["Family Medicine","Urgent Care","Hospital","Dentistry","Pharmacy","Optometry","Specialty Clinic"],
  "beauty-and-personal-care": ["Hair Salon","Barber Shop","Nail Salon","Spa","Salon Suites","Dry Cleaning"],
  "home-and-trades": ["Plumbing, Electrical & HVAC","HVAC & Refrigeration","Tree & Lawn Service","Concrete & Masonry","Construction","Roofing","Landscaping","Handyman","Propane & Gas"],
  "fitness-and-recreation": ["City Park","State Park","Greenway & Trail","Gym & Fitness Center","Recreation Center","Golf Course","Sports Complex","Studio","Show Grounds"],
  "manufacturing": ["Automotive Components","Metal Fabrication & Machining","Plastics & Film","Packaging","Food Processing","Electronics","Printing","Distribution & Warehousing","Industrial Equipment","Consumer Goods"],
  "pets-and-animals": ["Veterinary","Pet Grooming","Boarding & Daycare","Pet Supplies"],
  "real-estate": ["Residential Real Estate","Commercial Real Estate","Realty & Auction"],
  "agriculture": ["Farm & Ranch Supply","Livestock & Breeding","Crop & Produce","Winery & Vineyard"],
  "childcare-and-education": ["Childcare & Preschool","Tutoring & Enrichment","Early Intervention Services"],
  "arts-and-entertainment": ["Museum","Theatre","Gallery","Cinema","Live Music Venue"],
  // v2: one venue type; barn/outdoor/farm become tags, not separate subcategories.
  "wedding-and-event-venues": ["Event Venue"],
  "government-and-civic": ["City Hall","County Government Office","Court & Clerk","Post Office","Public Library","Public Works","Cemetery"],
  "schools": ["Elementary School","Intermediate School","Middle School","High School","Middle & High School","District Administration","Career & Technical"],
  "public-safety": ["Fire Department","Police Department","Sheriff's Office","EMS","Animal Control","Detention Facility"],
  "community-and-nonprofit": ["Chamber of Commerce","Senior Center","Social Services","Veterans Organization","Thrift & Donations"],
  "places-of-worship": ["Church","Other Place of Worship"],
};
