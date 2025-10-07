'use client';

import { useState, useEffect } from 'react';
import { districtsEn, districtsMr } from './districts';

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
    name: "Ahmednagar",
    tahasil: ["Akola", "Jamkhed", "Karjat", "Kopargaon", "Nagar", "Nevasa", "Parner", "Pathardi", "Rahta", "Rahuri", "Sangamner", "Shevgaon", "Shrigonda", "Shrirampur"]
  },
  {
    name: "Akola",
    tahasil: ["Akola", "Akot", "Balapur", "Barshitakli", "Murtijapur", "Patur", "Telhara"]
  },
  {
    name: "Amravati",
    tahasil: ["Achalpur", "Amravati", "Anjangaon Surji", "Bhatkuli", "Chandur Railway", "Chandurbazar", "Chikhaldara", "Daryapur", "Dhamangaon Railway", "Dharni", "Morshi", "Nandgaon-Khandeshwar", "Teosa", "Warud"]
  },
  {
    name: "Aurangabad",
    tahasil: ["Aurangabad", "Gangapur", "Kannad", "Khuldabad", "Paithan", "Phulambri", "Sillod", "Soegaon", "Vaijapur"]
  }
];

export const districtsMr = [
  {
    name: "अहमदनगर",
    tahasil: ["अकोले", "जामखेड", "कर्जत", "कोपरगाव", "नगर", "नेवासा", "पारनेर", "पाथर्डी", "राहाता", "राहुरी", "संगमनेर", "शेवगांव", "श्रीगोंदा", "श्रीरामपूर"]
  },
  {
    name: "अकोला",
    tahasil: ["अकोला", "अकोट", "बाळापुर ", "बार्शीटाकळी", "मुर्तीजापुर", "पातूर", "तेल्हारा"]
  },
  {
    name: "अमरावती",
    tahasil: ["अचलपूर", "अमरावती", "अंजनगाव सुर्जी", "भातकुली", "चांदुर रेल्वे", "चांदुर बाजार", "चिखलदरा", "दर्यापूर", "धामणगांव रेल्वे", "धारणी", "मोर्शी", "नांदगाव खंडेश्वर", "तिवसा", "वरुड"]
  },
  {
    name: "औरंगाबाद",
    tahasil: ["औरंगाबाद", "गंगापुर", "कन्नड़", "खुलताबाद", "पैठण", "फुलंब्री", "सिल्लोड", "सोयगांव", "वैजापूर"]
  }
];

//https://gist.github.com/maheshwarLigade/747cd06ad6765c3dc4afd0bea0fb45cf
//https://gist.github.com/maheshwarLigade/f0ae609cf7e68480622c2acc20b06a7f