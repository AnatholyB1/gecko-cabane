import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #1B4332 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          position: 'relative',
        }}
      >
        {/* Gecko body */}
        <div style={{
          position: 'absolute',
          width: '12px',
          height: '16px',
          backgroundColor: '#7BA05B',
          borderRadius: '50%',
          top: '10px',
          left: '10px',
        }} />
        {/* Gecko head */}
        <div style={{
          position: 'absolute',
          width: '10px',
          height: '8px',
          backgroundColor: '#7BA05B',
          borderRadius: '50%',
          top: '4px',
          left: '11px',
        }} />
        {/* Eyes */}
        <div style={{
          position: 'absolute',
          width: '3px',
          height: '3px',
          backgroundColor: '#1B4332',
          borderRadius: '50%',
          top: '5px',
          left: '9px',
        }} />
        <div style={{
          position: 'absolute',
          width: '3px',
          height: '3px',
          backgroundColor: '#1B4332',
          borderRadius: '50%',
          top: '5px',
          left: '20px',
        }} />
        {/* Tail */}
        <div style={{
          position: 'absolute',
          width: '8px',
          height: '4px',
          backgroundColor: '#7BA05B',
          borderRadius: '4px',
          top: '22px',
          left: '16px',
          transform: 'rotate(45deg)',
        }} />
      </div>
    ),
    {
      ...size,
    }
  )
}