const path = require('node:path');
const express = require('express');
const { DeviceStore, StoreError } = require('./store');

function sendStoreError(res, error) {
    if (error instanceof StoreError) {
        const status = {
            VALIDATION: 400,
            CONFLICT: 409,
            NOT_FOUND: 404
        }[error.code] || 400;
        return res.status(status).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: 'Unexpected server error.' });
}

function createApp(store = new DeviceStore()) {
    const app = express();

    app.disable('x-powered-by');
    app.use(express.json({ limit: '16kb' }));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.get('/api/devices', (req, res) => {
        res.json(store.list());
    });

    app.get('/api/devices/:id', (req, res) => {
        const device = store.get(req.params.id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found.' });
        }
        res.json(device);
    });

    app.post('/api/devices', (req, res) => {
        try {
            const device = store.create(req.body);
            res.status(201).json(device);
        } catch (error) {
            sendStoreError(res, error);
        }
    });

    app.put('/api/devices/:id', (req, res) => {
        try {
            const device = store.update(req.params.id, req.body);
            res.json(device);
        } catch (error) {
            sendStoreError(res, error);
        }
    });

    app.delete('/api/devices/:id', (req, res) => {
        if (!store.delete(req.params.id)) {
            return res.status(404).json({ error: 'Device not found.' });
        }
        res.status(204).send();
    });

    app.use('/api', (req, res) => {
        res.status(404).json({ error: 'Not found.' });
    });

    return app;
}

module.exports = { createApp };
