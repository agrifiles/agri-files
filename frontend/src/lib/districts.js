'use client';

import { useState, useEffect } from 'react';
//import { districtsEn, districtsMr } from './districts';

export default function DistrictTalukaForm({ lang = 'en' }) {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [talukas, setTalukas] = useState([]);
  const [selectedTaluka, setSelectedTaluka] = useState('');

  useEffect(() => {
    // Load districts based on language
    if (lang === 'mr') {
      setDistricts(districtsMr);
    } else {
      setDistricts(districtsEn);
    }
  }, [lang]);

  // Update talukas when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const districtObj = districts.find(d => d.name === selectedDistrict);
      setTalukas(districtObj ? districtObj.tahasil : []);
      setSelectedTaluka(''); // reset taluka when district changes
    }
  }, [selectedDistrict, districts]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* District */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">{lang === 'mr' ? 'जिल्हा' : 'District'}</label>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="input"
          required
        >
          <option value="">{lang === 'mr' ? 'जिल्हा निवडा' : 'Select District'}</option>
          {districts.map(d => (
            <option key={d.name} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Taluka */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1">{lang === 'mr' ? 'तालुका' : 'Taluka'}</label>
        <select
          value={selectedTaluka}
          onChange={(e) => setSelectedTaluka(e.target.value)}
          className="input"
          required
        >
          <option value="">{lang === 'mr' ? 'तालुका निवडा' : 'Select Taluka'}</option>
          {talukas.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}


// districts.js
export const districtsEn = [

{
  "name":"Ahmednagar",
  "tahasil" : [ "Akola", "Jamkhed", "Karjat", "Kopargaon", "Nagar", "Nevasa", "Parner", "Pathardi", "Rahta", "Rahuri", "Sangamner", "Shevgaon", "Shrigonda", "Shrirampur" ]
},

{
  "name":"Akola",
  "tahasil":[ "Akola", "Akot", "Balapur", "Barshitakli", "Murtijapur", "Patur", "Telhara" ]
},
{
"name":"Amravati",
"tahasil":[ "Achalpur", "Amravati", "Anjangaon Surji", "Bhatkuli", "Chandur Railway", "Chandurbazar", "Chikhaldara", "Daryapur", "Dhamangaon Railway", "Dharni", "Morshi", "Nandgaon-Khandeshwar", "Teosa", "Warud" ]
},

{
  "name":"Chhatrapati Sambhajinagar",
"tahasil":[ "Chhatrapati SambhajiNagar", "Gangapur", "Kannad", "Khuldabad", "Paithan", "Phulambri", "Sillod", "Soegaon", "Vaijapur" ]
},

{
  "name":"Beed",
"tahasil":[ "Ambejogai", "Ashti", "Bid", "Dharur", "Georai", "Kaij", "Manjlegaon", "Parli", "Patoda", "Shirur (Kasar)", "Wadwani" ]
},

{
  "name":"Bhandara",
"tahasil":[ "Bhandara", "Mohadi", "Pauni", "Tumsar" ]
},

{
  "name":"Buldhana",
"tahasil":[ "Buldana", "Chikhli", "Deolgaon Raja", "Jalgaon (Jamod)", "Khamgaon", "Lonar", "Malkapur", "Mehkar", "Motala", "Nandura", "Sangrampur", "Shegaon", "Sindkhed Raja" ]
},

{
  "name":"Chandrapur",
"tahasil":[ "Ballarpur", "Bhadravati", "Brahmapuri", "Chandrapur", "Chimur", "Gondpipri", "Jiwati", "Korpana", "Mul", "Nagbhir", "Pombhurna", "Rajura", "Sawali", "Sindewahi", "Warora" ]
},

{
  "name":"Dhule",
"tahasil":[ "Dhule", "Sakri", "Shirpur", "Sindkhede" ]
},

{
  "name":"Gadchiroli",
"tahasil":[ "Aheri", "Armori", "Bhamragad", "Chamorshi", "Desaiganj (Vadasa)", "Dhanora", "Etapalli", "Gadchiroli", "Korchi", "Kurkheda", "Mulchera", "Sironcha" ]
},

{
  "name":"Gondia",
"tahasil":[ "Amgaon", "Arjuni Morgaon", "Deori", "Gondiya", "Goregaon", "Sadak-Arjuni", "Salekasa", "Tirora" ]
},

{
  "name":"Hingoli",
"tahasil":[ "Aundha (Nagnath)", "Basmath", "Hingoli", "Kalamnuri", "Sengaon" ]
},

{
  "name":"Jalgaon",
"tahasil":[ "Amalner", "Bhadgaon", "Bhusawal", "Bodvad", "Chalisgaon", "Chopda", "Dharangaon", "Erandol", "Jalgaon", "Jamner", "Muktainagar", "Pachora", "Parola", "Raver", "Yawal" ]
},

{
  "name":"Jalna",
"tahasil":[ "Ambad", "Badnapur", "Bhokardan", "Ghansawangi", "Jafferabad", "Jalna", "Mantha", "Partur" ]
},

{
  "name":"Kolhapur",
"tahasil":[ "Ajra", "Bavda", "Bhudargad", "Chandgad", "Gadhinglaj", "Hatkanangle", "Kagal", "Karvir", "Panhala", "Radhanagari", "Shahuwadi", "Shirol" ]
},

{
  "name":"Latur",
  "tahasil":[ "Ahmadpur", "Ausa", "Chakur", "Deoni", "Jalkot", "Latur", "Nilanga", "Renapur", "Shirur-Anantpal", "Udgir" ]
},

{
  "name":"Mumbai Suburban",
  "tahasil":[ "Andheri", "Borivali", "Kurla" ]
},

{
  "name":"Nagpur",
"tahasil":[ "Bhiwapur", "Hingna", "Kalameshwar", "Kamptee", "Katol", "Kuhi", "Mauda", "Nagpur (Rural)", "Nagpur (Urban)", "Narkhed", "Parseoni", "Ramtek", "Savner", "Umred" ]
},

{
  "name":"Nanded",
"tahasil":[ "Ardhapur", "Bhokar", "Biloli", "Deglur", "Dharmabad", "Hadgaon", "Himayatnagar", "Kandhar", "Kinwat", "Loha", "Mahoor", "Mudkhed", "Mukhed", "Naigaon (Khairgaon)", "Nanded", "Umri" ]
},

{
  "name":"Nandurbar",
  "tahasil":[ "Akkalkuwa", "Akrani", "Nandurbar", "Nawapur", "Shahade", "Talode" ]

},

{"name":"Nashik",
  "tahasil":[ "Baglan", "Chandvad", "Deola", "Dindori", "Igatpuri", "Kalwan", "Malegaon", "Nandgaon", "Nashik", "Niphad", "Peint", "Sinnar", "Surgana", "Trimbakeshwar", "Yevla" ]

},

{"name":"Osmanabad",
"tahasil":[ "Bhum", "Kalamb", "Lohara", "Osmanabad", "Paranda", "Tuljapur", "Umarga", "Washi" ]},

{"name":"Parbhani",
"tahasil":[ "Gangakhed", "Jintur", "Manwath", "Palam", "Parbhani", "Pathri", "Purna", "Sailu", "Sonpeth" ]
},

{"name":"Pune",
"tahasil":[ "Ambegaon", "Baramati", "Bhor", "Daund", "Haveli", "Indapur", "Junnar", "Khed", "Mawal", "Mulshi", "Pune City", "Purandhar", "Shirur", "Velhe" ]
},

{"name":"Raigad",
"tahasil":[ "Alibag", "Karjat", "Khalapur", "Mahad", "Mangaon", "Mhasla", "Murud", "Panvel", "Pen", "Poladpur", "Roha", "Shrivardhan", "Sudhagad", "Tala", "Uran" ]
},

{"name":"Ratnagiri",
"tahasil":[ "Chiplun", "Dapoli", "Guhagar", "Khed", "Lanja", "Mandangad", "Rajapur", "Ratnagiri", "Sangameshwar" ]
},

{"name":"Sangli",
"tahasil":[ "Atpadi", "Jat", "Kadegaon", "Kavathemahankal", "Khanapur", "Miraj", "Palus", "Shirala", "Tasgaon", "Walwa" ]
},

{"name":"Satara",
"tahasil":[ "Jaoli", "Karad", "Khandala", "Khatav", "Koregaon", "Mahabaleshwar", "Man", "Patan", "Phaltan", "Satara", "Wai" ]
},

{"name":"Sindhudurg",
"tahasil":[ "Devgad", "Dodamarg", "Kankavli", "Kudal", "Malwan", "Sawantwadi", "Vaibhavvadi", "Vengurla" ]
},

{"name":"Solapur",
"tahasil":[ "Akkalkot", "Barshi", "Karmala", "Madha", "Malshiras", "Mangalvedhe", "Mohol", "Pandharpur", "Sangole", "Solapur North", "Solapur South" ]
},

{"name":"Thane",
"tahasil":[ "Ambarnath", "Bhiwandi", "Dahanu", "Jawhar", "Kalyan", "Mokhada", "Murbad", "Palghar", "Shahapur", "Talasari", "Thane", "Ulhasnagar", "Vada", "Vasai", "Vikramgad" ]
},

{"name":"Wardha",
"tahasil":[ "Arvi", "Ashti", "Deoli", "Hinganghat", "Karanja", "Samudrapur", "Seloo", "Wardha" ]
},

{"name":"Washim",
"tahasil":[ "Karanja", "Malegaon", "Mangrulpir", "Manora", "Risod", "Washim" ]
},

{"name":"Yavatmal",
"tahasil":["Arni",
"Babulgaon",
"Darwha",
"Digras",
"Ghatanji",
"Kalamb",
"Kelapur",
"Mahagaon",
"Maregaon",
"Ner",
"Pusad",
"Ralegaon",
"Umarkhed",
"Wani",
"Yavatmal",
"Zari-Jamani"]
}
 ]

export const districtsMr = [

{
  "name":"अहमदनगर",
  "tahasil" : [ "अकोले", "जामखेड", "कर्जत", "कोपरगाव", "नगर", "नेवासा", "पारनेर", "पाथर्डी", "राहाता", "राहुरी", "संगमनेर", "शेवगांव", "श्रीगोंदा", "श्रीरामपूर" ]
},

{
  "name":"अकोला",
  "tahasil":[ "अकोला", "अकोट", "बाळापुर ", "बार्शीटाकळी", "मुर्तीजापुर", "पातूर", "तेल्हारा" ]
},
{
"name":"अमरावती",
"tahasil":[ "अचलपूर", "अमरावती", "अंजनगाव सुर्जी", "भातकुली", "चांदुर रेल्वे", "चांदुर बाजार", "चिखलदरा", "दर्यापूर", "धामणगांव रेल्वे", "धारणी", "मोर्शी", "नांदगाव खंडेश्वर", "तिवसा", "वरुड" ]
},

{
  "name":"छत्रपती संभाजीनगर",
"tahasil":[ "छत्रपती संभाजीनगर", "गंगापुर", "कन्नड़", "खुलताबाद", "पैठण", "फुलंब्री", "सिल्लोड", "सोयगांव", "वैजापूर" ]
},

{
  "name":"बीड",
"tahasil":[ "अंबेजोगाई ", "आष्टी", "बीड", "धारूर", "गेवराई", "कैज", "मंजुळेगाव", "परळी", "पाटोदा", "शिरूर (कासार)", "वडवणी" ]
},

{
  "name":"भंडारा",
"tahasil":[ "भंडारा", "मोहाडी", "पौनी", "तुमसर" ]
},

{
  "name":"बुलढाणा",
"tahasil":[ "बुलढाणा", "चिखली", "देऊळगाव राजा", "जळगाव (जामोद)", "खामगाव", "लोणार", "मलकापूर ", "मेहकर", "मोताळा", "नांदुरा", "संग्रामपूर", "शेगाव", "सिंदखेड राजा" ]
},

{
  "name":"चंद्रपूर",
"tahasil":[ "बल्लारपूर", "भद्रावती", "ब्रह्मपुरी", "चंद्रपूर", "चिमूर", "गोंडपिपरी", "जिवती", "कोरपना", "मूळ", "नागभीर", "पोंभुर्णा", "राजुरा", "सावली", "सिंदेवाही", "वरोरा" ]
},

{
  "name":"धुळे",
"tahasil":[ "धुळे", "साक्री", "शिरपूर", "सिंदखेड" ]
},

{
  "name":"गडचिरोली",
"tahasil":[ "अहेरी", "आरमोरी", "भामरागड", "चामोर्शी", "देसाईगंज (वादास)", "धानोरा", "एटापल्ली", "गडचिरोली", "कोरची", "कुरखेडा", "मुलचेरा", "सिरोंचा" ]
},

{
  "name":"गोंदिया",
"tahasil":[ "आमगाव", "अर्जुनी मोरगाव", "देओरी", "गोंदिया", "गोरेगाव", "सडक-अर्जुनी", "सालेकसा", "तिरोरा" ]
},

{
  "name":"हिंगोली",
"tahasil":[ "औंढा (नागनाथ)", "बसमथ", "हिंगोली", "कळमनुरी", "सेनगाव" ]
},

{
  "name":"जळगाव",
"tahasil":[ "अमळनेर", "भडगाव", "भुसावळ", "बोदवड", "चाळीसगाव", "चोपडा", "धरणगाव", "एरंडोल", "जळगाव", "जामनेर", "मुक्ताईनगर", "पाचोरा", "पारोळा", "रावेर", "यावल" ]
},

{
  "name":"जालना",
"tahasil":[ "अंबड", "बदनापूर", "भोकरदन", "घनसावंगी", "जाफाफेरबड", "जालना", "मंठा", "परतूर" ]
},

{
  "name":"कोल्हापूर",
"tahasil":[ "आजरा", "गगनबावडा", "भुदरगड", "चंदगड", "गडहिंग्लज", "हातकणंगले", "कागल", "करवीर", "पन्हाळा", "राधानगरी", "शाहूवाडी", "शिरोळ" ]
},

{
  "name":"लातूर",
  "tahasil":[ "अहमदपूर", "औसा", "चाकूर", "देवोनि", "जळकोट", "लातूर", "निलंगा", "रेणापूर", "शिरूर-अनंतपाळ", "उदगीर" ]
},

{
  "name":"मुंबई उपनगर",
  "tahasil":[ "अंधेरी", "बोरिवली", "कुर्ला" ]
},

{
  "name":"नागपूर",
"tahasil":[ "भिवापूर", "हिंगणा", "कळमेश्वर", "कामठी", "काटोल", "कुही", "मौदा", "नागपूर (ग्रामीण)", "नागपूर (शहरी)", "नरखेड", "परसेवोनि", "रामटेक", "सावनेर", "उमरेड" ]
},

{
  "name":"नांदेड",
"tahasil":[ "अर्धापूर", "भोकर", "बिलोली", "देगलूर", "धर्माबाद", "हदगाव", "हिमायतनगर", "कंधार", "किनवट", "लोह", "माहूर", "मुदखेड", "मुखेड", "नायगाव (खैरगाव)", "नांदेड", "उमरी" ]
},

{
  "name":"नंदुरबार",
  "tahasil":[ "अक्कलकुवा", "अक्राणी", "नंदुरबार", "नवापूर", "शहाडे", "तळोदे" ]

},

{"name":"नाशिक",
  "tahasil":[ "बागलाण", "चांदवड", "देवळा", "दिंडोरी", "इगतपुरी", "कळवण", "मालेगाव", "नांदगाव", "नाशिक", "निफाड", "पेइंग", "सिन्नर", "सुरगाणा", "त्र्यंबकेश्वर", "येवला" ]

},

{"name":"उस्मानाबाद",
"tahasil":[ "भुम", "कळंब", "लोहारा", "उस्मानाबाद", "परांडा", "तुळजापूर", "उमरगा", "वाशी" ]},

{"name":"परभणी",
"tahasil":[ "गंगाखेड", "जिंतूर", "मानवात", "पालम", "परभणी", "पाथरी", "पूर्णा", "शैलू", "सोनपेठ" ]
},

{"name":"पुणे",
"tahasil":[ "आंबेगाव", "बारामती", "भोर", "दौंड", "हवेली", "इंदापूर", "जुन्नर", "खेड", "मावळ", "मुळशी", "पुणे  सिटी", "पुरंदर", "शिरूर", "वेल्हे" ]
},

{"name":"रायगड",
"tahasil":[ "अलिबाग", "कर्जत", "खालापूर", "महाड", "माणगाव", "म्हसळा", "मुरुड", "पनवेल", "पेन", "पोलादपूर", "रोहा", "श्रीवर्धन", "सुधागड", "टाळा", "उरण" ]
},

{"name":"रत्नागिरी",
"tahasil":[ "चिपळूण", "दापोली", "गुहागर", "खेड", "लांजा", "मंडणगड", "राजापूर", "रत्नागिरी", "संगमेश्वर" ]
},

{"name":"सांगली",
"tahasil":[ "आटपाडी", "जत", "कडेगाव", "कवठेमहांकाळ", "खानापूर", "मिरज", "पलूस", "शिराळा", "तासगाव", "वाळवा" ]
},

{"name":"सातारा",
"tahasil":[ "जावळी", "कराड", "खंडाळा", "खटाव", "कोरेगाव", "महाबळेश्वर", "मान", "पाटण", "फलटण", "सातारा", "वाई" ]
},

{"name":"सिंधुदुर्ग",
"tahasil":[ "देवगड", "दोडामार्ग", "कणकवली", "कुडाळ", "मालवण", "सावंतवाडी", "वैभववाडी", "वेंगुर्ला" ]
},

{"name":"सोलापूर",
"tahasil":[ "अक्कलकोट", "बार्शी", "करमाळा", "माढा", "माळशिरस", "मंगळवेढे", "मोहोळ", "पंढरपूर", "सांगोले", "दक्षिण सोलापूर", "उत्तर सोलापूर" ]
},

{"name":"ठाणे",
"tahasil":[ "अंबरनाथ", "भिवंडी", "डहाणू", "जव्हार", "कल्याण", "मोखाडा", "मुरबाड", "पालघर", "शहापूर", "तलासरी", "ठाणे", "उल्हासनगर", "वाडा", "वसई", "विक्रमगड" ]
},

{"name":"वर्धा",
"tahasil":[ "आर्वी", "आष्टी", "देवळी", "हिंगणघाट", "कारंजा", "समुद्रपूर", "सेलू", "वर्धा" ]
},

{"name":"वाशीम",
"tahasil":[ "कारंजा", "मालेगाव", "मंगरुळपीर", "मनोरा", "रिसोड", "वाशीम" ]
},

{"name":"यवतमाळ",
"tahasil":["आर्णी",
"बाबुलगाव",
"दारव्हा",
"डिग्रस",
"घाटानजी",
"कळंब",
"केळापूर",
"महागाव",
"मारेगाव",
"नेर",
"पुसद",
"राळेगाव",
"उमरखेड",
"वणी",
"यवतमाळ",
"झरी-जामणी"]
}
 ]

//https://gist.github.com/maheshwarLigade/747cd06ad6765c3dc4afd0bea0fb45cf
//https://gist.github.com/maheshwarLigade/f0ae609cf7e68480622c2acc20b06a7f