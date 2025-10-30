import { renderToString } from 'react-dom/server';
import AdminHome from './page.js';

describe('AdminHome', () => {
  it('renders the coming soon message', () => {
    const html = renderToString(<AdminHome />);
    expect(html).toContain('Tap &amp; Stamp Admin – Coming Soon');
  });
});
