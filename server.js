const { createApp } = require('./lib/app');
const { DeviceStore } = require('./lib/store');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;

if (HOST !== '127.0.0.1' && HOST !== 'localhost') {
    console.warn('Warning: this prototype has no authentication. Binding beyond localhost is unsafe.');
}

const app = createApp(new DeviceStore());

if (require.main === module) {
    app.listen(PORT, HOST, () => {
        console.log(`IT inventory prototype listening on http://${HOST}:${PORT}`);
    });
}

module.exports = { app };
