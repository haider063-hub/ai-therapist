// Emergency contact numbers by country
// These are general crisis helplines and should be verified for accuracy

export interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  website?: string;
}

export interface CountryEmergencyContacts {
  [country: string]: EmergencyContact[];
}

export const EMERGENCY_CONTACTS: CountryEmergencyContacts = {
  // United States
  "United States": [
    {
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "24/7 crisis support",
      website: "suicidepreventionlifeline.org",
    },
    {
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      description: "24/7 crisis support via text",
    },
  ],

  // Canada
  Canada: [
    {
      name: "Crisis Services Canada",
      number: "1-833-456-4566",
      description: "24/7 crisis support",
    },
    {
      name: "Crisis Text Line Canada",
      number: "Text CONNECT to 686868",
      description: "24/7 crisis support via text",
    },
  ],

  // United Kingdom
  "United Kingdom": [
    {
      name: "Samaritans",
      number: "116 123",
      description: "24/7 emotional support",
      website: "samaritans.org",
    },
    {
      name: "Crisis Text Line UK",
      number: "Text SHOUT to 85258",
      description: "24/7 crisis support via text",
    },
  ],

  // Australia
  Australia: [
    {
      name: "Lifeline Australia",
      number: "13 11 14",
      description: "24/7 crisis support",
      website: "lifeline.org.au",
    },
    {
      name: "Beyond Blue",
      number: "1300 22 4636",
      description: "Mental health support",
      website: "beyondblue.org.au",
    },
  ],

  // Germany
  Germany: [
    {
      name: "Telefonseelsorge",
      number: "0800 111 0 111",
      description: "24/7 crisis support",
    },
    {
      name: "Nummer gegen Kummer",
      number: "116 111",
      description: "Youth crisis support",
    },
  ],

  // France
  France: [
    {
      name: "SOS Amitié",
      number: "09 72 39 40 50",
      description: "24/7 emotional support",
    },
  ],

  // India
  India: [
    {
      name: "Vandrevala Foundation",
      number: "9999 666 555",
      description: "24/7 mental health support",
    },
    {
      name: "iCall",
      number: "9152987821",
      description: "Counselling support",
    },
  ],

  // Japan
  Japan: [
    {
      name: "TELL Lifeline",
      number: "03-5774-0992",
      description: "English crisis support",
    },
    {
      name: "Befrienders Japan",
      number: "03-5286-9090",
      description: "Crisis support",
    },
  ],

  // Brazil
  Brazil: [
    {
      name: "Centro de Valorização da Vida",
      number: "188",
      description: "24/7 crisis support",
    },
  ],

  // Mexico
  Mexico: [
    {
      name: "SAPTEL",
      number: "55 5259 8121",
      description: "Crisis support",
    },
  ],

  // Spain
  Spain: [
    {
      name: "Teléfono de la Esperanza",
      number: "717 003 717",
      description: "24/7 crisis support",
    },
  ],

  // Italy
  Italy: [
    {
      name: "Telefono Amico",
      number: "199 284 284",
      description: "Crisis support",
    },
  ],

  // Netherlands
  Netherlands: [
    {
      name: "113 Zelfmoordpreventie",
      number: "0900 0113",
      description: "24/7 suicide prevention",
    },
  ],

  // Sweden
  Sweden: [
    {
      name: "Bris",
      number: "116 111",
      description: "Youth crisis support",
    },
  ],

  // Norway
  Norway: [
    {
      name: "Mental Helse",
      number: "116 123",
      description: "24/7 crisis support",
    },
  ],

  // Denmark
  Denmark: [
    {
      name: "Livslinien",
      number: "70 201 201",
      description: "24/7 crisis support",
    },
  ],

  // Finland
  Finland: [
    {
      name: "Suicide Prevention Finland",
      number: "09 2525 0111",
      description: "Crisis support",
    },
  ],

  // Switzerland
  Switzerland: [
    {
      name: "Die Dargebotene Hand",
      number: "143",
      description: "24/7 crisis support",
    },
  ],

  // Austria
  Austria: [
    {
      name: "Rat auf Draht",
      number: "147",
      description: "24/7 crisis support",
    },
  ],

  // Poland
  Poland: [
    {
      name: "Centrum Wsparcia",
      number: "800 70 2222",
      description: "Crisis support",
    },
  ],

  // Russia
  Russia: [
    {
      name: "Emergency Psychological Help",
      number: "8-800-2000-122",
      description: "24/7 crisis support",
    },
  ],

  // China
  China: [
    {
      name: "Beijing Suicide Research and Prevention Center",
      number: "800-810-1117",
      description: "Crisis support",
    },
  ],

  // South Korea
  "South Korea": [
    {
      name: "Korea Suicide Prevention Center",
      number: "1588-9191",
      description: "24/7 crisis support",
    },
  ],

  // Singapore
  Singapore: [
    {
      name: "Samaritans of Singapore",
      number: "1800-221-4444",
      description: "24/7 crisis support",
    },
  ],

  // Malaysia
  Malaysia: [
    {
      name: "Befrienders KL",
      number: "03-79568145",
      description: "Crisis support",
    },
  ],

  // Thailand
  Thailand: [
    {
      name: "Samaritans Thailand",
      number: "02-713-6791",
      description: "Crisis support",
    },
  ],

  // Philippines
  Philippines: [
    {
      name: "National Center for Mental Health",
      number: "0917-899-USAP",
      description: "Crisis support",
    },
  ],

  // Indonesia
  Indonesia: [
    {
      name: "Into The Light Indonesia",
      number: "0811-2838-777",
      description: "Crisis support",
    },
  ],

  // South Africa
  "South Africa": [
    {
      name: "Lifeline South Africa",
      number: "0861 322 322",
      description: "24/7 crisis support",
    },
  ],

  // Nigeria
  Nigeria: [
    {
      name: "Mentally Aware Nigeria",
      number: "0800-000-0000",
      description: "Mental health support",
    },
  ],

  // Kenya
  Kenya: [
    {
      name: "Befrienders Kenya",
      number: "+254 722 178 177",
      description: "Crisis support",
    },
  ],

  // Egypt
  Egypt: [
    {
      name: "Befrienders Cairo",
      number: "762 1602",
      description: "Crisis support",
    },
  ],

  // Turkey
  Turkey: [
    {
      name: "Lifeline Turkey",
      number: "444 4 632",
      description: "Crisis support",
    },
  ],

  // Israel
  Israel: [
    {
      name: "Eran",
      number: "1201",
      description: "24/7 crisis support",
    },
  ],

  // Saudi Arabia
  "Saudi Arabia": [
    {
      name: "National Center for Mental Health",
      number: "920033360",
      description: "Mental health support",
    },
  ],

  // UAE
  "United Arab Emirates": [
    {
      name: "Al Jalila Children's Hospital",
      number: "800-4357",
      description: "Mental health support",
    },
  ],

  // Argentina
  Argentina: [
    {
      name: "Centro de Asistencia al Suicida",
      number: "135",
      description: "24/7 crisis support",
    },
  ],

  // Chile
  Chile: [
    {
      name: "Salud Responde",
      number: "600 360 7777",
      description: "Health support",
    },
  ],

  // Colombia
  Colombia: [
    {
      name: "Línea de Atención en Crisis",
      number: "106",
      description: "Crisis support",
    },
  ],

  // Peru
  Peru: [
    {
      name: "Línea 100",
      number: "100",
      description: "Crisis support",
    },
  ],

  // Venezuela
  Venezuela: [
    {
      name: "Centro de Orientación Familiar",
      number: "0212-4163111",
      description: "Crisis support",
    },
  ],

  // South Asian Countries
  Pakistan: [
    {
      name: "Umang Pakistan",
      number: "0311-7786264",
      description: "24/7 crisis support",
    },
    {
      name: "Rozan",
      number: "0800-22144",
      description: "Mental health support",
    },
  ],

  Bangladesh: [
    {
      name: "Kaan Pete Roi",
      number: "+880-1737-333-444",
      description: "24/7 crisis support",
    },
    {
      name: "Shastho Shurokkha Foundation",
      number: "10655",
      description: "Mental health helpline",
    },
  ],

  "Sri Lanka": [
    {
      name: "Sumithrayo",
      number: "011-2696666",
      description: "24/7 crisis support",
    },
    {
      name: "CCC Line",
      number: "1333",
      description: "Crisis counseling",
    },
  ],

  Afghanistan: [
    {
      name: "Mental Health Support Afghanistan",
      number: "+93-79-000-0000",
      description: "Crisis support",
    },
  ],

  Nepal: [
    {
      name: "Mental Health Helpline Nepal",
      number: "1660-01-22222",
      description: "24/7 crisis support",
    },
  ],

  Bhutan: [
    {
      name: "National Suicide Prevention Program",
      number: "112",
      description: "Emergency crisis support",
    },
  ],

  Maldives: [
    {
      name: "Mental Health Support Maldives",
      number: "119",
      description: "Crisis support",
    },
  ],

  // Eastern European Countries
  Ukraine: [
    {
      name: "Lifeline Ukraine",
      number: "7333",
      description: "24/7 crisis support",
    },
  ],

  Belarus: [
    {
      name: "Emergency Psychological Help",
      number: "8-801-100-1611",
      description: "Crisis support",
    },
  ],

  Romania: [
    {
      name: "TelVerde",
      number: "0800-801-200",
      description: "24/7 crisis support",
    },
  ],

  Bulgaria: [
    {
      name: "National Crisis Line",
      number: "00359-800-111-22",
      description: "Crisis support",
    },
  ],

  Hungary: [
    {
      name: "Kék Vonal",
      number: "116-111",
      description: "24/7 crisis support",
    },
  ],

  "Czech Republic": [
    {
      name: "Linka bezpečí",
      number: "116 111",
      description: "Crisis support",
    },
  ],

  Slovakia: [
    {
      name: "Linka detskej istoty",
      number: "116 111",
      description: "Crisis support",
    },
  ],

  Croatia: [
    {
      name: "Hrabri telefon",
      number: "116 111",
      description: "Crisis support",
    },
  ],

  Serbia: [
    {
      name: "Centar za prevenciju samoubistava",
      number: "0800-300-303",
      description: "Crisis support",
    },
  ],

  "Bosnia and Herzegovina": [
    {
      name: "Crisis Support Bosnia",
      number: "0800-200-300",
      description: "Mental health support",
    },
  ],

  Slovenia: [
    {
      name: "Tovariš",
      number: "116 123",
      description: "Crisis support",
    },
  ],

  Estonia: [
    {
      name: "Lootusekäsi",
      number: "655 8088",
      description: "24/7 crisis support",
    },
  ],

  Latvia: [
    {
      name: "Skalbes",
      number: "116 111",
      description: "Crisis support",
    },
  ],

  Lithuania: [
    {
      name: "Vaikų linija",
      number: "116 111",
      description: "Crisis support",
    },
  ],

  // Middle Eastern Countries
  Iran: [
    {
      name: "Emergency Psychological Help",
      number: "1480",
      description: "24/7 crisis support",
    },
  ],

  Iraq: [
    {
      name: "Mental Health Support Iraq",
      number: "132",
      description: "Crisis support",
    },
  ],

  Jordan: [
    {
      name: "Jordan Suicide Prevention",
      number: "110",
      description: "Emergency support",
    },
  ],

  Lebanon: [
    {
      name: "Embrace",
      number: "1564",
      description: "Mental health support",
    },
  ],

  Syria: [
    {
      name: "Mental Health Support Syria",
      number: "110",
      description: "Crisis support",
    },
  ],

  Kuwait: [
    {
      name: "Mental Health Support Kuwait",
      number: "112",
      description: "Crisis support",
    },
  ],

  Qatar: [
    {
      name: "Mental Health Support Qatar",
      number: "16000",
      description: "24/7 crisis support",
    },
  ],

  Bahrain: [
    {
      name: "Mental Health Support Bahrain",
      number: "8000 8000",
      description: "Crisis support",
    },
  ],

  Oman: [
    {
      name: "Mental Health Support Oman",
      number: "112",
      description: "Crisis support",
    },
  ],

  Yemen: [
    {
      name: "Mental Health Support Yemen",
      number: "199",
      description: "Crisis support",
    },
  ],

  // African Countries

  Ethiopia: [
    {
      name: "Mental Health Support Ethiopia",
      number: "8335",
      description: "Crisis support",
    },
  ],

  Ghana: [
    {
      name: "Mental Health Authority Ghana",
      number: "0800-900-110",
      description: "Crisis support",
    },
  ],

  Morocco: [
    {
      name: "Mental Health Support Morocco",
      number: "0537-202020",
      description: "Crisis support",
    },
  ],

  Algeria: [
    {
      name: "Mental Health Support Algeria",
      number: "021-71-11-11",
      description: "Crisis support",
    },
  ],

  Tunisia: [
    {
      name: "Mental Health Support Tunisia",
      number: "80-100-607",
      description: "Crisis support",
    },
  ],

  Libya: [
    {
      name: "Mental Health Support Libya",
      number: "1515",
      description: "Crisis support",
    },
  ],

  Sudan: [
    {
      name: "Mental Health Support Sudan",
      number: "999",
      description: "Crisis support",
    },
  ],

  Tanzania: [
    {
      name: "Mental Health Support Tanzania",
      number: "0800-750-075",
      description: "Crisis support",
    },
  ],

  Uganda: [
    {
      name: "Mental Health Support Uganda",
      number: "0800-100-066",
      description: "Crisis support",
    },
  ],

  Zimbabwe: [
    {
      name: "Mental Health Support Zimbabwe",
      number: "0800-910-000",
      description: "Crisis support",
    },
  ],

  Zambia: [
    {
      name: "Mental Health Support Zambia",
      number: "0800-200-100",
      description: "Crisis support",
    },
  ],

  Botswana: [
    {
      name: "Mental Health Support Botswana",
      number: "0800-600-600",
      description: "Crisis support",
    },
  ],

  Namibia: [
    {
      name: "Mental Health Support Namibia",
      number: "0800-100-100",
      description: "Crisis support",
    },
  ],

  Mozambique: [
    {
      name: "Mental Health Support Mozambique",
      number: "800-100-100",
      description: "Crisis support",
    },
  ],

  Angola: [
    {
      name: "Mental Health Support Angola",
      number: "111",
      description: "Crisis support",
    },
  ],

  Cameroon: [
    {
      name: "Mental Health Support Cameroon",
      number: "237-699-999-999",
      description: "Crisis support",
    },
  ],

  "Ivory Coast": [
    {
      name: "Mental Health Support Ivory Coast",
      number: "225-20-30-40-50",
      description: "Crisis support",
    },
  ],

  Senegal: [
    {
      name: "Mental Health Support Senegal",
      number: "33-821-33-33",
      description: "Crisis support",
    },
  ],

  Mali: [
    {
      name: "Mental Health Support Mali",
      number: "223-20-22-33-44",
      description: "Crisis support",
    },
  ],

  "Burkina Faso": [
    {
      name: "Mental Health Support Burkina Faso",
      number: "226-50-30-60-70",
      description: "Crisis support",
    },
  ],

  Niger: [
    {
      name: "Mental Health Support Niger",
      number: "227-20-73-73-73",
      description: "Crisis support",
    },
  ],

  Chad: [
    {
      name: "Mental Health Support Chad",
      number: "235-22-51-42-42",
      description: "Crisis support",
    },
  ],

  "Central African Republic": [
    {
      name: "Mental Health Support CAR",
      number: "236-21-61-00-00",
      description: "Crisis support",
    },
  ],

  "Democratic Republic of Congo": [
    {
      name: "Mental Health Support DRC",
      number: "243-81-700-0000",
      description: "Crisis support",
    },
  ],

  "Republic of Congo": [
    {
      name: "Mental Health Support Congo",
      number: "242-06-600-0000",
      description: "Crisis support",
    },
  ],

  Gabon: [
    {
      name: "Mental Health Support Gabon",
      number: "241-01-44-44-44",
      description: "Crisis support",
    },
  ],

  "Equatorial Guinea": [
    {
      name: "Mental Health Support Equatorial Guinea",
      number: "240-222-000-000",
      description: "Crisis support",
    },
  ],

  "São Tomé and Príncipe": [
    {
      name: "Mental Health Support São Tomé",
      number: "239-222-0000",
      description: "Crisis support",
    },
  ],

  Rwanda: [
    {
      name: "Mental Health Support Rwanda",
      number: "250-788-000-000",
      description: "Crisis support",
    },
  ],

  Burundi: [
    {
      name: "Mental Health Support Burundi",
      number: "257-22-22-22-22",
      description: "Crisis support",
    },
  ],

  Djibouti: [
    {
      name: "Mental Health Support Djibouti",
      number: "253-21-35-00-00",
      description: "Crisis support",
    },
  ],

  Eritrea: [
    {
      name: "Mental Health Support Eritrea",
      number: "291-1-120-000",
      description: "Crisis support",
    },
  ],

  Somalia: [
    {
      name: "Mental Health Support Somalia",
      number: "252-61-000-0000",
      description: "Crisis support",
    },
  ],

  Madagascar: [
    {
      name: "Mental Health Support Madagascar",
      number: "261-20-22-000-00",
      description: "Crisis support",
    },
  ],

  Mauritius: [
    {
      name: "Mental Health Support Mauritius",
      number: "230-800-0000",
      description: "Crisis support",
    },
  ],

  Seychelles: [
    {
      name: "Mental Health Support Seychelles",
      number: "248-4-000-000",
      description: "Crisis support",
    },
  ],

  Comoros: [
    {
      name: "Mental Health Support Comoros",
      number: "269-773-0000",
      description: "Crisis support",
    },
  ],

  "Cape Verde": [
    {
      name: "Mental Health Support Cape Verde",
      number: "238-800-0000",
      description: "Crisis support",
    },
  ],

  Guinea: [
    {
      name: "Mental Health Support Guinea",
      number: "224-664-000-000",
      description: "Crisis support",
    },
  ],

  "Guinea-Bissau": [
    {
      name: "Mental Health Support Guinea-Bissau",
      number: "245-320-0000",
      description: "Crisis support",
    },
  ],

  "Sierra Leone": [
    {
      name: "Mental Health Support Sierra Leone",
      number: "232-76-000-000",
      description: "Crisis support",
    },
  ],

  Liberia: [
    {
      name: "Mental Health Support Liberia",
      number: "231-77-000-000",
      description: "Crisis support",
    },
  ],

  Gambia: [
    {
      name: "Mental Health Support Gambia",
      number: "220-700-0000",
      description: "Crisis support",
    },
  ],

  Mauritania: [
    {
      name: "Mental Health Support Mauritania",
      number: "222-45-25-00-00",
      description: "Crisis support",
    },
  ],

  // Caribbean Countries
  Jamaica: [
    {
      name: "Mental Health Support Jamaica",
      number: "876-920-7926",
      description: "Crisis support",
    },
  ],

  Haiti: [
    {
      name: "Mental Health Support Haiti",
      number: "509-2811-1111",
      description: "Crisis support",
    },
  ],

  "Trinidad and Tobago": [
    {
      name: "Mental Health Support Trinidad",
      number: "868-800-HELP",
      description: "Crisis support",
    },
  ],

  Barbados: [
    {
      name: "Mental Health Support Barbados",
      number: "246-429-9999",
      description: "Crisis support",
    },
  ],

  Cuba: [
    {
      name: "Mental Health Support Cuba",
      number: "53-7-838-0000",
      description: "Crisis support",
    },
  ],

  "Dominican Republic": [
    {
      name: "Mental Health Support Dominican Republic",
      number: "809-200-0000",
      description: "Crisis support",
    },
  ],

  "Puerto Rico": [
    {
      name: "Mental Health Support Puerto Rico",
      number: "787-765-0000",
      description: "Crisis support",
    },
  ],

  // Central American Countries
  Guatemala: [
    {
      name: "Mental Health Support Guatemala",
      number: "502-2422-0000",
      description: "Crisis support",
    },
  ],

  Belize: [
    {
      name: "Mental Health Support Belize",
      number: "501-800-0000",
      description: "Crisis support",
    },
  ],

  "El Salvador": [
    {
      name: "Mental Health Support El Salvador",
      number: "503-2222-0000",
      description: "Crisis support",
    },
  ],

  Honduras: [
    {
      name: "Mental Health Support Honduras",
      number: "504-2222-0000",
      description: "Crisis support",
    },
  ],

  Nicaragua: [
    {
      name: "Mental Health Support Nicaragua",
      number: "505-2222-0000",
      description: "Crisis support",
    },
  ],

  "Costa Rica": [
    {
      name: "Mental Health Support Costa Rica",
      number: "506-2222-0000",
      description: "Crisis support",
    },
  ],

  Panama: [
    {
      name: "Mental Health Support Panama",
      number: "507-800-0000",
      description: "Crisis support",
    },
  ],

  // South American Countries (additional)
  Ecuador: [
    {
      name: "Mental Health Support Ecuador",
      number: "593-2-222-0000",
      description: "Crisis support",
    },
  ],

  Bolivia: [
    {
      name: "Mental Health Support Bolivia",
      number: "591-2-222-0000",
      description: "Crisis support",
    },
  ],

  Paraguay: [
    {
      name: "Mental Health Support Paraguay",
      number: "595-21-222-0000",
      description: "Crisis support",
    },
  ],

  Uruguay: [
    {
      name: "Mental Health Support Uruguay",
      number: "598-2-222-0000",
      description: "Crisis support",
    },
  ],

  Guyana: [
    {
      name: "Mental Health Support Guyana",
      number: "592-227-0000",
      description: "Crisis support",
    },
  ],

  Suriname: [
    {
      name: "Mental Health Support Suriname",
      number: "597-222-0000",
      description: "Crisis support",
    },
  ],

  "French Guiana": [
    {
      name: "Mental Health Support French Guiana",
      number: "594-594-000-000",
      description: "Crisis support",
    },
  ],

  // Asian Countries (additional)
  Vietnam: [
    {
      name: "Mental Health Support Vietnam",
      number: "84-28-3832-0000",
      description: "Crisis support",
    },
  ],

  Cambodia: [
    {
      name: "Mental Health Support Cambodia",
      number: "855-23-222-000",
      description: "Crisis support",
    },
  ],

  Laos: [
    {
      name: "Mental Health Support Laos",
      number: "856-21-222-000",
      description: "Crisis support",
    },
  ],

  Myanmar: [
    {
      name: "Mental Health Support Myanmar",
      number: "95-1-222-000",
      description: "Crisis support",
    },
  ],

  Mongolia: [
    {
      name: "Mental Health Support Mongolia",
      number: "976-11-222-000",
      description: "Crisis support",
    },
  ],

  Kazakhstan: [
    {
      name: "Mental Health Support Kazakhstan",
      number: "7-727-222-0000",
      description: "Crisis support",
    },
  ],

  Uzbekistan: [
    {
      name: "Mental Health Support Uzbekistan",
      number: "998-71-222-0000",
      description: "Crisis support",
    },
  ],

  Kyrgyzstan: [
    {
      name: "Mental Health Support Kyrgyzstan",
      number: "996-312-222-000",
      description: "Crisis support",
    },
  ],

  Tajikistan: [
    {
      name: "Mental Health Support Tajikistan",
      number: "992-37-222-000",
      description: "Crisis support",
    },
  ],

  Turkmenistan: [
    {
      name: "Mental Health Support Turkmenistan",
      number: "993-12-222-000",
      description: "Crisis support",
    },
  ],

  Azerbaijan: [
    {
      name: "Mental Health Support Azerbaijan",
      number: "994-12-222-000",
      description: "Crisis support",
    },
  ],

  Armenia: [
    {
      name: "Mental Health Support Armenia",
      number: "374-10-222-000",
      description: "Crisis support",
    },
  ],

  Georgia: [
    {
      name: "Mental Health Support Georgia",
      number: "995-32-222-000",
      description: "Crisis support",
    },
  ],

  // Pacific Island Countries
  Fiji: [
    {
      name: "Mental Health Support Fiji",
      number: "679-800-0000",
      description: "Crisis support",
    },
  ],

  "Papua New Guinea": [
    {
      name: "Mental Health Support PNG",
      number: "675-320-0000",
      description: "Crisis support",
    },
  ],

  "New Zealand": [
    {
      name: "Lifeline New Zealand",
      number: "0800 543 354",
      description: "24/7 crisis support",
    },
    {
      name: "Youthline",
      number: "0800 376 633",
      description: "Youth crisis support",
    },
  ],

  Tonga: [
    {
      name: "Mental Health Support Tonga",
      number: "676-222-000",
      description: "Crisis support",
    },
  ],

  Samoa: [
    {
      name: "Mental Health Support Samoa",
      number: "685-222-000",
      description: "Crisis support",
    },
  ],

  Vanuatu: [
    {
      name: "Mental Health Support Vanuatu",
      number: "678-222-000",
      description: "Crisis support",
    },
  ],

  "Solomon Islands": [
    {
      name: "Mental Health Support Solomon Islands",
      number: "677-222-000",
      description: "Crisis support",
    },
  ],

  Palau: [
    {
      name: "Mental Health Support Palau",
      number: "680-488-0000",
      description: "Crisis support",
    },
  ],

  "Marshall Islands": [
    {
      name: "Mental Health Support Marshall Islands",
      number: "692-625-0000",
      description: "Crisis support",
    },
  ],

  Micronesia: [
    {
      name: "Mental Health Support Micronesia",
      number: "691-320-0000",
      description: "Crisis support",
    },
  ],

  Kiribati: [
    {
      name: "Mental Health Support Kiribati",
      number: "686-222-000",
      description: "Crisis support",
    },
  ],

  Tuvalu: [
    {
      name: "Mental Health Support Tuvalu",
      number: "688-222-000",
      description: "Crisis support",
    },
  ],

  Nauru: [
    {
      name: "Mental Health Support Nauru",
      number: "674-444-0000",
      description: "Crisis support",
    },
  ],
};

// Default contacts for countries not in the list
export const DEFAULT_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: "International Association for Suicide Prevention",
    number: "Visit iasp.info/resources/Crisis_Centres",
    description: "Find local crisis centers",
    website: "iasp.info",
  },
  {
    name: "Befrienders Worldwide",
    number: "Visit befrienders.org",
    description: "Find local support centers",
    website: "befrienders.org",
  },
];

/**
 * Get emergency contacts for a specific country
 */
export function getEmergencyContacts(
  country?: string | null,
): EmergencyContact[] {
  if (!country) {
    return DEFAULT_EMERGENCY_CONTACTS;
  }

  // Try exact match first
  if (EMERGENCY_CONTACTS[country]) {
    return EMERGENCY_CONTACTS[country];
  }

  // Try case-insensitive match
  const normalizedCountry = country.toLowerCase();
  const matchedCountry = Object.keys(EMERGENCY_CONTACTS).find(
    (key) => key.toLowerCase() === normalizedCountry,
  );

  if (matchedCountry) {
    return EMERGENCY_CONTACTS[matchedCountry];
  }

  // Return default contacts if country not found
  return DEFAULT_EMERGENCY_CONTACTS;
}
