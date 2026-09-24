import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'CGPA Bot | Student Success Engine';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#eff6ff',
          backgroundImage: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff, #ede9fe)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '60px 80px',
            borderRadius: '40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '2px solid rgba(255,255,255,0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: 60,
              fontWeight: 900,
              width: 120,
              height: 120,
              borderRadius: '30px',
              marginBottom: 40,
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.3)',
            }}
          >
            C
          </div>
          <h1
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: '#1e3a8a',
              margin: 0,
              marginBottom: 20,
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            MyGPA.com.ng
          </h1>
          <p
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: '#4f46e5',
              margin: 0,
              textAlign: 'center',
            }}
          >
            Track grades. See rankings. Graduate strong.
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
