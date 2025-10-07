'use client';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { LangContext } from '../layout';
export default function HomePage() {
      const { t } = useContext(LangContext);
      const router = useRouter();
  const handleNavigate = (path) => {
    router.push(path);
  };

const sections = [
  {
    title: t.products,
    description: t.descProducts,
    buttonText: t.btnProduct,
    route: '/products',
  },
  {
    title: t.bills,
    description: t.descBills,
    buttonText: t.btnBills,
    route: '/billing',
  },
    // You can add more sections later
    // { title: 'Inventory', description: 'Manage stock', buttonText: 'Go to Inventory', route: '/inventory' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-cyan-700 mb-8">Agri Files Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec, idx) => (
          <div key={idx} className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{sec.title}</h2>
              <p className="text-gray-600">{sec.description}</p>
            </div>
            <button
              onClick={() => handleNavigate(sec.route)}
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-all"
            >
              {sec.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
