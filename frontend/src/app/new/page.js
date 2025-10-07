'use client';

import { useState, useRef, useEffect, useContext} from 'react';
import { LangContext } from '../layout';
import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
import useImage from 'use-image';

export default function NewFilePage() {
  // ---------- Localization ----------
  const { t } = useContext(LangContext);


  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fyYear: '', company: '', applicationId: '', farmerId: '', farmerName: '', fatherName: '',
    mobile: '', quotationNo: '', quotationDate: '', billNo: '', billDate: '', village: '',
    taluka: '', district: '', area8A: '', gutNo: '', cropName: '',

    irrigationArea: '', lateralSpacing: '', driplineProduct: '', dripperDischarge: '',
    dripperSpacing: '', planeLateralQty: '',fileDate: new Date().toISOString().split('T')[0]
  });

  // const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value

    
  //  });

  const handleChange = (e) => {
  const { name, value } = e.target;

  setForm((prev) => {
    const updatedForm = { ...prev, [name]: value };

    // ✅ If the "village" field changes, also update "place"
    if (name === "village") {
      updatedForm.place = value;
    }

    return updatedForm;
  });
};

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const goToStep = (n) => setStep(n);

  const submitForm = (e) => {
    e.preventDefault();
    console.log('Form submitted', form);
    alert(t.formSubmitted || 'Form submitted successfully!');
  };

  const steps = [
    { id: 1, title: t.stepOne || 'Step 1' },
    { id: 2, title: t.stepTwo || 'Step 2' },
    { id: 3, title: t.stepThree || 'Step 3' },
    { id: 4, title: t.stepFour || 'Step 4' },
  ];

    const stageRef = useRef(null);
  const trRef = useRef(null);

  // Load images (place in /public)
  const [valveImg] = useImage('/valve.png');
  const [filterImg] = useImage('/screen_filter.png');
  const [flushImg] = useImage('/flush_valve.png');

  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [lang, setLang] = useState('en');


  // ---------- Add Shapes ----------
  const addShape = (type) => {
    if (type.includes('pipe')) {
      setTool(type);
      return;
    }
    const id = `shape_${Date.now()}`;
    const newShape = {
      id,
      type,
      x: 120,
      y: 100,
      width: 100,
      height: 80,
      radius: 40,
      rotation: 0,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(id);
  };

  // ---------- Drawing ----------
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (tool === 'main_pipe' || tool === 'lateral_pipe') {
      const id = `shape_${Date.now()}`;
      const newLine = {
        id,
        type: tool,
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: tool === 'main_pipe' ? 'orange' : 'blue',
        strokeWidth: tool === 'main_pipe' ? 3 : 2,
        dash: tool === 'lateral_pipe' ? [10, 5] : [],
      };
      setShapes((prev) => [...prev, newLine]);
      setCurrentLine(id);
      setIsDrawing(true);
      return;
    }

    if (e.target === stage) setSelectedId(null);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentLine) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setShapes((prev) =>
      prev.map((s) =>
        s.id === currentLine
          ? { ...s, points: [s.points[0], s.points[1], pos.x, pos.y] }
          : s
      )
    );
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentLine(null);
      setTool(null);
    }
  };

  // ---------- Transform / Drag ----------
  const handleDragEnd = (id, e) => {
    const { x, y } = e.target.position();
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const handleTransformEnd = (id, node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    setShapes((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.type === 'border' || s.type.includes('image')) {
            return {
              ...s,
              x: node.x(),
              y: node.y(),
              width: Math.max(5, node.width() * scaleX),
              height: Math.max(5, node.height() * scaleY),
              rotation: node.rotation(),
            };
          }
          if (s.type === 'well') {
            return {
              ...s,
              x: node.x(),
              y: node.y(),
              radius: Math.max(5, s.radius * scaleX),
              rotation: node.rotation(),
            };
          }
        }
        return s;
      })
    );
  };

  const handleDelete = () => {
    if (selectedId) {
      setShapes((prev) => prev.filter((s) => s.id !== selectedId));
      setSelectedId(null);
    }
  };

  // ---------- Transformer ----------
  useEffect(() => {
    const transformer = trRef.current;
    if (!transformer) return;
    const stage = stageRef.current;
    const selectedNode = stage.findOne(`#${selectedId}`);
    transformer.nodes(selectedNode ? [selectedNode] : []);
    transformer.getLayer().batchDraw();
  }, [selectedId, shapes]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-5 px-4">
      <form
        onSubmit={submitForm}
        className="w-full max-w-6xl bg-white shadow-lg rounded-lg p-8 space-y-6"
      >

<div className="flex items-center justify-between mb-8">
  {/* Title on the left */}
  <h2 className="text-2xl font-bold text-cyan-700">{t.newFile}</h2>

  {/* Step Indicators on the right */}
  <div className="flex items-center space-x-6">
    {steps.map((s) => (
      <div
        key={s.id}
        className="flex flex-col items-center cursor-pointer"
        onClick={() => goToStep(s.id)}
      >
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-full text-white font-bold text-lg shadow-md transition-all ${
            step === s.id
              ? 'bg-cyan-600 scale-110'
              : 'bg-gray-300 hover:bg-cyan-400 hover:scale-105'
          }`}
        >
          {s.id}
        </div>
        <p
          className={`mt-2 text-sm font-medium ${
            step === s.id ? 'text-cyan-700' : 'text-gray-500'
          }`}
        >
          {/* {s.title} */}
        </p>
      </div>
    ))}
  </div>
</div>



        {/* Step 1 */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.fyYear}</label>
              <select name="fyYear" value={form.fyYear} onChange={handleChange} className="input" required>
                <option value="">{t.fyYear}</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.farmerName}</label>
              <input name="farmerName" value={form.farmerName} onChange={handleChange} className="input" required />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.applicationId}</label>
              <input name="applicationId" value={form.applicationId} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.farmerId}</label>
              <input name="farmerId" value={form.farmerId} onChange={handleChange} className="input" />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.fatherName}</label>
              <input name="fatherName" value={form.fatherName} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.mobile}</label>
              <input name="mobile" value={form.mobile} onChange={handleChange} className="input" />
            </div>

                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.aadhaarNo}</label>
              <input name="aadhaarNo" value={form.aadhaarNo} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.district}</label>
              <input name="district" value={form.district} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.taluka}</label>
              <input name="taluka" value={form.taluka} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.village}</label>
              <input name="village" value={form.village} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.area8a}</label>
              <input name="area8A" value={form.area8A} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.gutNo}</label>
              <input name="gutNo" value={form.gutNo} onChange={handleChange} className="input" />
            </div>


          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">

                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.selectCompany}</label>
              <select name="company" value={form.company} onChange={handleChange} className="input" required>
                <option value="">{t.selectCompany}</option>
                <option value="Agri Solutions">Agri Solutions</option>
                <option value="Green Fields">Green Fields</option>
                <option value="FarmTech">FarmTech</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.salesEngg}</label>
              <input name="salesEngg" value={form.salesEngg} onChange={handleChange} className="input" required />
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.selectCrop}</label>
              <select name="cropName" value={form.cropName} onChange={handleChange} className="input">
                <option value="">{t.selectCrop}</option>
                <option value="Sugarcane">{t.sugarcane}</option>
                <option value="Cotton">{t.cotton}</option>
                <option value="Wheat">{t.wheat}</option>
              </select>
            </div>


            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.irrigationArea}</label>
              <input name="irrigationArea" value={form.irrigationArea} onChange={handleChange} className="input" required />
            </div>

              <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.pumpType}</label>
              <select name="pumpType" value={form.pumpType} onChange={handleChange} className="input" required>
                <option value="">{t.pumpType}</option>
                <option value="electric">{t.electric}</option>
                <option value="solar">{t.solar}</option>
                <option value="diesel">{t.diesel}</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.lateralSpacing}</label>
              <input name="lateralSpacing" value={form.lateralSpacing} onChange={handleChange} className="input" required />
            </div>

                                   <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.twoNozzelDistance}</label>
              <input name="twoNozzelDistance" value={form.twoNozzelDistance} onChange={handleChange} className="input" />
            </div>


            
                                   <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.twoNozzelDistance}</label>
              <input name="twoNozzelDistance" value={form.twoNozzelDistance} onChange={handleChange} className="input" />
            </div>

                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.dripperDischarge}</label>
              <input name="dripperDischarge" value={form.dripperDischarge} onChange={handleChange} className="input" required />
            </div>

            {/* <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.driplineProduct}</label>
              <input name="driplineProduct" value={form.driplineProduct} onChange={handleChange} className="input" required />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.dripperSpacing}</label>
              <select name="dripperSpacing" value={form.dripperSpacing} onChange={handleChange} className="input">
                <option value="">{t.selectDripperSpacing}</option>
                <option value="10cm">10 cm</option>
                <option value="20cm">20 cm</option>
                <option value="30cm">30 cm</option>
                <option value="40cm">40 cm</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.planeLateralQty}</label>
              <input name="planeLateralQty" value={form.planeLateralQty} onChange={handleChange} className="input" required />
            </div> */}




                        <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.quotationNo}</label>
              <input name="quotationNo" value={form.quotationNo} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.quotationDate}</label>
              <input type="date" name="quotationDate" value={form.quotationDate} onChange={handleChange} className="input" />
            </div> 

            {/* <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.billNo}</label>
              <input name="billNo" value={form.billNo} onChange={handleChange} className="input" />
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">{t.billDate}</label>
              <input type="date" name="billDate" value={form.billDate} onChange={handleChange} className="input" />
            </div> */}
          </div>
        )}

         {step === 3 && (


    <div className="flex flex-col items-center p-1">
      <h2 className="text-2xl font-bold text-cyan-700 mb-4">{t.graphTitle}</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button type="button" onClick={() => addShape('well')} className="px-3 py-1 bg-blue-500 text-white rounded">{t.well}</button>
        <button type="button" onClick={() => addShape('main_pipe')} className="px-3 py-1 bg-orange-500 text-white rounded">{t.mainPipe}</button>
        <button type="button" onClick={() => addShape('lateral_pipe')} className="px-3 py-1 bg-sky-500 text-white rounded">{t.lateralPipe}</button>
        <button type="button" onClick={() => addShape('border')} className="px-3 py-1 bg-green-600 text-white rounded">{t.border}</button>
        <button type="button" onClick={() => addShape('valve_image')} className="px-3 py-1 bg-purple-500 text-white rounded">{t.valve}</button>
        <button type="button" onClick={() => addShape('filter_image')} className="px-3 py-1 bg-teal-600 text-white rounded">{t.filter}</button>
        <button type="button" onClick={() => addShape('flush_image')} className="px-3 py-1  bg-sky-600 text-white rounded">{t.flush}</button>
        <button type="button" onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded">{t.delete}</button>
      </div>

      {/* Canvas */}
      <Stage
        width={900}
        height={416}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          border: '2px solid #ccc',
          backgroundSize: '20px 20px',
          backgroundImage:
            'linear-gradient(to right, #eee 1px, transparent 1px), linear-gradient(to bottom, #eee 1px, transparent 1px)',
          cursor: tool?.includes('pipe') ? 'crosshair' : 'default',
        }}
      >
        <Layer>
          {shapes.map((s) => {
            const common = {
              id: s.id,
              draggable: !s.type.includes('pipe'),
              onClick: () => setSelectedId(s.id),
              onDragEnd: (e) => handleDragEnd(s.id, e),
              onTransformEnd: (e) => handleTransformEnd(s.id, e.target),
              hitStrokeWidth: 20,
            };

            if (s.type === 'well')
              return (
                <Circle
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  radius={s.radius}
                  stroke="blue"
                  strokeWidth={2}
                  fillEnabled={false}
                />
              );

            if (s.type === 'border')
              return (
                <Rect
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  stroke="green"
                  strokeWidth={2}
                  fillEnabled={false}
                />
              );

            if (s.type === 'main_pipe' || s.type === 'lateral_pipe')
              return (
                <Line
                  key={s.id}
                  {...common}
                  points={s.points}
                  stroke={s.stroke}
                  strokeWidth={s.strokeWidth}
                  dash={s.dash}
                />
              );

            if (s.type === 'valve_image')
              return (
                <Image
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  image={valveImg}
                />
              );

            if (s.type === 'filter_image')
              return (
                <Image
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  image={filterImg}
                />
              );

            if (s.type === 'flush_image')
              return (
                <Image
                  key={s.id}
                  {...common}
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  image={flushImg}
                />
              );

            return null;
          })}

          <Transformer ref={trRef} rotateEnabled={true} anchorSize={8} borderStroke="black" borderDash={[4, 4]} />
        </Layer>
      </Stage>
{/* 
      <button
        onClick={() => console.log('Exported Layout:', shapes)}
        className="mt-4 px-4 py-2 bg-cyan-700 text-white rounded"
      >
        {t.export}
      </button> */}
    </div>


        )}

{step === 4 && (
  <div className="grid grid-cols-2 gap-4">

    {/* Bill Information */}
    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.billNo}</label>
      <input
        name="billNo"
        value={form.billNo}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.billAmount}</label>
      <input
        type="number"
        name="billAmount"
        value={form.billAmount}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1Name}</label>
      <input
        name="w1Name"
        value={form.w1Name}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1Village}</label>
      <input
        name="w1Village"
        value={form.w1Village}
        onChange={handleChange}
        className="input"
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1Taluka}</label>
      <input
        name="w1Taluka"
        value={form.w1Taluka}
        onChange={handleChange}
        className="input"
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w1District}</label>
      <input
        name="w1District"
        value={form.w1District}
        onChange={handleChange}
        className="input"
      />
    </div>


    {/* <div className="col-span-2 border-t pt-4"></div> */}


    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2Name}</label>
      <input
        name="w2Name"
        value={form.w2Name}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2Village}</label>
      <input
        name="w2Village"
        value={form.w2Village}
        onChange={handleChange}
        className="input"
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2Taluka}</label>
      <input
        name="w2Taluka"
        value={form.w2Taluka}
        onChange={handleChange}
        className="input"
      />
    </div>

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.w2District}</label>
      <input
        name="w2District"
        value={form.w2District}
        onChange={handleChange}
        className="input"
      />
    </div>

    {/* Date and Place */}
    {/* <div className="col-span-2 border-t pt-4"></div> */}

    <div className="flex flex-col">
      <label className="font-semibold mb-1">{t.fileDate}</label>
      <input
        type="date"
        name="fileDate"
        value={form.fileDate}
        onChange={handleChange}
        className="input"
        required
      />
    </div>

<div className="flex flex-col">
  <label className="font-semibold mb-1">{t.place}</label>
  <input
    name="place"
    value={form.place}
    onChange={handleChange}
    className="input"
  />
</div>
  </div>
)}


{/* Navigation Buttons */}
<div className="flex justify-between mt-6">
  {/* Previous button */}
  {step > 1 && (
    <button
      type="button"
      onClick={prevStep}
      className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
    >
      {t.previous}
    </button>
  )}

  {/* Next button (only for steps 1–3) */}
  {step < 4 && (
    <button
      type="button"
      onClick={nextStep}
      className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
    >
      {t.next}
    </button>
  )}

  {/* Submit button (only for step 4) */}
  {step === 4 && (
    <button
      type="submit"
      className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
    >
      {t.submit}
    </button>
  )}
</div>


        <style jsx>{`
          .input {
            border: 1px solid #e5e7eb;
            padding: 10px;
            border-radius: 6px;
            width: 100%;
          }
        `}</style>
      </form>
    </div>
  );
}
