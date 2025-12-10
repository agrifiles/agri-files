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

  // Calculate bounds of all shapes to auto-fit
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  shapes.forEach((s) => {
    if (s.type === 'well') {
      minX = Math.min(minX, s.x - s.radius);
      minY = Math.min(minY, s.y - s.radius);
      maxX = Math.max(maxX, s.x + s.radius);
      maxY = Math.max(maxY, s.y + s.radius);
    } else if (s.type === 'border') {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.width);
      maxY = Math.max(maxY, s.y + s.height);
    } else if (s.type === 'main_pipe' || s.type === 'lateral_pipe') {
      for (let i = 0; i < s.points.length; i += 2) {
        minX = Math.min(minX, s.points[i]);
        maxX = Math.max(maxX, s.points[i]);
        minY = Math.min(minY, s.points[i + 1]);
        maxY = Math.max(maxY, s.points[i + 1]);
      }
    } else if (s.type === 'valve_image' || s.type === 'filter_image' || s.type === 'flush_image') {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + (s.width || 50));
      maxY = Math.max(maxY, s.y + (s.height || 50));
    }
  });

  // Add padding
  const padding = 20;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = maxX + padding;
  maxY = maxY + padding;

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Target canvas size (matching the container aspect ratio ~2:1)
  const canvasWidth = 660;
  const canvasHeight = 260;

  // Calculate scale to fit content in canvas
  const scaleX = canvasWidth / contentWidth;
  const scaleY = canvasHeight / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1

  // Offset to center content
  const offsetX = -minX * scale + (canvasWidth - contentWidth * scale) / 2;
  const offsetY = -minY * scale + (canvasHeight - contentHeight * scale) / 2;

  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      style={{ background: 'none' }}
    >
      <Layer x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
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

          if (s.type === 'main_pipe' || s.type === 'lateral_pipe' || s.type === 'sub_pipe') {
            let stroke = s.stroke, strokeWidth = s.strokeWidth, dash = s.dash || [];
            if (s.type === 'sub_pipe') {
              stroke = '#166534'; // Tailwind green-800
              strokeWidth = 3;
              dash = [];
            }
            return (
              <Line
                key={s.id}
                points={s.points}
                stroke={stroke}
                strokeWidth={strokeWidth}
                dash={dash}
              />
            );
          }

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
