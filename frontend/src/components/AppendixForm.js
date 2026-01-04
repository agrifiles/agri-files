'use client';

/**
 * AppendixForm - Static Agricultural Form (परिशिष्ट - ३)
 * Displays the agricultural product details form as per the template
 */
export default function AppendixForm({ userData, billData, fileData , fileName = {} }) {
  // Ensure userData is an object even if null or undefined
  const user = userData || {};
  console.log('Rendering AppendixForm with userData:', userData, 'billData:', billData, 'fileData:', fileData);
  // Get bill items from billData if available
  const billItems = billData?.items || billData?.billItems || [];
  
  // Use bill items if available, otherwise use static form items
  const formItems = billItems.length > 0 ? billItems : [
    { serial: 1, item: 'विकिरण कपला्च ए.डी.पी.ई. चाई (लायेस-२)', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 2, item: 'विकिरण कपला्च ए.डी.पी.ई. चाई (लायेस-२)', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 3, item: 'जि.आय.राजचार चाई (ष्य् व्यास × १६५ mm)', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 4, item: 'ड्रिप कलर नोजल (१.० लि १.८ kg/मि.सीपर) बी.आय.एस १२३२र-पार्ट ९', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 5, item: 'विकिरण कपला्च ए.डी.पी.ई. बंड (कपलन सह) ६३/९०/१० मी.मी', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 6, item: 'विकिरण कपला्च HDPE एक्सचेप (थ्यास ६३/९०/१० मी.मी)', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 7, item: 'विकिरण कपला्च HDPE टी (थ्यास ६३/९०/१० मी.मी)', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 8, item: 'प्रेशर गेज', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
    { serial: 9, item: 'सुपार सिंचन सावाद इमिनेशन केल्ले आहे/नाही', cmlNo: '', seedNo: '', totalNumber: '', totalQuantity: '' },
  ];

  const today = new Date();
  const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <div 
      className="w-full bg-white"
      style={{
        width: "100%",
        height: "auto",
        margin: "0",
        fontSize: "11px",
        padding: "5mm",
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header Section */}
      <div className="mb-1">
        <h1 className="text-center text-xl font-bold mb-2">परिशिष्ट - ३</h1>
        <p className="text-center text-sm font-semibold mb-4">{fileName} {fileData.dripline_product|| '__________'} सिंचन संच - मोका तपसाणी परिशिष्ट</p>
      </div>

      {/* Info Section */}
      <div className="mb-1  border-2 border-gray-300">
        <table className="w-full">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="border-r border-gray-300 p-2 w-1/5">
                <p className="text-xs font-semibold">शेतकऱ्याचे नाव</p>
              </td>
              <td colSpan="3" className="border-r border-gray-300 p-2 w-3/6">
                <p className="text-sm">{fileData.farmer_name|| '__________'}</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-xs font-semibold">तपासणी दिनांक</p>
              </td>
              <td className="p-2 w-1/6">
                <p className="text-sm">{fileData.file_date ? new Date(fileData.file_date).toLocaleDateString('en-GB') : '__________'}</p>
              </td>
            </tr>


            <tr className="border-b border-gray-300">
              <td className="border-r border-gray-300 p-2 w-1/5">
                <p className="text-xs font-semibold">गांवाचे नाव</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-sm">{fileData.village || '__________'}</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-xs font-semibold">तालुका</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-sm">{fileData.taluka || '__________'}</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-xs font-semibold">जिल्हा</p>
              </td>
              <td className="p-2 w-1/6">
                <p className="text-sm">{fileData.district || '__________'}</p>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="border-r border-gray-300 p-2 w-1/5">
                <p className="text-xs font-semibold">पिकाचे नाव</p>
              </td>
              <td colSpan="3" className="border-r border-gray-300 p-2 w-3/6">
                <p className="text-sm">{fileData.crop_name || '__________'}</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-xs font-semibold">सर्वे नंबर</p>
              </td>
              <td className="p-2 w-1/6">
                <p className="text-sm">{fileData.gut_no || fileData.survey_no  || '__________'}</p>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="border-r border-gray-300 p-2 w-1/5">
                <p className="text-xs font-semibold">पूर्व संमती क्र व दिनांक</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-sm">{fileData.pre_approval_number_date || '__________'}</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-xs font-semibold">पूर्व संमती क्षेत्र हे. </p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-sm">{fileData.irrigation_area || '__________'}</p>
              </td>
              <td className="border-r border-gray-300 p-2 w-1/6">
                <p className="text-xs font-semibold">प्रत्यक्ष</p>
              </td>
              <td className="p-2 w-1/6">
                <p className="text-sm">{fileData.irrigation_area || '__________'}</p>
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="border-r border-gray-300 p-2 w-1/5">
                <p className="text-xs font-semibold">देयक क्रमांक व रक्कम</p>
              </td>
              <td colSpan="5" className="border-gray-300 p-2">
                <p className="text-sm">{billData?.bill_no} :  {fileData.file_date ? new Date(fileData.file_date).toLocaleDateString('en-GB') : '__________'}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Items Table */}
      <div className="mb-2">
        <h3 className="text-center text-sm font-bold mb-3">सूस्म सिंचन संचातील साहित्य तपसाणी अहवाल</h3>
        {billItems.length === 0 ? (
          <div className="p-6 text-center bg-yellow-50 border-2 border-yellow-300 rounded">
            <p className="text-sm font-semibold text-yellow-800">⚠️ बील तयार नाही, कृपया बील जोडा</p>
          </div>
        ) : (
          <table className="w-full border-2 border-gray-300" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 p-2 text-xs font-bold" style={{width: '3%'}}>अ.क्र</th>
                <th className="border border-gray-300 p-2 text-xs font-bold" style={{width: '40%'}}>बाब</th>
                <th className="border border-gray-300 p-2 text-xs font-bold" style={{width: '12%'}}>CML नंबर</th>
                <th className="border border-gray-300 p-2 text-xs font-bold" style={{width: '10%'}}>बॅच नंबर</th>
                <th colSpan="2" className="border border-gray-300 p-2 text-xs font-bold text-center" style={{width: '18%'}}>बिलप्रमाणे</th>
                <th colSpan="2" className="border border-gray-300 p-2 text-xs font-bold text-center" style={{width: '19%'}}>प्रत्यक्ष</th>
              </tr>
              <tr className="bg-gray-200">
                <th colSpan="4" className="border border-gray-300 p-2" style={{width: '63%'}}></th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-center" style={{width: '9%'}}>परिणाम</th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-center" style={{width: '9%'}}>संख्या</th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-center" style={{width: '9.5%'}}>परिणाम</th>
                <th className="border border-gray-300 p-2 text-xs font-bold text-center" style={{width: '9.5%'}}>संख्या</th>
              </tr>
            </thead>
            <tbody>
              {formItems.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2 text-xs text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-2 text-xs">{item.description || item.item || 'N/A'}</td>
                  <td className="border border-gray-300 p-2 text-xs text-center">{item.cml_no || '_______'}</td>
                  <td className="border border-gray-300 p-2 text-xs text-center">{item.batch_no || '_______'}</td>
                  <td className="border border-gray-300 p-2 text-xs text-center">{item.uom || '_______'}</td>
                  <td className="border border-gray-300 p-2 text-xs text-center">{item.qty ? (parseFloat(item.qty) % 1 === 0 ? parseInt(item.qty) : parseFloat(item.qty)) : '_______'}</td>
                  <td className="border border-gray-300 p-2 text-xs text-center">_______</td>
                  <td className="border border-gray-300 p-2 text-xs text-center">_______</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes Section */}
      <div className="mb-1  p-2  border-2 border-gray-300 bg-gray-50">
        <p className="text-xs font-semibold mb-2">शेरा :</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          
        </p>
      </div>

      {/* Signature Section */}
      <div className="mt-1">
              <div className="mb-1  p-2  border-2 border-gray-300 bg-gray-50">
        <p className="text-xs font-semibold text-center mb-2">(एच.डी.पी.ई. पाईप-बी.आय.एस १४१५१-पार्ट २ यांचा CML नंबर व यांचा बॅच नं नमूद करावा.)</p>
          <p    className="text-xs mb-2">मी _________________________________ उप कृषी अधिकारी, सजा. {fileData.village}. ता. {fileData.taluka} जि . {fileData.district}. प्रमाणित करतो की, वरीलप्रमाणे मी मोका तपासणी केलेली असून ती क्षेत्र परीस्थितीप्रमाणे बरोबर आहे. सदर प्रकरणी मार्गदर्शक सूचना, मंजूर मापदंड व प्रत्यक्ष शेत परिस्थितीनुसार {fileData.irrigation_area} हेक्टर क्षेत्रासाठी अनुदान रक्कम रु. {billData?.items?.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toFixed(2) || '________'} अदा करणेसाठी शिफारस करण्यात येत आहे.
</p>
      
      </div>
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-1/3 p-4">
                <div className="border-2 border-gray-300 p-4 h-30 flex flex-col justify-between">
                  <div></div>
                  <div className="text-center">
                    <p className="text-xs font-semibold">स्वाक्षरी</p>
                    <p className="text-xs text-gray-600">{fileData.farmer_name}</p>
                     <p className="text-xs text-gray-600">शेतकरी </p>
                  </div>
                </div>
              </td>

              <td className="w-1/3 p-4">
                <div className="border-2 border-gray-300 p-4 h-30 flex flex-col justify-between">
                  <div></div>
                  
                  <div className="text-center">
                    <p className="text-xs font-semibold">स्वाक्षरी</p>
                    <p className="text-xs text-gray-600">संपूर्ण नाव _____________________</p>
                    <p className="text-xs text-gray-600">उप कृषी अधिकारी</p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
