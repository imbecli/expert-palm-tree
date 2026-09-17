const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { DeviceStore, StoreError } = require('../lib/store');

describe('DeviceStore', () => {
    let store;

    beforeEach(() => {
        store = new DeviceStore();
    });

    it('creates and lists devices with generated ids', () => {
        const created = store.create({
            deviceType: 'Laptop',
            serialNumber: 'LAP-001',
            condition: 'Good'
        });

        assert.equal(created.id, '1');
        assert.equal(created.status, 'Available');
        assert.equal(store.list().length, 1);
        assert.equal(store.get('1').serialNumber, 'LAP-001');
    });

    it('updates an existing device instead of adding another', () => {
        store.create({ deviceType: 'Laptop', serialNumber: 'LAP-001' });
        const updated = store.update('1', { deviceType: 'Tablet', status: 'Assigned' });

        assert.equal(updated.deviceType, 'Tablet');
        assert.equal(updated.serialNumber, 'LAP-001');
        assert.equal(updated.status, 'Assigned');
        assert.equal(store.list().length, 1);
    });

    it('rejects a duplicate serial number', () => {
        store.create({ deviceType: 'Laptop', serialNumber: 'LAP-001' });
        assert.throws(
            () => store.create({ deviceType: 'Phone', serialNumber: 'lap-001' }),
            (error) => error instanceof StoreError && error.code === 'CONFLICT'
        );
    });

    it('does not wipe existing devices when reset is unused', () => {
        store.create({ deviceType: 'Laptop', serialNumber: 'LAP-001' });
        store.create({ deviceType: 'Phone', serialNumber: 'PHN-002' });
        assert.equal(store.list().length, 2);
        assert.equal(store.delete('2'), true);
        assert.equal(store.list().length, 1);
        assert.equal(store.get('1').serialNumber, 'LAP-001');
    });
});
