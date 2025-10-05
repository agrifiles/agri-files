
'use client';

import { useState, useRef, useEffect, useContext } from 'react';
import { Stage, Layer, Rect, Circle, Line, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { LangContext } from '../layout';

export default function FarmLayoutTool() {
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

  // ---------- Localization ----------
  const { t } = useContext(LangContext);

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

  // ---------- Render ----------
  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold text-cyan-700 mb-4">{t.graphTitle}</h2>

      {/* Toolbar */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button onClick={() => addShape('well')} className="px-3 py-1 bg-blue-500 text-white rounded">{t.well}</button>
        <button onClick={() => addShape('main_pipe')} className="px-3 py-1 bg-orange-500 text-white rounded">{t.mainPipe}</button>
        <button onClick={() => addShape('lateral_pipe')} className="px-3 py-1 bg-sky-500 text-white rounded">{t.lateralPipe}</button>
        <button onClick={() => addShape('border')} className="px-3 py-1 bg-green-600 text-white rounded">{t.border}</button>
        <button onClick={() => addShape('valve_image')} className="px-3 py-1 bg-purple-500 text-white rounded">{t.valve}</button>
        <button onClick={() => addShape('filter_image')} className="px-3 py-1 bg-teal-600 text-white rounded">{t.filter}</button>
        <button onClick={() => addShape('flush_image')} className="px-3 py-1 bg-red-600 text-white rounded">{t.flush}</button>
        <button onClick={handleDelete} className="px-3 py-1 bg-gray-700 text-white rounded">{t.delete}</button>
      </div>

      {/* Canvas */}
      <Stage
        width={900}
        height={600}
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

      <button
        onClick={() => console.log('Exported Layout:', shapes)}
        className="mt-4 px-4 py-2 bg-cyan-700 text-white rounded"
      >
        {t.export}
      </button>
    </div>
  );
}
