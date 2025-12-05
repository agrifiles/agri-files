'use client';
import { Stage, Layer, Circle, Rect, Line, Image as KonvaImage } from 'react-konva';
import { useEffect, useState } from 'react';
import useImage from 'use-image';

function ValveImage({ data }) {
  const [image] = useImage('/valve.png');
  return (
    <KonvaImage
      x={data.x}
      y={data.y}
      width={data.width}
      height={data.height}
      image={image}
      rotation={data.rotation || 0}
    />
  );
}

function FilterImage({ data }) {
  const [image] = useImage('/screen_filter.png');
  return (
    <KonvaImage
      x={data.x}
      y={data.y}
      width={data.width}
      height={data.height}
      image={image}
      rotation={data.rotation || 0}
    />
  );
}

function FlushImage({ data }) {
  const [image] = useImage('/flush_valve.png');
  return (
    <KonvaImage
      x={data.x}
      y={data.y}
      width={data.width}
      height={data.height}
      image={image}
      rotation={data.rotation || 0}
    />
  );
}

export default function FarmMapCanvas({ shapes }) {
  if (!shapes || shapes.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '85%', height: '88%', border: '1px dashed #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#555' }}>
            नकाशा / प्लॉट स्केच येथे येईल
            <br />
            (Map data not available)
          </div>
        </div>
      </div>
    );
  }

  return (
    <Stage
      width={900}
      height={600}
      scaleX={0.73}
      scaleY={0.73}
      style={{ background: 'white', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
    >
      <Layer>
        {shapes.map((s) => {
          if (s.type === 'well')
            return (
              <Circle
                key={s.id}
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
                points={s.points}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                dash={s.dash || []}
              />
            );

          if (s.type === 'valve_image')
            return <ValveImage key={s.id} data={s} />;

          if (s.type === 'filter_image')
            return <FilterImage key={s.id} data={s} />;

          if (s.type === 'flush_image')
            return <FlushImage key={s.id} data={s} />;

          return null;
        })}
      </Layer>
    </Stage>
  );
}
