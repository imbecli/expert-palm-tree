const CONDITIONS = new Set(['New', 'Good', 'Fair', 'Poor']);
const STATUSES = new Set(['Available', 'Assigned']);

class StoreError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'StoreError';
        this.code = code;
    }
}

function asTrimmedString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normaliseDeviceInput(input, { partial = false } = {}) {
    if (input == null || typeof input !== 'object' || Array.isArray(input)) {
        throw new StoreError('VALIDATION', 'Device details must be a JSON object.');
    }

    const device = {};

    if (!partial || input.deviceType !== undefined) {
        device.deviceType = asTrimmedString(input.deviceType);
        if (!device.deviceType) {
            throw new StoreError('VALIDATION', 'Device type is required.');
        }
    }

    if (!partial || input.serialNumber !== undefined) {
        device.serialNumber = asTrimmedString(input.serialNumber);
        if (!device.serialNumber) {
            throw new StoreError('VALIDATION', 'Serial number is required.');
        }
    }

    if (!partial || input.condition !== undefined) {
        const condition = asTrimmedString(input.condition) || 'Good';
        if (!CONDITIONS.has(condition)) {
            throw new StoreError('VALIDATION', 'Condition must be New, Good, Fair, or Poor.');
        }
        device.condition = condition;
    }

    if (!partial || input.status !== undefined) {
        const status = asTrimmedString(input.status) || 'Available';
        if (!STATUSES.has(status)) {
            throw new StoreError('VALIDATION', 'Status must be Available or Assigned.');
        }
        device.status = status;
    }

    if (!partial || input.notes !== undefined) {
        const notes = input.notes == null ? '' : asTrimmedString(input.notes);
        device.notes = notes;
    }

    return device;
}

class DeviceStore {
    constructor() {
        this.reset();
    }

    reset() {
        this.devices = new Map();
        this.nextId = 1;
    }

    list() {
        return Array.from(this.devices.values()).map((device) => ({ ...device }));
    }

    get(id) {
        const device = this.devices.get(String(id));
        return device ? { ...device } : null;
    }

    create(input) {
        const data = normaliseDeviceInput(input);
        this.assertUniqueSerial(data.serialNumber);

        const device = {
            id: String(this.nextId++),
            ...data
        };
        this.devices.set(device.id, device);
        return { ...device };
    }

    update(id, input) {
        const existing = this.devices.get(String(id));
        if (!existing) {
            throw new StoreError('NOT_FOUND', 'Device not found.');
        }

        const data = normaliseDeviceInput(input, { partial: true });
        if (data.serialNumber) {
            this.assertUniqueSerial(data.serialNumber, existing.id);
        }

        const updated = { ...existing, ...data };
        this.devices.set(existing.id, updated);
        return { ...updated };
    }

    delete(id) {
        return this.devices.delete(String(id));
    }

    assertUniqueSerial(serialNumber, ignoreId) {
        const wanted = serialNumber.toLowerCase();
        for (const device of this.devices.values()) {
            if (device.id === ignoreId) {
                continue;
            }
            if (device.serialNumber.toLowerCase() === wanted) {
                throw new StoreError('CONFLICT', 'Serial number already exists.');
            }
        }
    }
}

module.exports = { DeviceStore, StoreError, CONDITIONS, STATUSES };
