let input = '';
for await (const chunk of process.stdin) input += chunk;

const payload = JSON.parse(input);
const apps = Array.isArray(payload) ? payload : payload.result;
const webApp = Array.isArray(apps) ? apps.find((app) => String(app.platform || '').toUpperCase() === 'WEB') : null;
if (!webApp?.appId) {
  throw new Error('No Firebase Web App is registered in project tecticalhub.');
}
process.stdout.write(String(webApp.appId));
