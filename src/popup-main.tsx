import { createRoot } from 'react-dom/client';
import { Popup } from './popup/Popup';
import './index.css';

const rootEl = document.getElementById('popup-root');
if (rootEl) {
  createRoot(rootEl).render(<Popup standalone={false} />);
}
