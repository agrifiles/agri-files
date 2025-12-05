'use client';
import { Stage, Layer, Circle, Rect, Line } from 'react-konva';

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
      width={720}
      height={520}
      scaleX={0.8}
      scaleY={0.8}
      style={{ background: 'white', margin: '0 auto' }}
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

          return null;
        })}
      </Layer>
    </Stage>
  );
}
