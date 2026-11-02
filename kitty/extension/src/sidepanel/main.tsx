import { render } from 'preact';
import { DEFAULT_SERVER_URL } from '../shared/config';

function SidePanel() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '16px' }}>
      <h1 style={{ fontSize: '18px', margin: '0 0 8px' }}>Kitty</h1>
      <p>Tours and tutoring are coming soon.</p>
      <p style={{ color: '#666', fontSize: '12px' }}>Server: {DEFAULT_SERVER_URL}</p>
    </main>
  );
}

const root = document.getElementById('app');
if (root) render(<SidePanel />, root);
