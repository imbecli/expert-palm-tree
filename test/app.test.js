const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../lib/app');
const { DeviceStore } = require('../lib/store');

async function withServer(run) {
    const store = new DeviceStore();
    const server = http.createServer(createApp(store));

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        await run({ baseUrl, store });
    } finally {
        await new Promise((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
}

describe('device API', () => {
    it('creates, lists, updates, and deletes a device', async () => {
        await withServer(async ({ baseUrl }) => {
            const createdResponse = await fetch(`${baseUrl}/api/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceType: 'Laptop',
                    serialNumber: 'LAP-100',
                    condition: 'New'
                })
            });
            assert.equal(createdResponse.status, 201);
            const created = await createdResponse.json();
            assert.equal(created.serialNumber, 'LAP-100');

            const listResponse = await fetch(`${baseUrl}/api/devices`);
            assert.equal(listResponse.status, 200);
            const list = await listResponse.json();
            assert.equal(list.length, 1);

            const updateResponse = await fetch(`${baseUrl}/api/devices/${created.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceType: 'Laptop', condition: 'Good' })
            });
            assert.equal(updateResponse.status, 200);
            const updated = await updateResponse.json();
            assert.equal(updated.condition, 'Good');
            assert.equal(updated.serialNumber, 'LAP-100');

            const deleteResponse = await fetch(`${baseUrl}/api/devices/${created.id}`, {
                method: 'DELETE'
            });
            assert.equal(deleteResponse.status, 204);

            const emptyResponse = await fetch(`${baseUrl}/api/devices`);
            assert.deepEqual(await emptyResponse.json(), []);
        });
    });

    it('serves the device page and rejects empty creates', async () => {
        await withServer(async ({ baseUrl }) => {
            const page = await fetch(`${baseUrl}/`);
            assert.equal(page.status, 200);
            const html = await page.text();
            assert.match(html, /IT device inventory/);

            const invalid = await fetch(`${baseUrl}/api/devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            assert.equal(invalid.status, 400);
        });
    });
});
