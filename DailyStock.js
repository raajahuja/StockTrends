const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const axios = require('axios');
const dayjs = require('dayjs');
const fs = require('fs');

// ===========================
// CONFIGURATION
// ===========================
const CONFIG = {
  // Groww API Configuration
  BEARER_TOKEN:
    'eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjkzMDEwMDAsImlhdCI6MTc2OTI4MzAwNywibmJmIjoxNzY5MjgzMDA3LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJlMTc0NjdiMS0xZWRkLTQxOTUtODYyMC05ZTFiYTkxOGE2MGVcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiZjZiN2Q2OGQtODgwMy00YWIyLTkxMDctMGE3YjFhMjc5ZDk0XCIsXCJkZXZpY2VJZFwiOlwiMGVmODFjZjItOTY2MS01YThmLTliMTAtNGEwZmMwMjg1OWU1XCIsXCJzZXNzaW9uSWRcIjpcImNlMTc5ZmE1LTZmNmQtNGE5OS1iYWJiLTJkOGZkNDUxNmQzYVwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYlAwVkJJOVNtQ1JuSVBCZnhIbTVwc1JSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLGxpdmVfZGF0YS1iYXNpYyxub25fdHJhZGluZy1iYXNpYyxvcmRlcl9yZWFkX29ubHktYmFzaWMsYmFja190ZXN0XCIsXCJzb3VyY2VJcEFkZHJlc3NcIjpcIjE2Ny4xMDMuMjUuMjMsMTcyLjY4LjIzOS4yNTAsMzUuMjQxLjIzLjEyM1wiLFwidHdvRmFFeHBpcnlUc1wiOjE3NjkzMDEwMDAwMDB9IiwiaXNzIjoiYXBleC1hdXRoLXByb2QtYXBwIn0.Gren6Gu4-viNBqdac-OtNawpmdrnvV9dOxO6xqJ8uIRWRJRcZIT-uqqhg0AyMRuqgSiucSoVKNCdw0mIBMKjPA',
  GROWW_BASE_URL: 'https://api.groww.in/v1',

  // Stock configuration
  EXCHANGE: 'NSE',
  SEGMENT: 'CASH',

  // Comprehensive Stock Categories with Indian Stocks
  STOCK_CATEGORIES: {
    // ============ INDICES ============
    INDICES: {
      name: '📊 Market Indices',
      stocks: ['NIFTY', 'SENSEX', 'BANKNIFTY', 'NIFTYIT', 'NIFTYFMCG', 'NIFTYPHARMA',
        'NIFTYAUTO', 'NIFTYMETAL', 'NIFTYREALTY', 'NIFTYENERGY', 'NIFTYMEDIA',
        'NIFTY100', 'NIFTY200', 'NIFTY500', 'NIFTYMIDCAP50', 'NIFTYMIDCAP100',
        'NIFTYSMLCAP50', 'NIFTYSMLCAP100', 'NIFTYNEXT50', 'NIFTYLARGEMID250']
    },

    // ============ BANKING & FINANCE ============
    BANKING_PRIVATE_LARGE_GAP:
    {
      name: 'Private Banks - Large Cap',
      stocks: ['HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'IDBI']
    },

    BANKING_PRIVATE_MID_CAP:
    {
      name: 'Private Banks - Mid Cap',
      stocks: ['YESBANK', 'IDFCFIRSTB', 'INDUSINDBK', 'FEDERALBNK']
    },

    BANKING_PRIVATE_SMALL_CAP:
    {
      name: 'Private Banks - Small Cap',
      stocks: ['YESBANK', 'IDFCFIRSTB', 'INDUSINDBK', 'FEDERALBNK']
    },

    BANKING_PSU: {
      name: 'PSU Banks',
      stocks: ['SBIN', 'BANKBARODA', 'PNB', 'CANBK', 'INDIANB', 'UNIONBANK', 'IOB', 'BANKINDIA', 'MAHABANK', 'UCOBANK', 'CENTRALBK', 'PSB']
    },
    NBFC: {
      name: '💰 NBFCs & Finance',
      stocks: ['BAJAJFINSV', 'BAJFINANCE', 'CHOLAFIN', 'SHRIRAMFIN', 'IIFL', 'LICHSGFIN',
        'PNBHOUSING', 'HDFCAMC', 'EDELWEISS', 'MOTILALOFS', 'ICICIGI', 'ICICIPRULI',
        'SBILIFE', 'HDFCLIFE', 'MUTHOOTFIN', 'MANAPPURAM', 'MAHABANK', 'AAVAS',
        'HOMEFIRST', 'UGROCAP', 'JMFINANCIL', 'ANURAS', 'APTUS', 'SPANDANA']
    },
    INSURANCE: {
      name: '🛡️ Insurance',
      stocks: ['ICICIGI', 'ICICIPRULI', 'SBILIFE', 'HDFCLIFE', 'MAXLIFEINS', 'BAJAJAUTO',
        'STARHEALTH', 'POLICYBZR', 'NIACL', 'GODIGIT', 'HDFCAMC']
    },

    // ============ IT & TECHNOLOGY ============
    IT_SERVICES: {
      name: '💻 IT Services',
      stocks: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'LTTS', 'COFORGE',
        'MPHASIS', 'PERSISTENT', 'MINDTREE', 'CYIENT', 'SONATSOFTW', 'ZENSAR',
        'MASTEK', 'KPIT', 'TATAELXSI', 'ROUTE', 'RATEGAIN', 'INTELLECT',
        'HAPPSTMNDS', 'BIRLASOFT', 'NIITLTD', 'NELCO', 'SASKEN', 'VAKRANGEE']
    },
    SOFTWARE_PRODUCTS: {
      name: '🖥️ Software & Products',
      stocks: ['NAUKRI', 'ZOMATO', 'POLICYBZR', 'ANGELONE', 'PAYTM', 'MAPMYINDIA',
        'ROUTE', 'NEWGEN', 'TANLA', 'TATATECH', 'CAMPUS', 'GOKALDAS']
    },

    // ============ PHARMA & HEALTHCARE ============
    PHARMA_LARGE: {
      name: '💊 Pharma Large Cap',
      stocks: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'LUPIN', 'AUROPHARMA',
        'TORNTPHARM', 'ALKEM', 'BIOCON', 'IPCALAB', 'GLENMARK', 'PFIZER']
    },
    PHARMA_MID_SMALL: {
      name: '💉 Pharma Mid & Small Cap',
      stocks: ['LAURUSLABS', 'GRANULES', 'NATCOPHARMA', 'LALPATHLAB', 'METROPOLIS',
        'THYROCARE', 'SUVEN', 'SOLARA', 'GLAND', 'NEULANDLAB', 'SEQUENT',
        'JBCHEPHARM', 'STRIDES', 'AJANTPHARM', 'DISHMAN', 'CAPLIN', 'ERIS',
        'SYNGENE', 'DIVIS', 'INDHOTEL', 'HIKAL', 'FDC', 'ZYDUSWELL']
    },
    HOSPITALS: {
      name: '🏥 Hospitals & Diagnostics',
      stocks: ['APOLLOHOSP', 'MAXHEALTH', 'FORTIS', 'NARAYANA', 'LALPATHLAB', 'METROPOLIS',
        'THYROCARE', 'KRSNAA', 'RAINBOW', 'MEDPLUS', 'STAR', 'KIMS']
    },

    // ============ AUTOMOBILES ============
    AUTO_OEM: {
      name: '🚗 Auto OEMs',
      stocks: ['MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT',
        'TVSMOTOR', 'ASHOKLEY', 'ESCORTS', 'SWARAJENG', 'FORCEMOT', 'MAHINDCIE',
        'TIINDIA', 'ATUL']
    },
    AUTO_ANCILLARY: {
      name: '⚙️ Auto Components',
      stocks: ['BOSCHLTD', 'MOTHERSON', 'BALKRISIND', 'MRF', 'APOLLOTYRE', 'CEAT',
        'BHARATFORG', 'EXIDEIND', 'AMARARAJA', 'ENDURANCE', 'MSUMI', 'BHARAT',
        'JKTYRE', 'SCHAEFFLER', 'SUNDARAM', 'SUPRAJIT', 'ASALCBR', 'SUNDRMFAST',
        'SUBROS', 'Gabriel', 'WHEELS', 'JAMNA', 'FIEM', 'ATUL', 'SAMVARMOT']
    },
    EV_ECOSYSTEM: {
      name: '⚡ EV & Green Mobility',
      stocks: ['TATAMOTORS', 'M&M', 'EXIDEIND', 'AMARARAJA', 'TIINDIA', 'OLECTRA',
        'IOCL', 'BPCL', 'SARDAEN', 'ELECON', 'HFCL']
    },

    // ============ METALS & MINING ============
    STEEL: {
      name: '🏗️ Steel',
      stocks: ['TATASTEEL', 'JSWSTEEL', 'SAIL', 'JINDALSTEL', 'HINDALCO', 'VEDL',
        'NMDC', 'NMDCSTEEL', 'JSPL', 'RATNAMANI', 'WELSPUNIND', 'SUNFLAG',
        'KALYANI', 'ELECTCAST', 'APL']
    },
    NON_FERROUS: {
      name: '⚒️ Non-Ferrous Metals',
      stocks: ['HINDALCO', 'VEDL', 'NATIONALUM', 'HINDCOPPER', 'HINDZINC', 'RATNAMANI',
        'WELCORP', 'BALRAMCHIN', 'JINDALSTEL', 'GRAVITA', 'ORIENTABRA']
    },
    MINING: {
      name: '⛏️ Mining & Minerals',
      stocks: ['COALINDIA', 'NMDC', 'NMDCSTEEL', 'VEDL', 'HINDZINC', 'NATIONALUM',
        'GMRINFRA', 'APLAPOLLO', 'ORIENTABRA']
    },

    // ============ OIL & GAS ============
    OIL_GAS_OMC: {
      name: '⛽ Oil Marketing',
      stocks: ['RELIANCE', 'IOC', 'BPCL', 'HINDPETRO', 'MRPL', 'CASTROLIND', 'GAIL']
    },
    OIL_GAS_EXPLORATION: {
      name: '🛢️ Oil Exploration',
      stocks: ['ONGC', 'OILUSA', 'OIL', 'SELAN', 'AEGISCHEM']
    },
    OIL_GAS_EQUIPMENT: {
      name: '🔧 Oil & Gas Equipment',
      stocks: ['BPCL', 'GESHIP', 'PETRONET', 'ONGC', 'GAIL', 'IGL', 'MGL', 'GUJARATGAS',
        'AEGISCHEM', 'DEEPAKFERT']
    },

    // ============ POWER & UTILITIES ============
    POWER_GENERATION: {
      name: '⚡ Power Generation',
      stocks: ['NTPC', 'POWERGRID', 'TATAPOWER', 'ADANIPOWER', 'ADANIGREEN', 'NHPC',
        'SJVN', 'NTPCGREEN', 'TORNTPOWER', 'CESC', 'JPPOWER', 'RELINFRA',
        'JSWENERGY', 'GIPCL', 'RPOWER', 'ARENERGI']
    },
    POWER_TRANSMISSION: {
      name: '🔌 Power T&D',
      stocks: ['POWERGRID', 'ADANITRANS', 'KEC', 'POWERINDIA', 'KALPATPOWR', 'SKIPPER',
        'JYOTHYLAB', 'EASUNREYRL']
    },
    RENEWABLE_ENERGY: {
      name: '🌱 Renewable Energy',
      stocks: ['ADANIGREEN', 'TATAPOWER', 'NTPCGREEN', 'SUZLON', 'WAAREE', 'WEBSOL',
        'INOXWIND', 'ORIENTGREEN', 'PVRINOX', 'WEBSOL', 'ARENERGI']
    },

    // ============ INFRASTRUCTURE & CONSTRUCTION ============
    CONSTRUCTION_LARGE: {
      name: '🏗️ Construction Large Cap',
      stocks: ['LARSENTOUBRO', 'ADANIENT', 'GRASIM', 'SIEMENS', 'ABB', 'CUMMINSIND',
        'BHARTIARTL', 'RELIANCE']
    },
    CONSTRUCTION_MID: {
      name: '🏢 Construction Mid Cap',
      stocks: ['NCC', 'NBCC', 'IRB', 'IRBINVIT', 'PNC', 'JKCEMENT', 'AHLUCONT',
        'GPPL', 'TRIVENI', 'CAPACITE', 'GPIL', 'J&KBANK', 'PSP']
    },
    REALTY: {
      name: '🏘️ Real Estate',
      stocks: ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'BRIGADE', 'PRESTIGE', 'SOBHA',
        'PHOENIXLTD', 'MAHLIFE', 'KOLTEPATIL', 'SUNTECK', 'IBREALEST',
        'LODHA', 'MAHSEAMLES', 'ELDEHSG', 'RAYMOND']
    },

    // ============ CEMENT ============
    CEMENT: {
      name: '🏗️ Cement',
      stocks: ['ULTRACEMCO', 'SHREECEM', 'AMBUJACEM', 'ACC', 'DALMIACEM', 'JKCEMENT',
        'RAMCOCEM', 'STARCEM', 'ORIENTCEM', 'INDIACEM', 'HEIDELBERG', 'JKLAKSHMI',
        'BIRLACORPN', 'PRSMJOHNSN', 'MANGCHEFER', 'NCLIND']
    },

    // ============ CONSUMER GOODS ============
    FMCG: {
      name: '🛒 FMCG',
      stocks: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO',
        'GODREJCP', 'COLPAL', 'TATACONSUM', 'EMAMILTD', 'JYOTHYLAB', 'VBL',
        'BIKAJI', 'RADICO', 'MCDOWELL-N', 'UNILEVY', 'ZYDUSWELL', 'VARUN',
        'GILLETTE', 'PGHH', 'HONAUT']
    },
    FOOD_BEVERAGE: {
      name: '🍔 Food & Beverage',
      stocks: ['TATACONSUM', 'VARUN', 'RADICO', 'USHAMART', 'HATSUN', 'HERITGFOOD',
        'DEVYANI', 'JUBLFOOD', 'WESTLIFE', 'WONDERLA', 'SAPPHIRE', 'BIKAJI',
        'ZOMATO', 'SWIGGY', 'BLINKIT', 'KRBL', 'SHAKTIPUMP', 'SULA', 'USHAMART']
    },
    RETAIL: {
      name: '🛍️ Retail',
      stocks: ['DMART', 'TRENT', 'TITAN', 'SHOPERSTOP', 'RELAXO', 'BATA', 'VMART',
        'SPENCERS', 'VEDANT', 'VIJIFIN', 'ADITYA', 'ASIANPAINT']
    },

    // ============ TELECOM & MEDIA ============
    TELECOM: {
      name: '📱 Telecom',
      stocks: ['BHARTIARTL', 'RELIANCE', 'INDUSINDBK', 'TATACOMM', 'GTPL', 'HFCL',
        'STERLITE', 'VGUARD', 'ROUTE', 'TTML', 'TATAELXSI']
    },
    MEDIA_ENTERTAINMENT: {
      name: '📺 Media & Entertainment',
      stocks: ['ZEEL', 'SUNTV', 'PVRINOX', 'INOXLEISUR', 'NETWORK18', 'TVTODAY',
        'NAZARA', 'TIPS', 'UFO', 'SAREGAMA', 'BALAJITELE', 'EROSMEDIA']
    },

    // ============ CHEMICALS ============
    CHEMICALS_SPECIALTY: {
      name: '🧪 Specialty Chemicals',
      stocks: ['SRF', 'PIDILITIND', 'AARTI', 'ATUL', 'DEEPAKFERT', 'DEEPAKNTR',
        'BALRAMCHIN', 'NAVINFLUOR', 'ALKYLAMINE', 'CHEMCON', 'TATACHEM',
        'FINEORG', 'VINATI', 'CLEAN', 'NILKAMAL', 'GULFOILLUB', 'GARFIBRES']
    },
    CHEMICALS_COMMODITY: {
      name: '⚗️ Commodity Chemicals',
      stocks: ['UPL', 'PIIND', 'GUJALKALI', 'BASF', 'NOCIL', 'APLAPOLLO', 'KANSAINER',
        'TIINDIA', 'FINEORG', 'GALAXYSURF', 'NOCIL', 'GULFOILLUB']
    },
    FERTILIZERS: {
      name: '🌾 Fertilizers & Agro',
      stocks: ['UPL', 'PIIND', 'COROMANDEL', 'DEEPAKFERT', 'GSFC', 'GNFC', 'CHAMFERT',
        'ZUARI', 'MADRASFERT', 'RALLIS', 'SUMICHEM', 'SPIC']
    },
    PAINTS: {
      name: '🎨 Paints',
      stocks: ['ASIANPAINT', 'BERGEPAINT', 'AKZOINDIA', 'INDIGO', 'KANSAINER', 'SHALPAINTS']
    },

    // ============ CAPITAL GOODS ============
    ENGINEERING: {
      name: '⚙️ Engineering & Capital Goods',
      stocks: ['SIEMENS', 'ABB', 'CUMMINSIND', 'THERMAX', 'BHEL', 'TIINDIA', 'AIA',
        'VOLTAMP', 'ELECON', 'PRAJIND', 'KIRLOSENG', 'TRIVENI', 'NELCAST',
        'KIRLOSFER', 'VOLTAMP', 'HEG']
    },
    ELECTRICAL_EQUIPMENT: {
      name: '💡 Electrical Equipment',
      stocks: ['HAVELLS', 'POLYCAB', 'VGUARD', 'CROMPTON', 'FINOLEX', 'KEI', 'DIXON',
        'AMBER', 'GLENMARK', 'BAJAJHIND', 'SKIPPER', 'ORIENTELEC']
    },
    DEFENCE_AEROSPACE: {
      name: '✈️ Defence & Aerospace',
      stocks: ['HAL', 'BEL', 'MAZDA', 'SOLARA', 'MIDHANI', 'BEML', 'COCHINSHIP',
        'GRSE', 'GOACARBON', 'BHARAT', 'LATENTVIEW']
    },
    RAILWAYS: {
      name: '🚂 Railways',
      stocks: ['RITES', 'IRCTC', 'IRFC', 'IREDA', 'TITAGARH', 'TEXRAIL', 'RESPONIND',
        'RAILTEL', 'CONCOR', 'RVNL', 'BEML']
    },

    // ============ TEXTILES & APPAREL ============
    TEXTILES: {
      name: '👔 Textiles',
      stocks: ['RAYMOND', 'ARVIND', 'VARDHMAN', 'WELSPUNIND', 'TRIDENT', 'ALOKTEXT',
        'KPRMILL', 'SPTL', 'DOLLAR', 'GOKALDAS', 'PGIL', 'NITIN', 'SPENTEX']
    },
    APPAREL: {
      name: '👕 Apparel & Fashion',
      stocks: ['PAGE', 'ADITYA', 'ARVIND', 'RAYMOND', 'GOKALDAS', 'DOLLAR', 'SPENTEX']
    },

    // ============ TOURISM & HOSPITALITY ============
    HOTELS: {
      name: '🏨 Hotels',
      stocks: ['INDHOTEL', 'LEMONTREE', 'CHALET', 'ORIENTALHOTELS', 'MAHINDHOLIDAY',
        'TAJGVK', 'EIHOTEL', 'INDOTECH']
    },
    AVIATION: {
      name: 'Aviation',
      stocks: ['INDIGO', 'SPICEJET']
    },
    TRAVEL_TOURISM: {
      name: '🧳 Travel & Tourism',
      stocks: ['THOMASCOOK', 'COX&KINGS', 'YATRA', 'IRCTC', 'EASEMYTRIP', 'WONDERLA']
    },

    // ============ LOGISTICS ============
    LOGISTICS: {
      name: '🚚 Logistics',
      stocks: ['BLUEDART', 'MAHLOG', 'GATI', 'AEGISCHEM', 'CONCOR', 'ALLCARGO',
        'SNOWMAN', 'TCI', 'VRL', 'MAHLOG']
    },
    PORTS_SHIPPING: {
      name: '⚓ Ports & Shipping',
      stocks: ['ADANIPORTS', 'SHREEPUSHK', 'COCHINSHIP', 'GRSE', 'SCI', 'ESABINDIA',
        'GESHIP', 'SHREEPUSHK']
    },

    // ============ AGRICULTURE ============
    AGRICULTURE: {
      name: '🌾 Agriculture',
      stocks: ['JKTYRE', 'M&M', 'ESCORTS', 'VST', 'RALLIS', 'BAYER', 'DHANUKA',
        'AVANTIFEED', 'KRBL', 'USHAMART']
    },

    // ============ PAPER & PACKAGING ============
    PAPER: {
      name: '📄 Paper & Pulp',
      stocks: ['TNPL', 'BALLARPUR', 'WSTCSTPAPR', 'SESAGOA', 'TAMILNADU', 'ANDREWYU']
    },
    PACKAGING: {
      name: '📦 Packaging',
      stocks: ['TCNSBRANDS', 'EPACK', 'UFLEX', 'MAXIMAA', 'PACKRITE']
    },

    // ============ EDUCATION ============
    EDUCATION: {
      name: '🎓 Education',
      stocks: ['APTECH', 'NIIT', 'CAREEREDGE', 'MTEDUCARE', 'TREEHOUSE']
    },

    // ============ FINANCIAL SERVICES ============
    EXCHANGES_DEPOSITORIES: {
      name: '📈 Exchanges & Depositories',
      stocks: ['CDSL', 'NCDEX', 'MCX', 'BSE']
    },
    ASSET_MANAGEMENT: {
      name: '💼 AMC & Wealth',
      stocks: ['HDFCAMC', 'NAVAFL', 'UTIAMC', 'MOTILALOFS', 'ANGELONE', 'IIFLWAM',
        '5PAISA', 'SBICAPS']
    },
    FINTECH: {
      name: '💳 Fintech',
      stocks: ['PAYTM', 'POLICYBZR', 'ANGELONE', 'JMFINANCIL', 'MASTEK', 'NEWGEN']
    },

    // ============ COMMODITIES & TRADING ============
    COMMODITIES: {
      name: '📊 Commodity Trading',
      stocks: ['ICICIGI', 'MCX', 'NCDEX', 'NIFTY', 'GOLDBEES', 'SILVERBEES']
    },

    // ============ JEWELLERY ============
    JEWELLERY: {
      name: '💎 Jewellery',
      stocks: ['TITAN', 'KALYANKJIL', 'THANGAMAY', 'RAJESHEXPO', 'MUTHOOTFIN', 'MANAPPURAM']
    },

    // ============ GLASS & CERAMICS ============
    GLASS_CERAMICS: {
      name: '🪟 Glass & Ceramics',
      stocks: ['ASHIANA', 'HNGIL', 'KANSAINER', 'ORIENTABRA', 'SOMANY', 'HSIL']
    },

    // ============ TYRE & RUBBER ============
    TYRES: {
      name: '⚫ Tyres',
      stocks: ['MRF', 'APOLLOTYRE', 'BALKRISIND', 'CEAT', 'JKTYRE', 'GOODYEAR', 'TVS']
    },

    // ============ ELECTRONICS ============
    ELECTRONICS: {
      name: '📱 Electronics & Appliances',
      stocks: ['DIXON', 'AMBER', 'ROUTE', 'BAJAJHIND', 'BLUESTARCO', 'VOLTAS',
        'WHIRLPOOL', 'SYMPHONY', 'ORIENTELEC', 'NELCO']
    },

    // ============ MISCELLANEOUS ============
    DIVERSIFIED: {
      name: '🔀 Diversified',
      stocks: ['ADANIENT', 'ITC', 'RELIANCE', 'BHARTIARTL', 'LARSENTOUBRO', 'TATAMOTORS',
        'RAYMOND', 'TATACONSUM', 'GMBREW']
    },

    // ============ ETFs & MUTUAL FUNDS ============
    ETFS: {
      name: '📊 ETFs',
      stocks: ['NIFTYBEES', 'BANKBEES', 'GOLDBEES', 'SILVERBEES', 'JUNIORBEES', 'PSUBNKBEES',
        'GROWWEV', 'GROWWRAIL', 'ITETF', 'MOHEALTH', 'LICNETFGSC', 'SETFNIFBK']
    },

    // ============ EMERGING SECTORS ============
    STARTUPS_NEW_AGE: {
      name: '🚀 New Age Tech',
      stocks: ['ZOMATO', 'NYKAA', 'POLICYBZR', 'PAYTM', 'DELHIVERY', 'MAMAEARTH',
        'CARTRADE', 'NAZARA', 'EASEMYTRIP', 'KALYANKJIL']
    },

    GREEN_HYDROGEN: {
      name: '🌿 Green Hydrogen & Clean Tech',
      stocks: ['RELIANCE', 'ADANIGREEN', 'NTPCGREEN', 'LARSENTO', 'SUZLON', 'INOXWIND']
    },

    // ============ SPECIAL SITUATIONS ============
    SMALLCAP_MULTIBAGGER: {
      name: '💰 Small Cap Special',
      stocks: ['EASEMYTRIP', 'RADICO', 'JMFINANCIL', 'KALYANKJIL', 'VARUN', 'ELECON',
        'ROUTE', 'HAPPSTMNDS', 'CHALET', 'UJJIVANSFB', 'BIKAJI']
    }
  },

  // Date range for fetching data
  START_DATE: '2025-01-01',

  // File configuration
  EXCEL_FILE: 'stock_prices_categorized.xlsx',
  DETAILED_EXCEL_FILE: 'stock_prices_detailed.xlsx',
  HTML_OUTPUT_DIR: 'heatmaps',  // Directory for HTML heatmaps

  // Data options
  INTERVAL_MINUTES: 1440,
  INCLUDE_PERCENTAGES: true,

  // Color highlighting threshold for detailed file only
  HIGHLIGHT_THRESHOLD: 2.0
};

// Helper function to get all stocks from categories
function getAllStocks(categories) {
  const allStocks = [];
  Object.values(categories).forEach(category => {
    allStocks.push(...category.stocks);
  });
  return allStocks;
}

// ===========================
// GROWW API CLIENT
// ===========================
class GrowwAPIClient {
  constructor(config) {
    this.baseUrl = config.GROWW_BASE_URL;
    this.bearerToken = config.BEARER_TOKEN;
    this.exchange = config.EXCHANGE;
    this.segment = config.SEGMENT;
    this.intervalMinutes = config.INTERVAL_MINUTES;

    if (!this.bearerToken) {
      console.error('⚠️  WARNING: Bearer token not configured!');
      console.error('Please add your Bearer token to the CONFIG.');
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-API-VERSION': '1.0'
    };
  }

  formatDateTime(date, time = '09:15:00') {
    return dayjs(date).format('YYYY-MM-DD') + ' ' + time;
  }

  async getStockData(symbol, startDate, endDate) {
    try {
      const start_time = this.formatDateTime(startDate, '09:15:00');
      const end_time = this.formatDateTime(endDate, '15:15:00');

      const url = `${this.baseUrl}/historical/candle/range`;

      const params = {
        exchange: this.exchange,
        segment: this.segment,
        trading_symbol: symbol,
        Accept: 'application/json',
        start_time: start_time,
        end_time: end_time,
        interval_in_minutes: this.intervalMinutes
      };

      const response = await axios.get(url, {
        params: params,
        headers: this.getHeaders(),
        timeout: 15000
      });

      if (response.data && response.data.payload && response.data.payload.candles) {
        const candles = response.data.payload.candles;

        if (candles.length === 0) {
          return { error: 'No data available for date range' };
        }

        const processedData = this.processCandles(candles, symbol);
        return processedData;

      } else {
        return { error: 'Invalid response structure' };
      }

    } catch (error) {
      let errorMessage = 'Unknown error';

      if (error.response) {
        errorMessage = `API Error (${error.response.status}): ${error.response.data?.message || 'Unknown error'}`;
      } else if (error.request) {
        errorMessage = 'Network Error: No response';
      } else {
        errorMessage = error.message;
      }

      return { error: errorMessage };
    }
  }

  processCandles(candles, symbol) {
    const results = candles.map((row, index) => {
      const [timestamp, open, high, low, close, volume] = row;

      let closeToClosePct = null;
      if (index > 0) {
        const prevClose = candles[index - 1][4];
        closeToClosePct = ((close - prevClose) / prevClose) * 100;
      }

      let openToClosePct = ((close - open) / open) * 100;

      return {
        date: dayjs.unix(timestamp).format('YYYY-MM-DD'),
        datetime: dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss'),
        open: parseFloat(parseFloat(open).toFixed(2)),
        high: parseFloat(parseFloat(high).toFixed(2)),
        low: parseFloat(parseFloat(low).toFixed(2)),
        close: parseFloat(parseFloat(close).toFixed(2)),
        volume: parseInt(volume),
        close_to_close_pct: closeToClosePct ? parseFloat(closeToClosePct.toFixed(2)) : null,
        open_to_close_pct: parseFloat(openToClosePct.toFixed(2))
      };
    });

    const reversed = results.reverse();

    let cumulative = 0;
    reversed.forEach(row => {
      if (row.close_to_close_pct !== null) {
        cumulative += row.close_to_close_pct;
      }
      row.cumulative_close_pct = parseFloat(cumulative.toFixed(2));
    });

    return {
      symbol: symbol,
      candles: reversed,
      latestClose: reversed[0].close,
      latestDate: reversed[0].date
    };
  }

  async getMultipleStocks(symbols, startDate, endDate) {
    const results = {};
    const failedStocks = [];
    const totalStocks = symbols.filter(s => s && s.trim() !== '').length;
    let currentIndex = 0;
    const startTime = Date.now();

    console.log(`\n📦 Starting to fetch ${totalStocks} stocks...\n`);

    for (const symbol of symbols) {
      if (!symbol || symbol.trim() === '') continue;

      currentIndex++;
      const percentComplete = ((currentIndex / totalStocks) * 100).toFixed(1);

      // Calculate estimated time remaining
      const elapsedTime = Date.now() - startTime;
      const avgTimePerStock = elapsedTime / currentIndex;
      const remainingStocks = totalStocks - currentIndex;
      const estimatedTimeRemaining = (avgTimePerStock * remainingStocks) / 1000; // in seconds
      const etaMinutes = Math.floor(estimatedTimeRemaining / 60);
      const etaSeconds = Math.floor(estimatedTimeRemaining % 60);

      // Progress bar
      const barLength = 30;
      const filledLength = Math.floor((currentIndex / totalStocks) * barLength);
      const emptyLength = barLength - filledLength;
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

      // Display progress
      console.log(`\n[${progressBar}] ${percentComplete}%`);
      console.log(`📊 Progress: ${currentIndex}/${totalStocks} stocks`);
      console.log(`⏱️  ETA: ${etaMinutes}m ${etaSeconds}s | ⚡ Fetching: ${symbol}`);

      const data = await this.getStockData(symbol, startDate, endDate);

      if (data && data.error) {
        // Stock fetch failed
        failedStocks.push({
          symbol: symbol,
          error: data.error,
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
        results[symbol] = null;
        console.log(`   ❌ Failed`);
      } else {
        results[symbol] = data;
        console.log(`   ✅ Success`);
      }

      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Final summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n${'='.repeat(65)}`);
    console.log(`✨ Fetch completed in ${totalTime}s`);
    console.log(`   ✅ Successful: ${totalStocks - failedStocks.length} stocks`);
    console.log(`   ❌ Failed: ${failedStocks.length} stocks`);
    console.log(`${'='.repeat(65)}\n`);

    return { results, failedStocks };
  }
}

// ===========================
// NSE INSTITUTIONAL & OPTIONS ANALYZER
// ===========================
class NSEDataAnalyzer {
  constructor(config) {
    this.enableFII = config.ENABLE_FII_DII !== true;
    this.enableOptions = config.ENABLE_OPTIONS !== true;
    this.nseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.nseindia.com/'
    };
  }

  async fetchFIIDIIData() {
    if (!this.enableFII) {
      return { fiiNet: 'N/A', diiNet: 'N/A', fiiTrend: 'Disabled' };
    }

    try {
      console.log('   → Fetching FII/DII data from NSE...');

      const url = 'https://www.nseindia.com/api/fiidiiTradeReact';

      const response = await axios.get(url, {
        headers: this.nseHeaders,
        timeout: 15000
      });

      if (response.data && response.data.length > 0) {
        const latest = response.data[0];
        const fiiNet = parseFloat(latest.fii || 0);
        const diiNet = parseFloat(latest.dii || 0);

        let fiiTrend = 'Neutral';
        if (fiiNet > 1000) fiiTrend = 'Strong Buying';
        else if (fiiNet > 0) fiiTrend = 'Buying';
        else if (fiiNet < -1000) fiiTrend = 'Strong Selling';
        else if (fiiNet < 0) fiiTrend = 'Selling';

        console.log(`   ✓ FII: ₹${fiiNet.toFixed(0)}Cr | DII: ₹${diiNet.toFixed(0)}Cr`);

        return {
          fiiNet: fiiNet.toFixed(0),
          diiNet: diiNet.toFixed(0),
          fiiTrend
        };
      }

      return { fiiNet: 'N/A', diiNet: 'N/A', fiiTrend: 'No Data' };

    } catch (error) {
      console.error('   ✗ FII/DII fetch failed:', error.message);
      return { fiiNet: 'Error', diiNet: 'Error', fiiTrend: 'Error' };
    }
  }

  async fetchOptionsData(symbol) {
    if (!this.enableOptions) {
      return {
        putCallRatio: 'N/A',
        maxPain: 'N/A',
        optionSignal: 'Disabled'
      };
    }

    try {
      const url = `https://www.nseindia.com/api/option-chain-equities?symbol=${symbol}`;

      const response = await axios.get(url, {
        headers: this.nseHeaders,
        timeout: 15000
      });

      if (response.data && response.data.records && response.data.records.data) {
        const optionData = response.data.records.data;

        let totalCallOI = 0;
        let totalPutOI = 0;
        const strikePainMap = {};

        optionData.forEach(strike => {
          const strikePrice = strike.strikePrice;

          if (strike.CE) {
            totalCallOI += strike.CE.openInterest || 0;
            strikePainMap[strikePrice] = strikePainMap[strikePrice] || { callOI: 0, putOI: 0 };
            strikePainMap[strikePrice].callOI += strike.CE.openInterest || 0;
          }

          if (strike.PE) {
            totalPutOI += strike.PE.openInterest || 0;
            strikePainMap[strikePrice] = strikePainMap[strikePrice] || { callOI: 0, putOI: 0 };
            strikePainMap[strikePrice].putOI += strike.PE.openInterest || 0;
          }
        });

        const putCallRatio = totalPutOI / totalCallOI;

        let maxPainStrike = null;
        let maxPain = Infinity;

        const currentPrice = response.data.records.underlyingValue || 0;

        Object.keys(strikePainMap).forEach(strike => {
          const strikeNum = parseFloat(strike);
          const data = strikePainMap[strike];

          let totalLoss = 0;

          if (currentPrice > strikeNum) {
            totalLoss += data.callOI * (currentPrice - strikeNum);
          }

          if (currentPrice < strikeNum) {
            totalLoss += data.putOI * (strikeNum - currentPrice);
          }

          if (totalLoss < maxPain) {
            maxPain = totalLoss;
            maxPainStrike = strikeNum;
          }
        });

        let optionSignal = 'Neutral';
        if (putCallRatio > 1.2) optionSignal = 'Bullish (High PCR)';
        else if (putCallRatio < 0.8) optionSignal = 'Bearish (Low PCR)';

        if (maxPainStrike && currentPrice) {
          const distanceFromPain = ((currentPrice - maxPainStrike) / currentPrice) * 100;
          if (Math.abs(distanceFromPain) < 2) {
            optionSignal += ', Near Max Pain';
          }
        }

        return {
          putCallRatio: putCallRatio.toFixed(2),
          maxPain: maxPainStrike ? maxPainStrike.toFixed(0) : 'N/A',
          optionSignal
        };
      }

      return {
        putCallRatio: 'N/A',
        maxPain: 'N/A',
        optionSignal: 'No Options Data'
      };

    } catch (error) {
      return {
        putCallRatio: 'N/A',
        maxPain: 'N/A',
        optionSignal: 'Not Available'
      };
    }
  }

  async analyzeBatch(symbols) {
    console.log('\n📊 Fetching FII/DII & Options Data...');

    const fiiDiiData = await this.fetchFIIDIIData();

    const results = {};

    for (const symbol of symbols) {
      if (!symbol || symbol.trim() === '') continue;

      console.log(`   → Analyzing options for ${symbol}...`);
      const optionsData = await this.fetchOptionsData(symbol);

      results[symbol] = {
        ...fiiDiiData,
        ...optionsData
      };

      if (optionsData.putCallRatio !== 'N/A') {
        console.log(`   ✓ ${symbol}: PCR=${optionsData.putCallRatio}, MaxPain=${optionsData.maxPain}`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}

// ===========================
// REDDIT SENTIMENT ANALYZER
// ===========================
class RedditSentimentAnalyzer {
  constructor(config) {
    this.subreddits = config.REDDIT_SUBREDDITS || ['IndiaInvestments', 'IndianStockMarket'];
    this.postLimit = config.REDDIT_POST_LIMIT || 25;
    this.sentiment = new Sentiment();
    this.enabled = config.ENABLE_SENTIMENT !== false;
  }

  async fetchRedditPosts(subreddit, searchTerm) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/search.json`;
      const params = {
        q: searchTerm,
        restrict_sr: 'on',
        sort: 'relevance',
        t: 'week',
        limit: this.postLimit
      };

      const response = await axios.get(url, {
        params,
        headers: {
          'User-Agent': 'StockTracker/1.0'
        },
        timeout: 10000
      });

      if (response.data && response.data.data && response.data.data.children) {
        return response.data.data.children.map(post => ({
          title: post.data.title,
          text: post.data.selftext || '',
          score: post.data.score,
          num_comments: post.data.num_comments,
          created: post.data.created_utc
        }));
      }

      return [];
    } catch (error) {
      console.error(`   ⚠ Reddit API error for r/${subreddit}:`, error.message);
      return [];
    }
  }

  async analyzeSentimentForStock(symbol) {
    if (!this.enabled) {
      return {
        sentimentScore: 0,
        sentimentLabel: 'Disabled',
        postsAnalyzed: 0,
        avgRedditScore: 0
      };
    }

    try {
      const allPosts = [];

      for (const subreddit of this.subreddits) {
        const posts = await this.fetchRedditPosts(subreddit, symbol);
        allPosts.push(...posts);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (allPosts.length === 0) {
        return {
          sentimentScore: 0,
          sentimentLabel: 'No Data',
          postsAnalyzed: 0,
          avgRedditScore: 0
        };
      }

      let totalSentiment = 0;
      let totalRedditScore = 0;

      allPosts.forEach(post => {
        const text = `${post.title} ${post.text}`;
        const analysis = this.sentiment.analyze(text);

        const weight = Math.log(post.score + 1);
        totalSentiment += analysis.score * weight;
        totalRedditScore += post.score;
      });

      const avgSentiment = totalSentiment / allPosts.length;
      const avgRedditScore = Math.round(totalRedditScore / allPosts.length);

      const normalizedScore = Math.max(-100, Math.min(100, avgSentiment * 10));

      let label;
      if (normalizedScore > 20) label = 'Very Positive';
      else if (normalizedScore > 5) label = 'Positive';
      else if (normalizedScore > -5) label = 'Neutral';
      else if (normalizedScore > -20) label = 'Negative';
      else label = 'Very Negative';

      return {
        sentimentScore: normalizedScore.toFixed(1),
        sentimentLabel: label,
        postsAnalyzed: allPosts.length,
        avgRedditScore
      };

    } catch (error) {
      console.error(`   ✗ Sentiment analysis failed for ${symbol}:`, error.message);
      return {
        sentimentScore: 0,
        sentimentLabel: 'Error',
        postsAnalyzed: 0,
        avgRedditScore: 0
      };
    }
  }

  async analyzeBatch(symbols) {
    if (!this.enabled) {
      console.log('   ℹ Sentiment analysis disabled in config');
      return {};
    }

    console.log('\n📱 Analyzing Reddit Sentiment...');
    const results = {};

    for (const symbol of symbols) {
      if (!symbol || symbol.trim() === '') continue;

      console.log(`   → Analyzing sentiment for ${symbol}...`);
      results[symbol] = await this.analyzeSentimentForStock(symbol);

      if (results[symbol].postsAnalyzed > 0) {
        console.log(`   ✓ ${symbol}: ${results[symbol].sentimentLabel} (${results[symbol].postsAnalyzed} posts)`);
      } else {
        console.log(`   ⚠ ${symbol}: No Reddit data found`);
      }
    }

    return results;
  }
}

// Include the StockAnalyzer class here (same as before - too long to repeat)
// For brevity, I'm noting that the StockAnalyzer class remains unchanged

class StockAnalyzer {
  // ... (Keep all the previous StockAnalyzer methods unchanged)
  // This class is identical to the original code
  constructor() { }

  analyzeStock(stockData) {
    if (!stockData || !stockData.candles || stockData.candles.length === 0) {
      return null;
    }

    const candles = stockData.candles;
    const symbol = stockData.symbol;
    const prices = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    const dailyChanges = candles
      .map(c => c.close_to_close_pct)
      .filter(val => val !== null);

    const avgDailyChange = this.mean(dailyChanges);
    const stdDev = this.standardDeviation(dailyChanges);
    const maxGain = Math.max(...dailyChanges);
    const maxLoss = Math.min(...dailyChanges);

    const currentPrice = prices[0];
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const priceRange = highestPrice - lowestPrice;
    const priceRangePercent = (priceRange / lowestPrice) * 100;

    const sma5 = this.simpleMovingAverage(prices, 5);
    const sma10 = this.simpleMovingAverage(prices, 10);
    const sma20 = this.simpleMovingAverage(prices, 20);
    const ema9 = this.exponentialMovingAverage(prices, 9);
    const ema21 = this.exponentialMovingAverage(prices, 21);

    const rsi14 = this.calculateRSI(dailyChanges, 14);
    const macd = this.calculateMACD(prices);
    const bollingerBands = this.calculateBollingerBands(prices, 20, 2);
    const atr14 = this.calculateATR(highs, lows, prices, 14);
    const supportResistance = this.findSupportResistance(prices, highs, lows);

    const avgVolume = this.mean(volumes);
    const volumeTrend = this.determineTrend(volumes);
    const volumeRatio = volumes[0] / avgVolume;

    const adx = this.calculateADX(highs, lows, prices, 14);
    const roc = this.calculateROC(prices, 10);
    const mfi = this.calculateMFI(highs, lows, prices, volumes, 14);
    const maxDrawdown = this.calculateMaxDrawdown(prices);

    const trend = this.determineTrend(prices);
    const momentum = this.calculateMomentum(prices);

    const upDays = dailyChanges.filter(c => c > 0).length;
    const downDays = dailyChanges.filter(c => c < 0).length;
    const flatDays = dailyChanges.filter(c => c === 0).length;
    const winRate = (upDays / dailyChanges.length) * 100;

    const maxConsecutiveGains = this.findMaxConsecutive(dailyChanges, val => val > 0);
    const maxConsecutiveLosses = this.findMaxConsecutive(dailyChanges, val => val < 0);

    const totalReturn = ((currentPrice - prices[prices.length - 1]) / prices[prices.length - 1]) * 100;
    const distanceFromHigh = ((highestPrice - currentPrice) / highestPrice) * 100;
    const distanceFromLow = ((currentPrice - lowestPrice) / lowestPrice) * 100;

    const sharpeRatio = this.calculateSharpeRatio(dailyChanges);

    const bbPosition = ((currentPrice - bollingerBands.lower) / (bollingerBands.upper - bollingerBands.lower)) * 100;

    const signals = this.generateTradingSignals({
      rsi14,
      macdValue: macd.macd,
      macdSignal: macd.signal,
      currentPrice,
      sma20,
      ema9,
      ema21,
      bbUpper: bollingerBands.upper,
      bbLower: bollingerBands.lower,
      support: supportResistance.support,
      resistance: supportResistance.resistance,
      volumeRatio,
      adx
    });

    return {
      symbol,
      currentPrice: currentPrice.toFixed(2),
      highestPrice: highestPrice.toFixed(2),
      lowestPrice: lowestPrice.toFixed(2),
      priceRange: priceRange.toFixed(2),
      priceRangePercent: priceRangePercent.toFixed(2),
      totalReturn: totalReturn.toFixed(2),
      distanceFromHigh: distanceFromHigh.toFixed(2),
      distanceFromLow: distanceFromLow.toFixed(2),
      avgDailyChange: avgDailyChange.toFixed(2),
      volatility: stdDev.toFixed(2),
      maxGain: maxGain.toFixed(2),
      maxLoss: maxLoss.toFixed(2),
      upDays,
      downDays,
      winRate: winRate.toFixed(2),
      maxConsecutiveGains,
      maxConsecutiveLosses,
      sma5: sma5.toFixed(2),
      sma10: sma10.toFixed(2),
      sma20: sma20.toFixed(2),
      ema9: ema9.toFixed(2),
      ema21: ema21.toFixed(2),
      rsi14: rsi14.toFixed(2),
      macd: macd.macd.toFixed(2),
      macdSignal: macd.signal.toFixed(2),
      macdHistogram: macd.histogram.toFixed(2),
      bbUpper: bollingerBands.upper.toFixed(2),
      bbMiddle: bollingerBands.middle.toFixed(2),
      bbLower: bollingerBands.lower.toFixed(2),
      bbPosition: bbPosition.toFixed(2),
      atr14: atr14.toFixed(2),
      adx: adx.toFixed(2),
      roc: roc.toFixed(2),
      mfi: mfi.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      support: supportResistance.support.toFixed(2),
      resistance: supportResistance.resistance.toFixed(2),
      trend,
      momentum,
      avgVolume: Math.round(avgVolume).toLocaleString(),
      volumeTrend,
      volumeRatio: volumeRatio.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      tradingDays: candles.length,
      signals: signals.join(', '),
      analysis: this.generateAnalysis({
        trend,
        momentum,
        winRate,
        volatility: stdDev,
        distanceFromHigh,
        distanceFromLow,
        rsi14,
        macd: macd.histogram,
        bbPosition,
        adx,
        volumeRatio
      })
    };
  }

  // Include all helper methods (RSI, MACD, etc.) - same as before
  calculateRSI(changes, period = 14) {
    if (changes.length < period) return 50;
    let gains = 0, losses = 0;
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    const ema12 = this.exponentialMovingAverage(prices, 12);
    const ema26 = this.exponentialMovingAverage(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = macdLine * 0.9;
    return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
  }

  exponentialMovingAverage(prices, period) {
    if (prices.length < period) return prices[0];
    const multiplier = 2 / (period + 1);
    let ema = this.simpleMovingAverage(prices.slice(-period), period);
    for (let i = prices.length - period - 1; i >= 0; i--) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  calculateBollingerBands(prices, period = 20, stdDevMultiplier = 2) {
    const sma = this.simpleMovingAverage(prices, period);
    const slice = prices.slice(0, Math.min(period, prices.length));
    const stdDev = this.standardDeviation(slice);
    return {
      upper: sma + (stdDev * stdDevMultiplier),
      middle: sma,
      lower: sma - (stdDev * stdDevMultiplier)
    };
  }

  calculateATR(highs, lows, closes, period = 14) {
    const trueRanges = [];
    for (let i = 0; i < Math.min(highs.length - 1, period); i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i + 1]),
        Math.abs(lows[i] - closes[i + 1])
      );
      trueRanges.push(tr);
    }
    return this.mean(trueRanges);
  }

  calculateADX(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return 25;
    let plusDM = 0, minusDM = 0, tr = 0;
    for (let i = 0; i < period; i++) {
      const highDiff = highs[i] - highs[i + 1];
      const lowDiff = lows[i + 1] - lows[i];
      plusDM += (highDiff > lowDiff && highDiff > 0) ? highDiff : 0;
      minusDM += (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0;
      tr += Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i + 1]),
        Math.abs(lows[i] - closes[i + 1])
      );
    }
    if (tr === 0) return 25;
    const plusDI = (plusDM / tr) * 100;
    const minusDI = (minusDM / tr) * 100;
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    return dx;
  }

  calculateROC(prices, period = 10) {
    if (prices.length < period) return 0;
    const current = prices[0];
    const past = prices[Math.min(period, prices.length - 1)];
    return ((current - past) / past) * 100;
  }

  calculateMFI(highs, lows, closes, volumes, period = 14) {
    if (closes.length < period + 1) return 50;
    let positiveFlow = 0, negativeFlow = 0;
    for (let i = 0; i < period; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      const prevTypicalPrice = (highs[i + 1] + lows[i + 1] + closes[i + 1]) / 3;
      const moneyFlow = typicalPrice * volumes[i];
      if (typicalPrice > prevTypicalPrice) {
        positiveFlow += moneyFlow;
      } else {
        negativeFlow += moneyFlow;
      }
    }
    if (negativeFlow === 0) return 100;
    const moneyRatio = positiveFlow / negativeFlow;
    return 100 - (100 / (1 + moneyRatio));
  }

  calculateMaxDrawdown(prices) {
    let maxPrice = prices[prices.length - 1];
    let maxDD = 0;
    for (let i = prices.length - 1; i >= 0; i--) {
      maxPrice = Math.max(maxPrice, prices[i]);
      const drawdown = ((maxPrice - prices[i]) / maxPrice) * 100;
      maxDD = Math.max(maxDD, drawdown);
    }
    return maxDD;
  }

  findSupportResistance(prices, highs, lows) {
    const recentPrices = prices.slice(0, Math.min(20, prices.length));
    const recentHighs = highs.slice(0, Math.min(20, highs.length));
    const recentLows = lows.slice(0, Math.min(20, lows.length));
    const support = Math.min(...recentLows);
    const resistance = Math.max(...recentHighs);
    return { support, resistance };
  }

  generateTradingSignals(indicators) {
    const signals = [];
    if (indicators.rsi14 < 30) signals.push('RSI Oversold');
    else if (indicators.rsi14 > 70) signals.push('RSI Overbought');
    if (indicators.macdValue > indicators.macdSignal) signals.push('MACD Bullish');
    else if (indicators.macdValue < indicators.macdSignal) signals.push('MACD Bearish');
    if (indicators.ema9 > indicators.ema21) signals.push('Golden Cross');
    else if (indicators.ema9 < indicators.ema21) signals.push('Death Cross');
    if (indicators.currentPrice > indicators.sma20) signals.push('Above SMA20');
    else signals.push('Below SMA20');
    if (indicators.currentPrice > indicators.bbUpper) signals.push('BB Breakout High');
    else if (indicators.currentPrice < indicators.bbLower) signals.push('BB Breakout Low');
    if (indicators.volumeRatio > 1.5) signals.push('High Volume');
    else if (indicators.volumeRatio < 0.5) signals.push('Low Volume');
    if (indicators.adx > 25) signals.push('Strong Trend');
    else if (indicators.adx < 20) signals.push('Weak Trend');
    const priceToSupport = ((indicators.currentPrice - indicators.support) / indicators.support) * 100;
    const priceToResistance = ((indicators.resistance - indicators.currentPrice) / indicators.currentPrice) * 100;
    if (priceToSupport < 2) signals.push('Near Support');
    if (priceToResistance < 2) signals.push('Near Resistance');
    return signals.length > 0 ? signals : ['Neutral'];
  }

  mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  standardDeviation(arr) {
    const avg = this.mean(arr);
    const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  simpleMovingAverage(arr, period) {
    if (arr.length < period) return arr[0];
    const slice = arr.slice(0, period);
    return this.mean(slice);
  }

  determineTrend(arr) {
    if (arr.length < 5) return 'Insufficient Data';
    const recent = arr.slice(0, 5);
    const older = arr.slice(-5);
    const recentAvg = this.mean(recent);
    const olderAvg = this.mean(older);
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    if (change > 5) return 'Strong Uptrend';
    if (change > 2) return 'Uptrend';
    if (change < -5) return 'Strong Downtrend';
    if (change < -2) return 'Downtrend';
    return 'Sideways';
  }

  calculateMomentum(prices) {
    if (prices.length < 2) return 'Neutral';
    const current = prices[0];
    const previous = prices[Math.min(5, prices.length - 1)];
    const change = ((current - previous) / previous) * 100;
    if (change > 3) return 'Strong Positive';
    if (change > 1) return 'Positive';
    if (change < -3) return 'Strong Negative';
    if (change < -1) return 'Negative';
    return 'Neutral';
  }

  findMaxConsecutive(arr, condition) {
    let max = 0;
    let current = 0;
    for (let val of arr) {
      if (condition(val)) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    return max;
  }

  calculateSharpeRatio(returns) {
    const avgReturn = this.mean(returns);
    const stdDev = this.standardDeviation(returns);
    return stdDev !== 0 ? avgReturn / stdDev : 0;
  }

  generateAnalysis(metrics) {
    const insights = [];
    if (metrics.trend.includes('Uptrend')) {
      insights.push('Bullish trend');
    } else if (metrics.trend.includes('Downtrend')) {
      insights.push('Bearish trend');
    } else {
      insights.push('Range-bound');
    }
    if (metrics.rsi14 < 30) {
      insights.push('Potentially oversold');
    } else if (metrics.rsi14 > 70) {
      insights.push('Potentially overbought');
    }
    if (metrics.macd > 0) {
      insights.push('Bullish momentum');
    } else {
      insights.push('Bearish momentum');
    }
    if (metrics.volatility > 3) {
      insights.push('High volatility');
    } else if (metrics.volatility < 1) {
      insights.push('Low volatility');
    }
    if (metrics.bbPosition > 80) {
      insights.push('Upper BB zone');
    } else if (metrics.bbPosition < 20) {
      insights.push('Lower BB zone');
    }
    if (metrics.adx > 25) {
      insights.push('Strong trend');
    } else {
      insights.push('Weak trend');
    }
    if (metrics.volumeRatio > 1.5) {
      insights.push('Above-average volume');
    }
    return insights.join(', ');
  }
}

// ===========================
// COMPREHENSIVE PATTERN DETECTOR
// ===========================
class PatternDetector {
  constructor() {
    this.patterns = [];
  }

  // Main analysis function
  analyzeAllPatterns(stocksData) {
    const allPatterns = {
      candlestick: [],
      chartPatterns: [],
      breakouts: [],
      reversals: [],
      supportResistance: [],
      consolidation: [],
      momentum: [],
      anomalies: []
    };

    Object.entries(stocksData).forEach(([symbol, data]) => {
      if (!data || !data.candles || data.candles.length < 20) return;

      const candles = data.candles;

      // 1. Candlestick Patterns
      const candlestickPatterns = this.detectCandlestickPatterns(symbol, candles);
      allPatterns.candlestick.push(...candlestickPatterns);

      // 2. Chart Patterns
      const chartPatterns = this.detectChartPatterns(symbol, candles);
      allPatterns.chartPatterns.push(...chartPatterns);

      // 3. Breakout Patterns
      const breakouts = this.detectBreakouts(symbol, candles);
      allPatterns.breakouts.push(...breakouts);

      // 4. Reversal Patterns
      const reversals = this.detectReversals(symbol, candles);
      allPatterns.reversals.push(...reversals);

      // 5. Support & Resistance
      const sr = this.detectSupportResistance(symbol, candles);
      if (sr) allPatterns.supportResistance.push(sr);

      // 6. Consolidation Patterns
      const consolidation = this.detectConsolidation(symbol, candles);
      if (consolidation) allPatterns.consolidation.push(consolidation);

      // 7. Momentum Patterns
      const momentum = this.detectMomentumPatterns(symbol, candles);
      if (momentum) allPatterns.momentum.push(momentum);

      // 8. Statistical Anomalies
      const anomalies = this.detectAnomalies(symbol, candles);
      allPatterns.anomalies.push(...anomalies);
    });

    return allPatterns;
  }

  // 1. CANDLESTICK PATTERN DETECTION
  detectCandlestickPatterns(symbol, candles) {
    const patterns = [];

    // Need at least 3 candles for patterns
    if (candles.length < 3) return patterns;

    const c0 = candles[0]; // Latest
    const c1 = candles[1]; // Previous
    const c2 = candles[2]; // 2 days ago

    // Helper functions
    const body = (c) => Math.abs(c.close - c.open);
    const upperShadow = (c) => c.high - Math.max(c.open, c.close);
    const lowerShadow = (c) => Math.min(c.open, c.close) - c.low;
    const range = (c) => c.high - c.low;
    const isBullish = (c) => c.close > c.open;
    const isBearish = (c) => c.close < c.open;

    // DOJI (Indecision)
    if (body(c0) / range(c0) < 0.1) {
      patterns.push({
        symbol,
        pattern: 'Doji',
        type: 'Neutral',
        signal: 'Indecision',
        confidence: 70,
        description: 'Market indecision, potential reversal',
        date: c0.date
      });
    }

    // HAMMER (Bullish reversal)
    if (isBullish(c0) && lowerShadow(c0) > body(c0) * 2 && upperShadow(c0) < body(c0) * 0.3) {
      patterns.push({
        symbol,
        pattern: 'Hammer',
        type: 'Bullish',
        signal: 'Buy',
        confidence: 75,
        description: 'Bullish reversal after downtrend',
        date: c0.date
      });
    }

    // HANGING MAN (Bearish reversal)
    if (isBearish(c0) && lowerShadow(c0) > body(c0) * 2 && upperShadow(c0) < body(c0) * 0.3) {
      patterns.push({
        symbol,
        pattern: 'Hanging Man',
        type: 'Bearish',
        signal: 'Sell',
        confidence: 75,
        description: 'Bearish reversal after uptrend',
        date: c0.date
      });
    }

    // SHOOTING STAR (Bearish reversal)
    if (isBearish(c0) && upperShadow(c0) > body(c0) * 2 && lowerShadow(c0) < body(c0) * 0.3) {
      patterns.push({
        symbol,
        pattern: 'Shooting Star',
        type: 'Bearish',
        signal: 'Sell',
        confidence: 80,
        description: 'Strong bearish reversal signal',
        date: c0.date
      });
    }

    // BULLISH ENGULFING
    if (isBullish(c0) && isBearish(c1) &&
      c0.open < c1.close && c0.close > c1.open && body(c0) > body(c1)) {
      patterns.push({
        symbol,
        pattern: 'Bullish Engulfing',
        type: 'Bullish',
        signal: 'Strong Buy',
        confidence: 85,
        description: 'Strong bullish reversal pattern',
        date: c0.date
      });
    }

    // BEARISH ENGULFING
    if (isBearish(c0) && isBullish(c1) &&
      c0.open > c1.close && c0.close < c1.open && body(c0) > body(c1)) {
      patterns.push({
        symbol,
        pattern: 'Bearish Engulfing',
        type: 'Bearish',
        signal: 'Strong Sell',
        confidence: 85,
        description: 'Strong bearish reversal pattern',
        date: c0.date
      });
    }

    // MORNING STAR (3-candle bullish)
    if (candles.length >= 3) {
      if (isBearish(c2) && body(c1) < body(c2) * 0.3 && isBullish(c0) &&
        c0.close > (c2.open + c2.close) / 2) {
        patterns.push({
          symbol,
          pattern: 'Morning Star',
          type: 'Bullish',
          signal: 'Strong Buy',
          confidence: 90,
          description: 'Major bullish reversal pattern',
          date: c0.date
        });
      }
    }

    // EVENING STAR (3-candle bearish)
    if (candles.length >= 3) {
      if (isBullish(c2) && body(c1) < body(c2) * 0.3 && isBearish(c0) &&
        c0.close < (c2.open + c2.close) / 2) {
        patterns.push({
          symbol,
          pattern: 'Evening Star',
          type: 'Bearish',
          signal: 'Strong Sell',
          confidence: 90,
          description: 'Major bearish reversal pattern',
          date: c0.date
        });
      }
    }

    // MARUBOZU (Strong trend candle)
    if (body(c0) / range(c0) > 0.95) {
      patterns.push({
        symbol,
        pattern: isBullish(c0) ? 'Bullish Marubozu' : 'Bearish Marubozu',
        type: isBullish(c0) ? 'Bullish' : 'Bearish',
        signal: isBullish(c0) ? 'Buy' : 'Sell',
        confidence: 80,
        description: 'Strong trend continuation',
        date: c0.date
      });
    }

    return patterns;
  }

  // 2. CHART PATTERN DETECTION
  detectChartPatterns(symbol, candles) {
    const patterns = [];
    if (candles.length < 20) return patterns;

    const prices = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // HEAD AND SHOULDERS
    const h_s = this.detectHeadAndShoulders(prices, highs);
    if (h_s) {
      patterns.push({
        symbol,
        pattern: 'Head and Shoulders',
        type: 'Bearish',
        signal: 'Sell',
        confidence: 85,
        description: `Bearish reversal, neckline at ₹${h_s.neckline.toFixed(2)}`,
        target: h_s.target,
        date: candles[0].date
      });
    }

    // DOUBLE TOP
    const doubleTop = this.detectDoubleTop(prices, highs);
    if (doubleTop) {
      patterns.push({
        symbol,
        pattern: 'Double Top',
        type: 'Bearish',
        signal: 'Sell',
        confidence: 80,
        description: `Resistance at ₹${doubleTop.resistance.toFixed(2)}`,
        target: doubleTop.target,
        date: candles[0].date
      });
    }

    // DOUBLE BOTTOM
    const doubleBottom = this.detectDoubleBottom(prices, lows);
    if (doubleBottom) {
      patterns.push({
        symbol,
        pattern: 'Double Bottom',
        type: 'Bullish',
        signal: 'Buy',
        confidence: 80,
        description: `Support at ₹${doubleBottom.support.toFixed(2)}`,
        target: doubleBottom.target,
        date: candles[0].date
      });
    }

    // ASCENDING TRIANGLE
    const ascTriangle = this.detectAscendingTriangle(highs, lows);
    if (ascTriangle) {
      patterns.push({
        symbol,
        pattern: 'Ascending Triangle',
        type: 'Bullish',
        signal: 'Buy on Breakout',
        confidence: 75,
        description: `Bullish consolidation, breakout expected above ₹${ascTriangle.resistance.toFixed(2)}`,
        target: ascTriangle.target,
        date: candles[0].date
      });
    }

    // CUP AND HANDLE
    const cupHandle = this.detectCupAndHandle(prices);
    if (cupHandle) {
      patterns.push({
        symbol,
        pattern: 'Cup and Handle',
        type: 'Bullish',
        signal: 'Strong Buy',
        confidence: 85,
        description: `Bullish continuation, target ₹${cupHandle.target.toFixed(2)}`,
        target: cupHandle.target,
        date: candles[0].date
      });
    }

    return patterns;
  }

  // 3. BREAKOUT DETECTION
  detectBreakouts(symbol, candles) {
    const breakouts = [];
    if (candles.length < 52) return breakouts;

    const current = candles[0];
    const prices = candles.map(c => c.close);

    // 52-Week High
    const fiftyTwoWeekHigh = Math.max(...prices.slice(0, 252));
    if (current.close >= fiftyTwoWeekHigh * 0.98) {
      breakouts.push({
        symbol,
        pattern: '52-Week High Breakout',
        type: 'Bullish',
        signal: 'Buy',
        confidence: 85,
        description: `Breaking 52W high of ₹${fiftyTwoWeekHigh.toFixed(2)}`,
        level: fiftyTwoWeekHigh,
        date: current.date
      });
    }

    // 52-Week Low
    const fiftyTwoWeekLow = Math.min(...prices.slice(0, 252));
    if (current.close <= fiftyTwoWeekLow * 1.02) {
      breakouts.push({
        symbol,
        pattern: '52-Week Low Test',
        type: 'Bearish',
        signal: 'Watch',
        confidence: 70,
        description: `Near 52W low of ₹${fiftyTwoWeekLow.toFixed(2)}`,
        level: fiftyTwoWeekLow,
        date: current.date
      });
    }

    // Volume Breakout
    const avgVolume = candles.slice(1, 21).reduce((sum, c) => sum + c.volume, 0) / 20;
    if (current.volume > avgVolume * 2) {
      breakouts.push({
        symbol,
        pattern: 'Volume Breakout',
        type: current.close_to_close_pct > 0 ? 'Bullish' : 'Bearish',
        signal: 'Watch',
        confidence: 75,
        description: `Volume ${(current.volume / avgVolume).toFixed(1)}x average`,
        volumeRatio: (current.volume / avgVolume).toFixed(1),
        date: current.date
      });
    }

    // Range Breakout
    const recentHigh = Math.max(...prices.slice(0, 20));
    const recentLow = Math.min(...prices.slice(0, 20));
    const rangeSize = recentHigh - recentLow;

    if (current.close > recentHigh && rangeSize / recentLow < 0.05) {
      breakouts.push({
        symbol,
        pattern: 'Consolidation Breakout',
        type: 'Bullish',
        signal: 'Buy',
        confidence: 80,
        description: `Breaking out of ${((rangeSize / recentLow) * 100).toFixed(1)}% range`,
        range: rangeSize,
        date: current.date
      });
    }

    return breakouts;
  }

  // 4. REVERSAL DETECTION
  detectReversals(symbol, candles) {
    const reversals = [];
    if (candles.length < 30) return reversals;

    // Calculate RSI
    const changes = candles.map(c => c.close_to_close_pct).filter(c => c !== null);
    const rsi = this.calculateRSI(changes, 14);

    // RSI Divergence
    const recentPrices = candles.slice(0, 10).map(c => c.close);
    const priceHigh = Math.max(...recentPrices);
    const priceLow = Math.min(...recentPrices);

    // Bearish Divergence (price up, RSI down)
    if (recentPrices[0] >= priceHigh * 0.98 && rsi < 60) {
      reversals.push({
        symbol,
        pattern: 'Bearish RSI Divergence',
        type: 'Bearish',
        signal: 'Sell',
        confidence: 75,
        description: 'Price making highs but RSI weakening',
        rsi: rsi.toFixed(1),
        date: candles[0].date
      });
    }

    // Bullish Divergence (price down, RSI up)
    if (recentPrices[0] <= priceLow * 1.02 && rsi > 40) {
      reversals.push({
        symbol,
        pattern: 'Bullish RSI Divergence',
        type: 'Bullish',
        signal: 'Buy',
        confidence: 75,
        description: 'Price making lows but RSI strengthening',
        rsi: rsi.toFixed(1),
        date: candles[0].date
      });
    }

    // Parabolic Move (Blow-off top)
    const last5Changes = changes.slice(0, 5);
    const allPositive = last5Changes.every(c => c > 2);
    if (allPositive) {
      reversals.push({
        symbol,
        pattern: 'Parabolic Move',
        type: 'Warning',
        signal: 'Take Profit',
        confidence: 70,
        description: 'Vertical rise, exhaustion likely',
        avgGain: (last5Changes.reduce((a, b) => a + b, 0) / 5).toFixed(1),
        date: candles[0].date
      });
    }

    // Capitulation (Falling Knife)
    const allNegative = last5Changes.every(c => c < -2);
    if (allNegative) {
      reversals.push({
        symbol,
        pattern: 'Capitulation',
        type: 'Bullish',
        signal: 'Watch for Bounce',
        confidence: 65,
        description: 'Heavy selling, possible bottom',
        avgLoss: (last5Changes.reduce((a, b) => a + b, 0) / 5).toFixed(1),
        date: candles[0].date
      });
    }

    return reversals;
  }

  // 5. SUPPORT & RESISTANCE DETECTION
  detectSupportResistance(symbol, candles) {
    if (candles.length < 20) return null;

    const prices = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const current = candles[0].close;

    // Find pivot highs and lows
    const pivotHighs = [];
    const pivotLows = [];

    for (let i = 2; i < Math.min(20, highs.length - 2); i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
        pivotHighs.push(highs[i]);
      }

      if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
        lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
        pivotLows.push(lows[i]);
      }
    }

    // Find nearest support and resistance
    const resistanceLevels = pivotHighs.filter(h => h > current).sort((a, b) => a - b);
    const supportLevels = pivotLows.filter(l => l < current).sort((a, b) => b - a);

    const nearestResistance = resistanceLevels[0] || Math.max(...highs);
    const nearestSupport = supportLevels[0] || Math.min(...lows);

    const distToResistance = ((nearestResistance - current) / current) * 100;
    const distToSupport = ((current - nearestSupport) / current) * 100;

    let status = 'Mid-range';
    if (distToSupport < 2) status = 'At Support';
    else if (distToResistance < 2) status = 'At Resistance';

    return {
      symbol,
      current: current.toFixed(2),
      support: nearestSupport.toFixed(2),
      resistance: nearestResistance.toFixed(2),
      distToSupport: distToSupport.toFixed(1),
      distToResistance: distToResistance.toFixed(1),
      status,
      date: candles[0].date
    };
  }

  // 6. CONSOLIDATION DETECTION
  detectConsolidation(symbol, candles) {
    if (candles.length < 15) return null;

    const recent = candles.slice(0, 15);
    const prices = recent.map(c => c.close);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const rangePercent = ((high - low) / low) * 100;

    // Calculate ATR
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);
    const atr = this.calculateATR(highs, lows, prices, 14);
    const atrPercent = (atr / prices[0]) * 100;

    // Consolidation if range < 5% and ATR is low
    if (rangePercent < 5 && atrPercent < 2) {
      const expectedMove = rangePercent * 2; // Expected breakout move

      return {
        symbol,
        pattern: 'Tight Consolidation',
        days: 15,
        rangePercent: rangePercent.toFixed(1),
        atrPercent: atrPercent.toFixed(1),
        expectedMove: expectedMove.toFixed(1),
        status: 'Breakout Imminent',
        signal: 'Watch',
        date: candles[0].date
      };
    }

    // Bollinger Squeeze
    const sma20 = prices.reduce((a, b) => a + b, 0) / prices.length;
    const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - sma20, 2), 0) / prices.length);
    const bandWidth = (4 * stdDev / sma20) * 100;

    if (bandWidth < 5) {
      return {
        symbol,
        pattern: 'Bollinger Squeeze',
        days: 15,
        bandWidth: bandWidth.toFixed(1),
        expectedMove: (bandWidth * 2).toFixed(1),
        status: 'Low Volatility',
        signal: 'Breakout Setup',
        date: candles[0].date
      };
    }

    return null;
  }

  // 7. MOMENTUM PATTERNS
  detectMomentumPatterns(symbol, candles) {
    if (candles.length < 10) return null;

    const changes = candles.slice(0, 10).map(c => c.close_to_close_pct).filter(c => c !== null);

    // Consecutive up days
    let upStreak = 0;
    for (let change of changes) {
      if (change > 0) upStreak++;
      else break;
    }

    // Consecutive down days
    let downStreak = 0;
    for (let change of changes) {
      if (change < 0) downStreak++;
      else break;
    }

    let pattern = null;

    if (upStreak >= 5) {
      pattern = {
        symbol,
        pattern: `${upStreak} Consecutive Up Days`,
        type: 'Bullish',
        streak: upStreak,
        avgGain: (changes.slice(0, upStreak).reduce((a, b) => a + b, 0) / upStreak).toFixed(1),
        status: upStreak >= 7 ? 'Exhaustion Risk' : 'Strong Momentum',
        signal: upStreak >= 7 ? 'Take Profit' : 'Hold',
        date: candles[0].date
      };
    } else if (downStreak >= 5) {
      pattern = {
        symbol,
        pattern: `${downStreak} Consecutive Down Days`,
        type: 'Bearish',
        streak: downStreak,
        avgLoss: (changes.slice(0, downStreak).reduce((a, b) => a + b, 0) / downStreak).toFixed(1),
        status: downStreak >= 7 ? 'Oversold' : 'Weak',
        signal: downStreak >= 7 ? 'Watch for Bounce' : 'Avoid',
        date: candles[0].date
      };
    }

    return pattern;
  }

  // 8. STATISTICAL ANOMALIES
  detectAnomalies(symbol, candles) {
    const anomalies = [];
    if (candles.length < 20) return anomalies;

    const current = candles[0];
    const recent = candles.slice(1, 21);

    // Volume Spike
    const avgVolume = recent.reduce((sum, c) => sum + c.volume, 0) / 20;
    const volumeRatio = current.volume / avgVolume;

    if (volumeRatio > 3) {
      anomalies.push({
        symbol,
        anomaly: 'Extreme Volume Spike',
        type: 'Volume',
        severity: volumeRatio > 10 ? 'Extreme' : 'High',
        value: `${volumeRatio.toFixed(1)}x`,
        description: `Volume is ${volumeRatio.toFixed(1)}x the 20-day average`,
        date: current.date
      });
    }

    // Price Spike
    if (current.close_to_close_pct !== null) {
      if (Math.abs(current.close_to_close_pct) > 10) {
        anomalies.push({
          symbol,
          anomaly: 'Extreme Price Move',
          type: 'Price',
          severity: 'Extreme',
          value: `${current.close_to_close_pct.toFixed(1)}%`,
          description: `Price moved ${current.close_to_close_pct.toFixed(1)}% in one day`,
          date: current.date
        });
      }
    }

    // Gap
    const prevClose = candles[1].close;
    const gap = ((current.open - prevClose) / prevClose) * 100;

    if (Math.abs(gap) > 3) {
      anomalies.push({
        symbol,
        anomaly: gap > 0 ? 'Gap Up' : 'Gap Down',
        type: 'Gap',
        severity: Math.abs(gap) > 5 ? 'High' : 'Medium',
        value: `${gap.toFixed(1)}%`,
        description: `Opened ${Math.abs(gap).toFixed(1)}% ${gap > 0 ? 'above' : 'below'} previous close`,
        date: current.date
      });
    }

    // Volatility Spike (ATR expansion)
    const prices = candles.slice(0, 15).map(c => c.close);
    const highs = candles.slice(0, 15).map(c => c.high);
    const lows = candles.slice(0, 15).map(c => c.low);
    const currentATR = this.calculateATR(highs, lows, prices, 14);

    const olderPrices = candles.slice(15, 30).map(c => c.close);
    const olderHighs = candles.slice(15, 30).map(c => c.high);
    const olderLows = candles.slice(15, 30).map(c => c.low);
    const olderATR = this.calculateATR(olderHighs, olderLows, olderPrices, 14);

    const atrRatio = currentATR / olderATR;

    if (atrRatio > 2) {
      anomalies.push({
        symbol,
        anomaly: 'Volatility Expansion',
        type: 'Volatility',
        severity: 'High',
        value: `${atrRatio.toFixed(1)}x`,
        description: `ATR increased ${atrRatio.toFixed(1)}x - high volatility period`,
        date: current.date
      });
    }

    return anomalies;
  }

  // Helper: Calculate RSI
  calculateRSI(changes, period = 14) {
    if (changes.length < period) return 50;

    let gains = 0, losses = 0;
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Helper: Calculate ATR
  calculateATR(highs, lows, closes, period) {
    const trueRanges = [];
    for (let i = 0; i < Math.min(highs.length - 1, period); i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i + 1]),
        Math.abs(lows[i] - closes[i + 1])
      );
      trueRanges.push(tr);
    }
    return trueRanges.reduce((a, b) => a + b, 0) / trueRanges.length;
  }

  // Chart Pattern Helpers
  detectHeadAndShoulders(prices, highs) {
    // Simplified H&S detection
    if (highs.length < 20) return null;

    const recentHighs = highs.slice(0, 20);
    const maxHigh = Math.max(...recentHighs);
    const maxIdx = recentHighs.indexOf(maxHigh);

    // Need shoulders on both sides
    if (maxIdx < 3 || maxIdx > 17) return null;

    const leftShoulder = Math.max(...recentHighs.slice(maxIdx + 3, maxIdx + 8));
    const rightShoulder = Math.max(...recentHighs.slice(0, maxIdx - 3));

    // Check if pattern exists
    if (leftShoulder < maxHigh * 0.95 && rightShoulder < maxHigh * 0.95 &&
      Math.abs(leftShoulder - rightShoulder) / leftShoulder < 0.05) {
      const neckline = Math.min(leftShoulder, rightShoulder);
      const target = neckline - (maxHigh - neckline);

      return { neckline, target };
    }

    return null;
  }

  detectDoubleTop(prices, highs) {
    if (highs.length < 15) return null;

    const recentHighs = highs.slice(0, 15);
    const sorted = [...recentHighs].sort((a, b) => b - a);

    // Two similar highs
    if (Math.abs(sorted[0] - sorted[1]) / sorted[0] < 0.02) {
      const resistance = sorted[0];
      const target = prices[0] - (resistance - prices[0]);
      return { resistance, target };
    }

    return null;
  }

  detectDoubleBottom(prices, lows) {
    if (lows.length < 15) return null;

    const recentLows = lows.slice(0, 15);
    const sorted = [...recentLows].sort((a, b) => a - b);

    // Two similar lows
    if (Math.abs(sorted[0] - sorted[1]) / sorted[0] < 0.02) {
      const support = sorted[0];
      const target = prices[0] + (prices[0] - support);
      return { support, target };
    }

    return null;
  }

  detectAscendingTriangle(highs, lows) {
    if (highs.length < 15) return null;

    const recentHighs = highs.slice(0, 15);
    const recentLows = lows.slice(0, 15);

    // Flat resistance
    const resistance = Math.max(...recentHighs);
    const highsNearResistance = recentHighs.filter(h => h > resistance * 0.98).length;

    // Rising lows
    const firstLow = Math.min(...recentLows.slice(10, 15));
    const lastLow = Math.min(...recentLows.slice(0, 5));

    if (highsNearResistance >= 2 && lastLow > firstLow) {
      const target = resistance + (resistance - firstLow);
      return { resistance, target };
    }

    return null;
  }

  detectCupAndHandle(prices) {
    if (prices.length < 30) return null;

    const recent = prices.slice(0, 30);
    const high = Math.max(...recent);
    const low = Math.min(...recent);

    // U-shaped recovery
    const highIdx = recent.indexOf(high);
    const lowIdx = recent.indexOf(low);

    if (lowIdx > highIdx && lowIdx < 25) {
      const currentPrice = prices[0];
      if (currentPrice > high * 0.95 && currentPrice < high) {
        const target = high + (high - low) * 0.5;
        return { target };
      }
    }

    return null;
  }
}

// ===========================
// HTML HEATMAP GENERATOR
// ===========================
class HTMLHeatmapGenerator {
  constructor(config) {
    this.config = config;
    this.outputDir = config.HTML_OUTPUT_DIR || 'heatmaps';
  }

  // Create output directory if it doesn't exist
  ensureDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // Generate heatmaps for all categories
  async generateAllHeatmaps(stocksData, categories) {
    this.ensureDirectory();

    console.log('\n🎨 Generating HTML Heatmaps...');

    const heatmapFiles = [];

    // Generate individual category heatmaps
    for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
      const categoryStocks = categoryInfo.stocks.filter(s => stocksData[s] && stocksData[s] !== null);

      if (categoryStocks.length === 0) continue;

      const filename = this.generateCategoryHeatmap(stocksData, categoryKey, categoryInfo, categoryStocks);
      if (filename) {
        heatmapFiles.push({
          name: categoryInfo.name,
          file: filename,
          stockCount: categoryStocks.length
        });
      }
    }

    // Generate index page
    this.generateIndexPage(heatmapFiles);

    console.log(`   ✅ Generated ${heatmapFiles.length} heatmap files in ${this.outputDir}/`);
    console.log(`   🌐 Open ${this.outputDir}/index.html in your browser`);

    return heatmapFiles;
  }

  // Generate heatmap for a single category
  generateCategoryHeatmap(stocksData, categoryKey, categoryInfo, categoryStocks) {
    // Get last 15 trading days
    const allDates = new Set();
    categoryStocks.forEach(symbol => {
      const data = stocksData[symbol];
      if (data && data.candles) {
        data.candles.forEach(candle => allDates.add(candle.date));
      }
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a)).slice(0, 15);

    if (sortedDates.length === 0) return null;

    // Build heatmap data
    const heatmapData = [];

    categoryStocks.forEach(symbol => {
      const data = stocksData[symbol];
      const row = {
        symbol: symbol,
        currentPrice: data.latestClose,
        days: []
      };

      sortedDates.forEach(date => {
        const candle = data.candles.find(c => c.date === date);
        if (candle && candle.close_to_close_pct !== null) {
          row.days.push({
            date: date,
            change: candle.close_to_close_pct,
            close: candle.close,
            volume: candle.volume
          });
        } else {
          row.days.push({
            date: date,
            change: null,
            close: null,
            volume: null
          });
        }
      });

      heatmapData.push(row);
    });

    // Sort by average performance
    heatmapData.forEach(row => {
      const validChanges = row.days.filter(d => d.change !== null).map(d => d.change);
      row.avgChange = validChanges.length > 0 ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length : 0;
    });

    heatmapData.sort((a, b) => b.avgChange - a.avgChange);

    // Generate HTML
    const html = this.generateHeatmapHTML(categoryInfo.name, heatmapData, sortedDates);

    // Save to file
    const filename = `${categoryKey.toLowerCase()}_heatmap.html`;
    const filepath = `${this.outputDir}/${filename}`;
    fs.writeFileSync(filepath, html, 'utf8');

    return filename;
  }

  // Generate HTML content for heatmap
  generateHeatmapHTML(categoryName, heatmapData, dates) {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} - Performance Heatmap</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .stats-bar {
            display: flex;
            justify-content: space-around;
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 0.9em;
            color: #6c757d;
            margin-top: 5px;
        }
        
        .controls {
            padding: 20px 30px;
            background: #f8f9fa;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .control-group label {
            font-weight: 600;
            color: #495057;
        }
        
        .control-group select,
        .control-group input {
            padding: 8px 12px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .control-group select:hover,
        .control-group input:hover {
            border-color: #667eea;
        }
        
        .heatmap-container {
            padding: 30px;
            overflow-x: auto;
        }
        
        .heatmap-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 4px;
            min-width: 800px;
        }
        
        .heatmap-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 8px;
            font-weight: 600;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 10;
            font-size: 0.9em;
            border-radius: 8px;
        }
        
        .heatmap-table th.stock-header {
            text-align: left;
            min-width: 120px;
            cursor: pointer;
            user-select: none;
        }
        
        .heatmap-table th.stock-header:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        
        .heatmap-table th.date-header {
            min-width: 80px;
            writing-mode: horizontal-tb;
        }
        
        .heatmap-table td {
            padding: 8px;
            text-align: center;
            font-weight: 600;
            font-size: 0.95em;
            border-radius: 6px;
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
        }
        
        .heatmap-table td.stock-cell {
            text-align: left;
            font-weight: 700;
            font-size: 1em;
            background: #f8f9fa;
            color: #212529;
            cursor: default;
        }
        
        .heatmap-table td:not(.stock-cell):hover {
            transform: scale(1.15);
            z-index: 5;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        /* Color classes for performance */
        .gain-extreme { background: #006400; color: white; }
        .gain-high { background: #228B22; color: white; }
        .gain-medium { background: #90EE90; color: #333; }
        .gain-low { background: #C6EFCE; color: #333; }
        .loss-low { background: #FFC7CE; color: #333; }
        .loss-medium { background: #FF6B6B; color: white; }
        .loss-high { background: #DC143C; color: white; }
        .loss-extreme { background: #8B0000; color: white; }
        .no-data { background: #e9ecef; color: #adb5bd; }
        
        .legend {
            margin: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
            border: 2px solid #dee2e6;
        }
        
        .legend h3 {
            margin-bottom: 15px;
            color: #495057;
        }
        
        .legend-items {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .legend-color {
            width: 40px;
            height: 25px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        
        .legend-label {
            font-size: 0.9em;
            color: #495057;
        }
        
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.9em;
            pointer-events: none;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 250px;
        }
        
        .tooltip.show {
            display: block;
        }
        
        .tooltip-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 1.1em;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            padding-bottom: 6px;
        }
        
        .tooltip-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }
        
        .tooltip-label {
            opacity: 0.8;
            margin-right: 12px;
        }
        
        .tooltip-value {
            font-weight: bold;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 0.9em;
            border-top: 2px solid #e9ecef;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .stats-bar {
                flex-direction: column;
                gap: 15px;
            }
            
            .controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .heatmap-table th.date-header {
                writing-mode: vertical-rl;
                transform: rotate(180deg);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 ${categoryName}</h1>
            <div class="subtitle">Performance Heatmap - Last 15 Trading Days</div>
            <div class="subtitle" style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
                Generated: ${timestamp}
            </div>
        </div>
        
        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-value">${heatmapData.length}</div>
                <div class="stat-label">Total Stocks</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${heatmapData.filter(s => s.avgChange > 0).length}</div>
                <div class="stat-label">Gainers</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${heatmapData.filter(s => s.avgChange < 0).length}</div>
                <div class="stat-label">Losers</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${dates.length}</div>
                <div class="stat-label">Trading Days</div>
            </div>
        </div>
        
        <div class="controls">
            <div class="control-group">
                <label for="sortBy">Sort By:</label>
                <select id="sortBy" onchange="sortTable(this.value)">
                    <option value="performance">Best Performance</option>
                    <option value="performance-desc">Worst Performance</option>
                    <option value="name">Stock Name (A-Z)</option>
                    <option value="name-desc">Stock Name (Z-A)</option>
                </select>
            </div>
            
            <div class="control-group">
                <label for="filterStock">Filter Stock:</label>
                <input type="text" id="filterStock" placeholder="Type to search..." onkeyup="filterTable()">
            </div>
            
            <div class="control-group">
                <label for="minChange">Min Change %:</label>
                <input type="number" id="minChange" placeholder="e.g., 2" step="0.5" onchange="filterByChange()">
            </div>
        </div>
        
        <div class="heatmap-container">
            <table class="heatmap-table" id="heatmapTable">
                <thead>
                    <tr>
                        <th class="stock-header" onclick="sortTable('name')">Stock 📊</th>
                        ${dates.map(date => `<th class="date-header">${dayjs(date).format('DD MMM')}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${heatmapData.map(stock => `
                        <tr data-stock="${stock.symbol}" data-avg-change="${stock.avgChange.toFixed(2)}">
                            <td class="stock-cell">${stock.symbol}</td>
                            ${stock.days.map(day => {
      if (day.change === null) {
        return `<td class="no-data">-</td>`;
      }

      const change = day.change;
      let colorClass = 'no-data';

      if (change > 5) colorClass = 'gain-extreme';
      else if (change > 3) colorClass = 'gain-high';
      else if (change > 1) colorClass = 'gain-medium';
      else if (change > 0) colorClass = 'gain-low';
      else if (change > -1) colorClass = 'loss-low';
      else if (change > -3) colorClass = 'loss-medium';
      else if (change > -5) colorClass = 'loss-high';
      else colorClass = 'loss-extreme';

      return `<td class="${colorClass}" 
                                    data-stock="${stock.symbol}"
                                    data-date="${day.date}"
                                    data-change="${change.toFixed(2)}"
                                    data-close="${day.close ? day.close.toFixed(2) : 'N/A'}"
                                    data-volume="${day.volume ? day.volume.toLocaleString() : 'N/A'}"
                                    onmouseenter="showTooltip(event, this)"
                                    onmouseleave="hideTooltip()">
                                    ${change > 0 ? '+' : ''}${change.toFixed(1)}%
                                </td>`;
    }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="legend">
            <h3>Color Legend</h3>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color gain-extreme"></div>
                    <span class="legend-label">&gt; +5%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color gain-high"></div>
                    <span class="legend-label">+3% to +5%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color gain-medium"></div>
                    <span class="legend-label">+1% to +3%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color gain-low"></div>
                    <span class="legend-label">0% to +1%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color loss-low"></div>
                    <span class="legend-label">0% to -1%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color loss-medium"></div>
                    <span class="legend-label">-1% to -3%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color loss-high"></div>
                    <span class="legend-label">-3% to -5%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color loss-extreme"></div>
                    <span class="legend-label">&lt; -5%</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color no-data"></div>
                    <span class="legend-label">No Data</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            💡 Hover over cells for detailed information | Click on "Stock" header to sort
        </div>
    </div>
    
    <div class="tooltip" id="tooltip">
        <div class="tooltip-title"></div>
        <div class="tooltip-row">
            <span class="tooltip-label">Date:</span>
            <span class="tooltip-value" id="tooltip-date"></span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Change:</span>
            <span class="tooltip-value" id="tooltip-change"></span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Close:</span>
            <span class="tooltip-value" id="tooltip-close"></span>
        </div>
        <div class="tooltip-row">
            <span class="tooltip-label">Volume:</span>
            <span class="tooltip-value" id="tooltip-volume"></span>
        </div>
    </div>
    
    <script>
        let currentSort = 'performance';
        
        function showTooltip(event, cell) {
            const tooltip = document.getElementById('tooltip');
            const stock = cell.dataset.stock;
            const date = cell.dataset.date;
            const change = cell.dataset.change;
            const close = cell.dataset.close;
            const volume = cell.dataset.volume;
            
            tooltip.querySelector('.tooltip-title').textContent = stock;
            tooltip.querySelector('#tooltip-date').textContent = new Date(date).toLocaleDateString();
            tooltip.querySelector('#tooltip-change').textContent = change + '%';
            tooltip.querySelector('#tooltip-close').textContent = '₹' + close;
            tooltip.querySelector('#tooltip-volume').textContent = volume;
            
            const rect = cell.getBoundingClientRect();
            tooltip.style.left = (rect.left + window.scrollX + rect.width / 2) + 'px';
            tooltip.style.top = (rect.top + window.scrollY - 10) + 'px';
            tooltip.style.transform = 'translate(-50%, -100%)';
            
            tooltip.classList.add('show');
        }
        
        function hideTooltip() {
            document.getElementById('tooltip').classList.remove('show');
        }
        
        function sortTable(sortBy) {
            currentSort = sortBy;
            const tbody = document.querySelector('#heatmapTable tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            rows.sort((a, b) => {
                if (sortBy === 'performance') {
                    return parseFloat(b.dataset.avgChange) - parseFloat(a.dataset.avgChange);
                } else if (sortBy === 'performance-desc') {
                    return parseFloat(a.dataset.avgChange) - parseFloat(b.dataset.avgChange);
                } else if (sortBy === 'name') {
                    return a.dataset.stock.localeCompare(b.dataset.stock);
                } else if (sortBy === 'name-desc') {
                    return b.dataset.stock.localeCompare(a.dataset.stock);
                }
            });
            
            rows.forEach(row => tbody.appendChild(row));
        }
        
        function filterTable() {
            const filterValue = document.getElementById('filterStock').value.toUpperCase();
            const rows = document.querySelectorAll('#heatmapTable tbody tr');
            
            rows.forEach(row => {
                const stock = row.dataset.stock;
                if (stock.toUpperCase().includes(filterValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
        
        function filterByChange() {
            const minChange = parseFloat(document.getElementById('minChange').value);
            if (isNaN(minChange)) {
                // Reset filter
                document.querySelectorAll('#heatmapTable tbody tr').forEach(row => {
                    row.style.display = '';
                });
                return;
            }
            
            const rows = document.querySelectorAll('#heatmapTable tbody tr');
            rows.forEach(row => {
                const avgChange = parseFloat(row.dataset.avgChange);
                if (Math.abs(avgChange) >= Math.abs(minChange)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        }
    </script>
</body>
</html>`;
  }

  // Generate index page with links to all heatmaps
  generateIndexPage(heatmapFiles) {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Heatmaps - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 50px;
        }
        
        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header .subtitle {
            font-size: 1.3em;
            opacity: 0.9;
        }
        
        .header .timestamp {
            font-size: 1em;
            opacity: 0.8;
            margin-top: 10px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            display: block;
        }
        
        .card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }
        
        .card-icon {
            font-size: 2.5em;
            margin-bottom: 15px;
        }
        
        .card-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 10px;
        }
        
        .card-stats {
            display: flex;
            justify-content: space-between;
            color: #718096;
            font-size: 0.95em;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #e2e8f0;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 1.4em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 0.85em;
            margin-top: 3px;
        }
        
        .footer {
            text-align: center;
            color: white;
            opacity: 0.9;
            padding: 20px;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }
            
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Stock Performance Heatmaps</h1>
            <div class="subtitle">Interactive Category-wise Analysis</div>
            <div class="timestamp">Generated: ${timestamp}</div>
        </div>
        
        <div class="grid">
            ${heatmapFiles.map(file => `
                <a href="${file.file}" class="card">
                    <div class="card-icon">🔥</div>
                    <div class="card-title">${file.name}</div>
                    <div class="card-stats">
                        <div class="stat">
                            <div class="stat-value">${file.stockCount}</div>
                            <div class="stat-label">Stocks</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">15</div>
                            <div class="stat-label">Days</div>
                        </div>
                    </div>
                </a>
            `).join('')}
        </div>
        
        <div class="footer">
            💡 Click on any category to view its interactive heatmap<br>
            Generated by Stock Tracker Pro
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(`${this.outputDir}/index.html`, html, 'utf8');
  }
}

// ===========================
// EXCEL MANAGER (MODIFIED FOR CATEGORIES)
// ===========================
class ExcelManager {
  constructor(config) {
    this.simpleFile = config.EXCEL_FILE;
    this.detailedFile = config.DETAILED_EXCEL_FILE;
    this.highlightThreshold = config.HIGHLIGHT_THRESHOLD;
    this.analyzer = new StockAnalyzer();
    this.config = config;
    this.categories = config.STOCK_CATEGORIES;
  }

  createSimplePriceSheet(stocksData) {
    const priceMatrix = [];

    const allDates = new Set();
    Object.values(stocksData).forEach(stockData => {
      if (stockData && stockData.candles) {
        stockData.candles.forEach(candle => allDates.add(candle.date));
      }
    });

    const sortedDates = Array.from(allDates).sort((a, b) =>
      new Date(b) - new Date(a)
    );

    Object.keys(stocksData).forEach(symbol => {
      const stockData = stocksData[symbol];
      if (!stockData || !stockData.candles) return;

      const row = { Stock: symbol };

      const priceMap = new Map();
      stockData.candles.forEach(candle => {
        priceMap.set(candle.date, candle.close);
      });

      sortedDates.forEach(date => {
        row[date] = priceMap.get(date) || 'N/A';
      });

      priceMatrix.push(row);
    });

    return priceMatrix;
  }

  // Create category-specific price sheets
  async createCategoryPriceSheets(workbook, stocksData, categoryKey, categoryInfo) {
    const categoryStocks = categoryInfo.stocks.filter(s => stocksData[s] && stocksData[s] !== null);

    if (categoryStocks.length === 0) {
      return;
    }

    const worksheet = workbook.addWorksheet(categoryInfo.name);

    // Get all dates for this category
    const allDates = new Set();
    categoryStocks.forEach(symbol => {
      const stockData = stocksData[symbol];
      if (stockData && stockData.candles) {
        stockData.candles.forEach(candle => allDates.add(candle.date));
      }
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));

    // Create headers with day of week
    const headers = ['Stock', ...sortedDates];
    const displayHeaders = headers.map((header, index) => {
      if (index === 0) return header;
      const date = dayjs(header);
      const dayOfWeek = date.format('ddd');
      return `${dayOfWeek}\n${header}`;
    });

    // Add header row
    const headerRow = worksheet.addRow(displayHeaders);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066CC' }
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    headerRow.height = 30;

    // Set column widths
    worksheet.columns = headers.map(h => ({ width: 12 }));

    // Freeze header row and first column
    worksheet.views = [
      { state: 'frozen', xSplit: 1, ySplit: 1 }
    ];

    // Create date mapping for previous day lookup
    const sortedChronologically = [...sortedDates].sort((a, b) => new Date(a) - new Date(b));
    const previousDateMap = new Map();
    for (let i = 1; i < sortedChronologically.length; i++) {
      previousDateMap.set(sortedChronologically[i], sortedChronologically[i - 1]);
    }

    // Calculate all-time high and low for each stock
    const stockStats = {};
    categoryStocks.forEach(symbol => {
      const stockData = stocksData[symbol];
      if (stockData && stockData.candles) {
        const prices = stockData.candles.map(c => c.close);
        stockStats[symbol] = {
          high: Math.max(...prices),
          low: Math.min(...prices)
        };
      }
    });

    // Add data rows
    let upCount = 0, downCount = 0, athCount = 0, atlCount = 0;

    categoryStocks.forEach(symbol => {
      const stockData = stocksData[symbol];
      if (!stockData || !stockData.candles) return;

      const priceMap = new Map();
      stockData.candles.forEach(candle => {
        priceMap.set(candle.date, candle.close);
      });

      const rowData = [symbol, ...sortedDates.map(date => priceMap.get(date) || 'N/A')];
      const row = worksheet.addRow(rowData);

      // Apply formatting
      for (let colIndex = 1; colIndex < headers.length; colIndex++) {
        const currentDate = headers[colIndex];
        const currentPrice = parseFloat(priceMap.get(currentDate));

        if (isNaN(currentPrice)) continue;

        const cell = row.getCell(colIndex + 1);
        cell.numFmt = '0.00';

        // Check for all-time high/low first
        if (stockStats[symbol]) {
          if (currentPrice === stockStats[symbol].high) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6D5F5' } };
            cell.font = { color: { argb: 'FF6A0DAD' }, bold: true };
            athCount++;
            continue;
          } else if (currentPrice === stockStats[symbol].low) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
            cell.font = { color: { argb: 'FF000000' }, bold: true };
            atlCount++;
            continue;
          }
        }

        // Apply up/down coloring
        const prevDate = previousDateMap.get(currentDate);
        if (prevDate) {
          const prevPrice = parseFloat(priceMap.get(prevDate));
          if (!isNaN(prevPrice)) {
            if (currentPrice > prevPrice) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
              cell.font = { color: { argb: 'FF006100' }, bold: true };
              upCount++;
            } else if (currentPrice < prevPrice) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
              cell.font = { color: { argb: 'FF9C0006' }, bold: true };
              downCount++;
            }
          }
        }
      }
    });
  }

  // Create analysis sheet for a specific category
  async createCategoryAnalysisSheet(workbook, stocksData, categoryKey, categoryInfo) {
    const categoryStocks = categoryInfo.stocks.filter(s => stocksData[s] && stocksData[s] !== null);

    if (categoryStocks.length === 0) return;

    const worksheet = workbook.addWorksheet(`${categoryInfo.name} - Analysis`);

    // Analyze stocks
    const analyses = [];
    categoryStocks.forEach(symbol => {
      const stockData = stocksData[symbol];
      const analysis = this.analyzer.analyzeStock(stockData);
      if (analysis) {
        analyses.push(analysis);
      }
    });

    if (analyses.length === 0) return;

    // Define columns (removed sentiment and NSE data columns)
    worksheet.columns = [
      { header: 'Stock', key: 'symbol', width: 12 },
      { header: 'Price', key: 'currentPrice', width: 10 },
      { header: 'High', key: 'highestPrice', width: 10 },
      { header: 'Low', key: 'lowestPrice', width: 10 },
      { header: 'Return %', key: 'totalReturn', width: 10 },
      { header: 'From High %', key: 'distanceFromHigh', width: 11 },
      { header: 'From Low %', key: 'distanceFromLow', width: 11 },
      { header: 'Volatility', key: 'volatility', width: 10 },
      { header: 'RSI(14)', key: 'rsi14', width: 9 },
      { header: 'MACD Hist', key: 'macdHistogram', width: 10 },
      { header: 'BB Position %', key: 'bbPosition', width: 12 },
      { header: 'ADX(14)', key: 'adx', width: 9 },
      { header: 'Support', key: 'support', width: 9 },
      { header: 'Resistance', key: 'resistance', width: 10 },
      { header: 'Trend', key: 'trend', width: 14 },
      { header: 'Momentum', key: 'momentum', width: 14 },
      { header: 'Signals', key: 'signals', width: 40 },
      { header: 'Analysis', key: 'analysis', width: 50 }
    ];

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 35;

    // Add data rows with formatting
    analyses.forEach((analysis) => {
      const row = worksheet.addRow(analysis);

      // Format cells
      ['currentPrice', 'highestPrice', 'lowestPrice', 'support', 'resistance'].forEach(key => {
        row.getCell(key).numFmt = '0.00';
      });

      // Color code returns
      const returnCell = row.getCell('totalReturn');
      const returnValue = parseFloat(analysis.totalReturn);
      if (returnValue > 0) {
        returnCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        returnCell.font = { color: { argb: 'FF006100' }, bold: true };
      } else if (returnValue < 0) {
        returnCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        returnCell.font = { color: { argb: 'FF9C0006' }, bold: true };
      }

      // Color code RSI
      const rsiCell = row.getCell('rsi14');
      const rsiValue = parseFloat(analysis.rsi14);
      if (rsiValue > 70) {
        rsiCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        rsiCell.font = { bold: true };
      } else if (rsiValue < 30) {
        rsiCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        rsiCell.font = { bold: true };
      }

      // Color code trend
      const trendCell = row.getCell('trend');
      if (analysis.trend.includes('Uptrend')) {
        trendCell.font = { color: { argb: 'FF006100' }, bold: true };
      } else if (analysis.trend.includes('Downtrend')) {
        trendCell.font = { color: { argb: 'FF9C0006' }, bold: true };
      }

      // Wrap text
      row.getCell('signals').alignment = { wrapText: true };
      row.getCell('analysis').alignment = { wrapText: true };
    });

    // Freeze header
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    // Add filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + worksheet.columns.length)}1`
    };
  }

  async saveToExcel(stocksData, failedStocks = []) {
    try {
      // Create main workbook
      const workbook = new ExcelJS.Workbook();

      console.log('\n📝 Creating categorized Excel sheets...');

      const totalCategories = Object.keys(this.categories).length;
      let currentCategory = 0;

      // Create sheets for each category
      for (const [categoryKey, categoryInfo] of Object.entries(this.categories)) {
        currentCategory++;
        const progress = ((currentCategory / totalCategories) * 100).toFixed(0);

        console.log(`   [${progress}%] Processing ${categoryInfo.name}...`);

        // Create price sheet
        await this.createCategoryPriceSheets(workbook, stocksData, categoryKey, categoryInfo);

        // Create analysis sheet
        await this.createCategoryAnalysisSheet(workbook, stocksData, categoryKey, categoryInfo);
      }

      // Create special analysis sheets
      console.log(`\n   📊 Creating advanced analysis sheets...`);

      // 1. Top Movers Sheet
      console.log(`   → Top Movers`);
      await this.createTopMoversSheet(workbook, stocksData);

      // 2. Sector Performance Sheet
      console.log(`   → Sector Performance`);
      await this.createSectorPerformanceSheet(workbook, stocksData);

      // 3. Correlation Matrix Sheet
      console.log(`   → Correlation Matrix`);
      await this.createCorrelationMatrixSheet(workbook, stocksData);

      // 4. Heatmap Sheet
      console.log(`   → Daily Heatmap`);
      await this.createHeatmapSheet(workbook, stocksData);

      // PATTERN DETECTION SHEETS
      console.log(`\n   🔍 Running Pattern Detection...`);
      const patternDetector = new PatternDetector();
      const allPatterns = patternDetector.analyzeAllPatterns(stocksData);

      console.log(`   → Candlestick Patterns (${allPatterns.candlestick.length} found)`);
      await this.createCandlestickPatternsSheet(workbook, allPatterns.candlestick);

      console.log(`   → Chart Patterns (${allPatterns.chartPatterns.length} found)`);
      await this.createChartPatternsSheet(workbook, allPatterns.chartPatterns);

      console.log(`   → Breakout Signals (${allPatterns.breakouts.length} found)`);
      await this.createBreakoutsSheet(workbook, allPatterns.breakouts);

      console.log(`   → Reversal Patterns (${allPatterns.reversals.length} found)`);
      await this.createReversalsSheet(workbook, allPatterns.reversals);

      console.log(`   → Support & Resistance`);
      await this.createSupportResistanceSheet(workbook, allPatterns.supportResistance);

      console.log(`   → Consolidation Patterns (${allPatterns.consolidation.length} found)`);
      await this.createConsolidationSheet(workbook, allPatterns.consolidation);

      console.log(`   → Momentum Patterns (${allPatterns.momentum.length} found)`);
      await this.createMomentumSheet(workbook, allPatterns.momentum);

      console.log(`   → Anomaly Detection (${allPatterns.anomalies.length} found)`);
      await this.createAnomaliesSheet(workbook, allPatterns.anomalies);

      // Create Failed Stocks sheet if there are any failures
      if (failedStocks.length > 0) {
        console.log(`   → Failed Stocks`);
        await this.createFailedStocksSheet(workbook, failedStocks);
      }

      // Save main workbook
      console.log(`\n   💾 Saving workbook...`);
      await workbook.xlsx.writeFile(this.simpleFile);
      console.log(`   ✅ Saved: ${this.simpleFile}`);

      // Create detailed sheet (all stocks combined)
      console.log(`\n   📊 Creating detailed sheet...`);
      const detailedData = this.createDetailedSheet(stocksData);
      await this.saveDetailedWithColors(detailedData);

      // Generate HTML Heatmaps
      const htmlGenerator = new HTMLHeatmapGenerator(this.config);
      await htmlGenerator.generateAllHeatmaps(stocksData, this.categories);

    } catch (error) {
      console.error('⚠️  Error saving Excel:', error.message);
    }
  }

  // 1. TOP MOVERS SHEET
  async createTopMoversSheet(workbook, stocksData) {
    const worksheet = workbook.addWorksheet('🚀 Top Movers');

    // Calculate daily changes for all stocks
    const stockChanges = [];

    Object.entries(stocksData).forEach(([symbol, data]) => {
      if (!data || !data.candles || data.candles.length < 2) return;

      const latestCandle = data.candles[0];
      const previousCandle = data.candles[1];

      if (latestCandle.close_to_close_pct !== null) {
        // Find category
        let category = 'Unknown';
        for (const [key, info] of Object.entries(this.categories)) {
          if (info.stocks.includes(symbol)) {
            category = info.name;
            break;
          }
        }

        stockChanges.push({
          symbol: symbol,
          category: category,
          currentPrice: latestCandle.close,
          previousClose: previousCandle.close,
          change: latestCandle.close_to_close_pct,
          volume: latestCandle.volume,
          date: latestCandle.date
        });
      }
    });

    // Sort by change percentage
    const topGainers = [...stockChanges].sort((a, b) => b.change - a.change).slice(0, 20);
    const topLosers = [...stockChanges].sort((a, b) => a.change - b.change).slice(0, 20);

    // Create header
    worksheet.mergeCells('A1:G1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = '🚀 TOP MOVERS - Daily Gainers & Losers';
    titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;

    // Top Gainers Section
    worksheet.getCell('A3').value = '📈 TOP 20 GAINERS';
    worksheet.getCell('A3').font = { size: 14, bold: true, color: { argb: 'FF006100' } };
    worksheet.mergeCells('A3:G3');

    worksheet.getRow(4).values = ['Rank', 'Stock', 'Category', 'Price', 'Prev Close', 'Change %', 'Volume'];
    const gainersHeader = worksheet.getRow(4);
    gainersHeader.font = { bold: true };
    gainersHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };

    topGainers.forEach((stock, index) => {
      const row = worksheet.addRow([
        index + 1,
        stock.symbol,
        stock.category,
        stock.currentPrice.toFixed(2),
        stock.previousClose.toFixed(2),
        stock.change.toFixed(2),
        stock.volume.toLocaleString()
      ]);

      row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      row.getCell(6).font = { bold: true, color: { argb: 'FF006100' } };

      if (index < 3) {
        row.font = { bold: true };
      }
    });

    // Top Losers Section
    const losersStartRow = worksheet.rowCount + 2;
    worksheet.getCell(`A${losersStartRow}`).value = '📉 TOP 20 LOSERS';
    worksheet.getCell(`A${losersStartRow}`).font = { size: 14, bold: true, color: { argb: 'FF9C0006' } };
    worksheet.mergeCells(`A${losersStartRow}:G${losersStartRow}`);

    const losersHeaderRow = losersStartRow + 1;
    worksheet.getRow(losersHeaderRow).values = ['Rank', 'Stock', 'Category', 'Price', 'Prev Close', 'Change %', 'Volume'];
    const losersHeader = worksheet.getRow(losersHeaderRow);
    losersHeader.font = { bold: true };
    losersHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };

    topLosers.forEach((stock, index) => {
      const row = worksheet.addRow([
        index + 1,
        stock.symbol,
        stock.category,
        stock.currentPrice.toFixed(2),
        stock.previousClose.toFixed(2),
        stock.change.toFixed(2),
        stock.volume.toLocaleString()
      ]);

      row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      row.getCell(6).font = { bold: true, color: { argb: 'FF9C0006' } };

      if (index < 3) {
        row.font = { bold: true };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 8 },  // Rank
      { width: 15 }, // Stock
      { width: 25 }, // Category
      { width: 12 }, // Price
      { width: 12 }, // Prev Close
      { width: 12 }, // Change %
      { width: 15 }  // Volume
    ];
  }

  // 2. SECTOR PERFORMANCE SHEET
  async createSectorPerformanceSheet(workbook, stocksData) {
    const worksheet = workbook.addWorksheet('📊 Sector Performance');

    // Calculate performance for each sector
    const sectorPerformance = [];

    Object.entries(this.categories).forEach(([key, categoryInfo]) => {
      const categoryStocks = categoryInfo.stocks.filter(s => stocksData[s] && stocksData[s] !== null);

      if (categoryStocks.length === 0) return;

      let totalChange = 0;
      let stockCount = 0;
      let gainers = 0;
      let losers = 0;
      let avgVolume = 0;
      let totalMarketCap = 0;

      categoryStocks.forEach(symbol => {
        const data = stocksData[symbol];
        if (data && data.candles && data.candles.length >= 2) {
          const latestChange = data.candles[0].close_to_close_pct;
          if (latestChange !== null) {
            totalChange += latestChange;
            stockCount++;

            if (latestChange > 0) gainers++;
            if (latestChange < 0) losers++;

            avgVolume += data.candles[0].volume;
          }
        }
      });

      if (stockCount > 0) {
        sectorPerformance.push({
          sector: categoryInfo.name,
          avgChange: totalChange / stockCount,
          stockCount: stockCount,
          gainers: gainers,
          losers: losers,
          gainersPercent: (gainers / stockCount) * 100,
          avgVolume: Math.round(avgVolume / stockCount)
        });
      }
    });

    // Sort by average change
    sectorPerformance.sort((a, b) => b.avgChange - a.avgChange);

    // Create header
    worksheet.mergeCells('A1:H1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = '📊 SECTOR PERFORMANCE COMPARISON';
    titleRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;

    // Column headers
    worksheet.getRow(3).values = [
      'Rank',
      'Sector',
      'Avg Change %',
      'Total Stocks',
      'Gainers',
      'Losers',
      'Gainers %',
      'Avg Volume'
    ];

    const headerRow = worksheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF404040' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows
    sectorPerformance.forEach((sector, index) => {
      const row = worksheet.addRow([
        index + 1,
        sector.sector,
        sector.avgChange.toFixed(2),
        sector.stockCount,
        sector.gainers,
        sector.losers,
        sector.gainersPercent.toFixed(1),
        sector.avgVolume.toLocaleString()
      ]);

      // Color code average change
      const changeCell = row.getCell(3);
      if (sector.avgChange > 0) {
        changeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        changeCell.font = { bold: true, color: { argb: 'FF006100' } };
      } else if (sector.avgChange < 0) {
        changeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        changeCell.font = { bold: true, color: { argb: 'FF9C0006' } };
      }

      // Highlight top 3 sectors
      if (index < 3) {
        row.font = { bold: true };
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 8 },  // Rank
      { width: 30 }, // Sector
      { width: 14 }, // Avg Change
      { width: 13 }, // Total Stocks
      { width: 10 }, // Gainers
      { width: 10 }, // Losers
      { width: 12 }, // Gainers %
      { width: 15 }  // Avg Volume
    ];

    // Add freeze panes
    worksheet.views = [{ state: 'frozen', ySplit: 3 }];
  }

  // 3. CORRELATION MATRIX SHEET
  async createCorrelationMatrixSheet(workbook, stocksData) {
    const worksheet = workbook.addWorksheet('🔗 Correlation Matrix');

    // Get stocks with sufficient data (at least 10 days)
    const validStocks = [];
    const priceData = {};

    Object.entries(stocksData).forEach(([symbol, data]) => {
      if (data && data.candles && data.candles.length >= 10) {
        validStocks.push(symbol);
        priceData[symbol] = data.candles.slice(0, 10).map(c => c.close_to_close_pct).filter(v => v !== null);
      }
    });

    // Limit to top 50 stocks by volume for readability
    const topStocks = validStocks.slice(0, 50);

    // Calculate correlation matrix
    const correlations = {};

    topStocks.forEach(stock1 => {
      correlations[stock1] = {};

      topStocks.forEach(stock2 => {
        if (stock1 === stock2) {
          correlations[stock1][stock2] = 1.0;
        } else {
          const corr = this.calculateCorrelation(priceData[stock1], priceData[stock2]);
          correlations[stock1][stock2] = corr;
        }
      });
    });

    // Create header
    worksheet.mergeCells('A1:A2');
    worksheet.getCell('A1').value = '🔗 CORRELATION MATRIX';
    worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Add stock symbols as headers
    const headerRow = worksheet.getRow(3);
    headerRow.getCell(1).value = 'Stock';
    headerRow.getCell(1).font = { bold: true };

    topStocks.forEach((stock, index) => {
      const cell = headerRow.getCell(index + 2);
      cell.value = stock;
      cell.font = { bold: true, size: 9 };
      cell.alignment = { textRotation: 90, horizontal: 'center', vertical: 'bottom' };
    });

    headerRow.height = 80;

    // Add correlation data
    topStocks.forEach((stock1, rowIndex) => {
      const row = worksheet.getRow(rowIndex + 4);
      row.getCell(1).value = stock1;
      row.getCell(1).font = { bold: true, size: 9 };

      topStocks.forEach((stock2, colIndex) => {
        const corr = correlations[stock1][stock2];
        const cell = row.getCell(colIndex + 2);
        cell.value = corr.toFixed(2);
        cell.numFmt = '0.00';

        // Color coding: Green = positive correlation, Red = negative
        const intensity = Math.abs(corr);

        if (corr > 0.7) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006100' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        } else if (corr > 0.4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
        } else if (corr < -0.4) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
        } else if (corr < -0.7) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C0006' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        }

        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 15;
    for (let i = 2; i <= topStocks.length + 1; i++) {
      worksheet.getColumn(i).width = 6;
    }

    // Add legend
    const legendRow = worksheet.rowCount + 2;
    worksheet.getCell(`A${legendRow}`).value = 'Legend:';
    worksheet.getCell(`A${legendRow}`).font = { bold: true };

    worksheet.getCell(`B${legendRow}`).value = '>0.7 = Strong Positive';
    worksheet.getCell(`B${legendRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006100' } };
    worksheet.getCell(`B${legendRow}`).font = { color: { argb: 'FFFFFFFF' } };

    worksheet.getCell(`C${legendRow}`).value = '0.4-0.7 = Moderate';
    worksheet.getCell(`C${legendRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };

    worksheet.getCell(`D${legendRow}`).value = '<-0.4 = Negative';
    worksheet.getCell(`D${legendRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };

    // Freeze panes
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }];
  }

  // 4. DAILY HEATMAP SHEET
  async createHeatmapSheet(workbook, stocksData) {
    const worksheet = workbook.addWorksheet('🔥 Daily Heatmap');

    // Get all dates
    const allDates = new Set();
    Object.values(stocksData).forEach(data => {
      if (data && data.candles) {
        data.candles.forEach(candle => allDates.add(candle.date));
      }
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a)).slice(0, 10); // Last 10 days

    // Create header
    worksheet.mergeCells('A1:A2');
    worksheet.getCell('A1').value = '🔥 DAILY PERFORMANCE HEATMAP';
    worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Date headers
    const headerRow = worksheet.getRow(3);
    headerRow.getCell(1).value = 'Stock';
    headerRow.getCell(1).font = { bold: true };

    sortedDates.forEach((date, index) => {
      const cell = headerRow.getCell(index + 2);
      cell.value = dayjs(date).format('DD-MMM');
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', textRotation: 45 };
    });

    headerRow.height = 40;

    // Add stock data with categories
    let currentRow = 4;

    Object.entries(this.categories).forEach(([key, categoryInfo]) => {
      const categoryStocks = categoryInfo.stocks.filter(s => stocksData[s] && stocksData[s] !== null);

      if (categoryStocks.length === 0) return;

      // Category header
      const categoryRow = worksheet.getRow(currentRow);
      categoryRow.getCell(1).value = categoryInfo.name;
      categoryRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
      categoryRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF404040' } };
      worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(65 + sortedDates.length)}${currentRow}`);
      currentRow++;

      // Stock rows
      categoryStocks.slice(0, 10).forEach(symbol => { // Limit to 10 stocks per category for readability
        const data = stocksData[symbol];
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = symbol;
        row.getCell(1).font = { bold: true, size: 9 };

        sortedDates.forEach((date, index) => {
          const candle = data.candles.find(c => c.date === date);
          const cell = row.getCell(index + 2);

          if (candle && candle.close_to_close_pct !== null) {
            const change = candle.close_to_close_pct;
            cell.value = change.toFixed(2);
            cell.numFmt = '0.00';

            // Color gradient based on change
            if (change > 5) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006100' } };
              cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            } else if (change > 2) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } };
            } else if (change > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
            } else if (change < -5) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C0006' } };
              cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            } else if (change < -2) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } };
            } else if (change < 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
            }

            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.value = '-';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });

        currentRow++;
      });
    });

    // Set column widths
    worksheet.getColumn(1).width = 15;
    for (let i = 2; i <= sortedDates.length + 1; i++) {
      worksheet.getColumn(i).width = 10;
    }

    // Add legend
    const legendRow = currentRow + 2;
    worksheet.getCell(`A${legendRow}`).value = 'Color Scale:';
    worksheet.getCell(`A${legendRow}`).font = { bold: true };

    const legendItems = [
      { label: '>5%', color: 'FF006100', textColor: 'FFFFFFFF' },
      { label: '2-5%', color: 'FF90EE90', textColor: 'FF000000' },
      { label: '0-2%', color: 'FFC6EFCE', textColor: 'FF000000' },
      { label: '0 to -2%', color: 'FFFFC7CE', textColor: 'FF000000' },
      { label: '-2 to -5%', color: 'FFFF6B6B', textColor: 'FF000000' },
      { label: '<-5%', color: 'FF9C0006', textColor: 'FFFFFFFF' }
    ];

    legendItems.forEach((item, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(66 + index)}${legendRow}`);
      cell.value = item.label;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.color } };
      cell.font = { color: { argb: item.textColor }, bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    // Freeze panes
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }];
  }

  // Helper: Calculate correlation between two arrays
  calculateCorrelation(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;

    const minLength = Math.min(arr1.length, arr2.length);
    const x = arr1.slice(0, minLength);
    const y = arr2.slice(0, minLength);

    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  // Create Failed Stocks sheet
  async createFailedStocksSheet(workbook, failedStocks) {
    const worksheet = workbook.addWorksheet('⚠️ Failed Stocks');

    // Define columns
    worksheet.columns = [
      { header: 'Stock Symbol', key: 'symbol', width: 15 },
      { header: 'Error Message', key: 'error', width: 50 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Category', key: 'category', width: 25 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF0000' } // Red background for failed stocks
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 25;

    // Find which category each failed stock belongs to
    const stockCategoryMap = {};
    Object.entries(this.categories).forEach(([categoryKey, categoryInfo]) => {
      categoryInfo.stocks.forEach(stock => {
        stockCategoryMap[stock] = categoryInfo.name;
      });
    });

    // Add data rows
    failedStocks.forEach(failedStock => {
      const category = stockCategoryMap[failedStock.symbol] || 'Unknown';

      const row = worksheet.addRow({
        symbol: failedStock.symbol,
        error: failedStock.error,
        timestamp: failedStock.timestamp,
        category: category
      });

      // Style rows with light red background
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' }
      };

      // Wrap error message text
      row.getCell('error').alignment = { wrapText: true, vertical: 'top' };
      row.height = 30;
    });

    // Add summary at the top
    worksheet.insertRow(1, ['']);
    const summaryRow = worksheet.insertRow(1, [
      `Total Failed: ${failedStocks.length} stocks`,
      'These stocks could not be fetched from the API',
      '',
      ''
    ]);

    summaryRow.font = { bold: true, size: 12 };
    summaryRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEB9C' } // Light orange
    };
    summaryRow.height = 25;

    // Merge summary cells
    worksheet.mergeCells('A1:D1');
    summaryRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Freeze header rows
    worksheet.views = [{ state: 'frozen', ySplit: 3 }];

    // Add auto filter
    worksheet.autoFilter = {
      from: 'A3',
      to: 'D3'
    };
  }

  createDetailedSheet(stocksData) {
    const detailedData = [];

    Object.entries(stocksData).forEach(([symbol, stockData]) => {
      if (!stockData || !stockData.candles) return;

      stockData.candles.forEach(candle => {
        detailedData.push({
          Stock: symbol,
          Date: candle.date,
          Open: candle.open,
          High: candle.high,
          Low: candle.low,
          Close: candle.close,
          Volume: candle.volume,
          'Close-to-Close %': candle.close_to_close_pct,
          'Open-to-Close %': candle.open_to_close_pct,
          'Cumulative %': candle.cumulative_close_pct
        });
      });
    });

    detailedData.sort((a, b) => {
      if (a.Stock !== b.Stock) return a.Stock.localeCompare(b.Stock);
      return new Date(b.Date) - new Date(a.Date);
    });

    return detailedData;
  }

  async saveDetailedWithColors(detailedData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detailed Data');

    // Calculate stats
    const stockStats = {};
    const stockPrices = {};

    detailedData.forEach(row => {
      const stock = row.Stock;
      const close = parseFloat(row.Close);
      if (!stockPrices[stock]) {
        stockPrices[stock] = [];
      }
      stockPrices[stock].push(close);
    });

    Object.keys(stockPrices).forEach(stock => {
      stockStats[stock] = {
        high: Math.max(...stockPrices[stock]),
        low: Math.min(...stockPrices[stock])
      };
    });

    // Define columns
    worksheet.columns = [
      { header: 'Stock', key: 'Stock', width: 12 },
      { header: 'Date', key: 'Date', width: 12 },
      { header: 'Open', key: 'Open', width: 10 },
      { header: 'High', key: 'High', width: 10 },
      { header: 'Low', key: 'Low', width: 10 },
      { header: 'Close', key: 'Close', width: 10 },
      { header: 'Volume', key: 'Volume', width: 12 },
      { header: 'Close-to-Close %', key: 'Close-to-Close %', width: 16 },
      { header: 'Open-to-Close %', key: 'Open-to-Close %', width: 16 },
      { header: 'Cumulative %', key: 'Cumulative %', width: 14 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Freeze header
    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    let highlightedCount = 0;
    let athCount = 0, atlCount = 0;

    // Add data rows
    detailedData.forEach((rowData) => {
      const row = worksheet.addRow(rowData);
      const stock = rowData.Stock;
      const closePrice = parseFloat(rowData.Close);

      // Format numbers
      row.getCell(3).numFmt = '0.00';
      row.getCell(4).numFmt = '0.00';
      row.getCell(5).numFmt = '0.00';
      row.getCell(6).numFmt = '0.00';
      row.getCell(7).numFmt = '#,##0';
      row.getCell(8).numFmt = '0.00';
      row.getCell(9).numFmt = '0.00';
      row.getCell(10).numFmt = '0.00';

      // Highlight ATH/ATL in Close column
      const closeCell = row.getCell(6);

      if (stockStats[stock]) {
        if (closePrice === stockStats[stock].high) {
          closeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6D5F5' } };
          closeCell.font = { color: { argb: 'FF6A0DAD' }, bold: true };
          athCount++;
        } else if (closePrice === stockStats[stock].low) {
          closeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
          closeCell.font = { color: { argb: 'FF000000' }, bold: true };
          atlCount++;
        }
      }

      // Highlight threshold changes
      const pctCell = row.getCell(8);
      const pctValue = parseFloat(rowData['Close-to-Close %']);

      if (!isNaN(pctValue) && rowData['Close-to-Close %'] !== null) {
        if (pctValue >= this.highlightThreshold) {
          pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
          pctCell.font = { color: { argb: 'FF006100' }, bold: true };
          highlightedCount++;
        } else if (pctValue <= -this.highlightThreshold) {
          pctCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
          pctCell.font = { color: { argb: 'FF9C0006' }, bold: true };
          highlightedCount++;
        }
      }
    });

    await workbook.xlsx.writeFile(this.detailedFile);
    console.log(`   ✅ Saved: ${this.detailedFile}`);
    console.log(`   🎨 Highlights: ±${this.highlightThreshold}%: ${highlightedCount} | 💜 ATH: ${athCount} | ⬛ ATL: ${atlCount}`);
  }
}

// ===========================
// MAIN APPLICATION
// ===========================
class StockTracker {
  constructor(config) {
    this.config = config;
    this.apiClient = new GrowwAPIClient(config);
    this.excelManager = new ExcelManager(config);
  }

  async updateStockData() {
    console.log('\n' + '='.repeat(65));
    console.log('🚀 Stock Data Update Started (Categorized)');
    console.log('📅 Timestamp:', dayjs().format('YYYY-MM-DD HH:mm:ss'));
    console.log('📊 Exchange:', this.config.EXCHANGE, '| Segment:', this.config.SEGMENT);
    console.log('='.repeat(65) + '\n');

    const startDate = this.config.START_DATE;
    const endDate = dayjs().format('YYYY-MM-DD');

    console.log(`📈 Date Range: ${startDate} to ${endDate}`);

    // Get all stocks from categories
    const allStocks = getAllStocks(this.config.STOCK_CATEGORIES);
    console.log(`📊 Total stocks: ${allStocks.length} across ${Object.keys(this.config.STOCK_CATEGORIES).length} categories\n`);

    // Display categories summary
    console.log('📂 Category Breakdown:');
    Object.entries(this.config.STOCK_CATEGORIES).forEach(([key, info]) => {
      console.log(`   • ${info.name}: ${info.stocks.length} stocks`);
    });

    const { results: stocksData, failedStocks } = await this.apiClient.getMultipleStocks(
      allStocks,
      startDate,
      endDate
    );

    // Show failed stocks details if any
    if (failedStocks.length > 0) {
      console.log('\n⚠️  Failed Stocks Summary:');
      console.log('─'.repeat(65));
      failedStocks.forEach(failed => {
        console.log(`   ❌ ${failed.symbol.padEnd(15)} → ${failed.error}`);
      });
      console.log('─'.repeat(65));
    }

    console.log('\n💾 Saving data to Excel files...');
    await this.excelManager.saveToExcel(stocksData, failedStocks);

    console.log('\n' + '='.repeat(65));
    console.log('✨ Update Completed Successfully!');
    console.log(`📁 Excel: ${this.config.EXCEL_FILE}`);
    console.log(`📁 Detailed: ${this.config.DETAILED_EXCEL_FILE}`);
    console.log(`🌐 HTML Heatmaps: ${this.config.HTML_OUTPUT_DIR}/index.html`);
    console.log('\n📊 Pattern Detection Summary:');
    console.log(`   🕯️  Candlestick Patterns`);
    console.log(`   📈 Chart Patterns`);
    console.log(`   🚀 Breakout Alerts`);
    console.log(`   🔄 Reversal Signals`);
    console.log(`   🎯 Support & Resistance`);
    console.log(`   📦 Consolidation Watch`);
    console.log(`   ⚡ Momentum Streaks`);
    console.log(`   ⚠️  Anomaly Alerts`);
    if (failedStocks.length > 0) {
      console.log(`\n⚠️  ${failedStocks.length} stock(s) failed - see "⚠️ Failed Stocks" sheet`);
    }
    console.log('='.repeat(65) + '\n');
  }

  start() {
    console.log('╔' + '═'.repeat(63) + '╗');
    console.log('║' + ' '.repeat(12) + '🎯 CATEGORIZED STOCK TRACKER' + ' '.repeat(19) + '║');
    console.log('╚' + '═'.repeat(63) + '╝\n');

    const totalStocks = getAllStocks(this.config.STOCK_CATEGORIES).length;
    const categoryCount = Object.keys(this.config.STOCK_CATEGORIES).length;

    console.log('📊 Tracking:', totalStocks, 'stocks across', categoryCount, 'categories');
    console.log('🏢 Exchange:', this.config.EXCHANGE, '| Segment:', this.config.SEGMENT);
    console.log('📁 Output Files:');
    console.log('   -', this.config.EXCEL_FILE, '(Categorized + Pattern Analysis)');
    console.log('   -', this.config.DETAILED_EXCEL_FILE, '(All stocks detailed)');
    console.log('   -', this.config.HTML_OUTPUT_DIR + '/index.html', '(Interactive heatmaps)');
    console.log('🔍 Pattern Detection:');
    console.log('   - Candlestick Patterns (Doji, Hammer, Engulfing, etc.)');
    console.log('   - Chart Patterns (H&S, Double Top/Bottom, Triangles)');
    console.log('   - Breakouts (52W High/Low, Volume, Range)');
    console.log('   - Reversals (Divergence, Parabolic, Capitulation)');
    console.log('   - Support & Resistance Detection');
    console.log('   - Consolidation & Squeeze Patterns');
    console.log('   - Momentum Streaks & Trends');
    console.log('   - Statistical Anomalies');
    console.log('');

    this.updateStockData();
  }
}

// ===========================
// RUN APPLICATION
// ===========================
const tracker = new StockTracker(CONFIG);
tracker.start();