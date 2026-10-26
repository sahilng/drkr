const { chromium, webkit } = require('playwright');
const name = process.env.BROWSER || 'chromium';
if (!['chromium', 'webkit'].includes(name)) throw new Error('BROWSER must be chromium or webkit');
module.exports = {
  name,
  launch: () => (name === 'webkit' ? webkit : chromium).launch({
    headless: true,
    ...(name === 'chromium' && process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
  })
};
