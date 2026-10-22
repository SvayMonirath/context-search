// src/components/ui/CornerBrackets.jsx
export default function CornerBrackets({ color = '#4a9eff', size = 12, thickness = 2 }) {
  const style = (pos) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderColor: color,
    borderStyle: 'solid',
    borderWidth: 0,
    ...pos,
  });

  return (
    <>
      <span style={{ ...style({ top: -1, left: -1 }), borderTopWidth: thickness, borderLeftWidth: thickness }} />
      <span style={{ ...style({ top: -1, right: -1 }), borderTopWidth: thickness, borderRightWidth: thickness }} />
      <span style={{ ...style({ bottom: -1, left: -1 }), borderBottomWidth: thickness, borderLeftWidth: thickness }} />
      <span style={{ ...style({ bottom: -1, right: -1 }), borderBottomWidth: thickness, borderRightWidth: thickness }} />
    </>
  );
}
