(function () {
    const form = document.getElementById('deviceForm');
    const formHeading = document.getElementById('form-heading');
    const submitButton = document.getElementById('submitButton');
    const cancelEdit = document.getElementById('cancelEdit');
    const banner = document.getElementById('status-banner');
    const tableBody = document.getElementById('device-table-body');

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function showBanner(message, isError) {
        banner.hidden = false;
        banner.textContent = message;
        banner.classList.toggle('banner-error', Boolean(isError));
    }

    function clearBanner() {
        banner.hidden = true;
        banner.textContent = '';
        banner.classList.remove('banner-error');
    }

    function formPayload() {
        return {
            deviceType: document.getElementById('deviceType').value,
            serialNumber: document.getElementById('serialNumber').value,
            condition: document.getElementById('condition').value,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value
        };
    }

    function resetForm() {
        form.reset();
        document.getElementById('deviceId').value = '';
        document.getElementById('condition').value = 'Good';
        document.getElementById('status').value = 'Available';
        formHeading.textContent = 'Add a device';
        submitButton.textContent = 'Add device';
        cancelEdit.hidden = true;
    }

    function enterEditMode(device) {
        document.getElementById('deviceId').value = device.id;
        document.getElementById('deviceType').value = device.deviceType;
        document.getElementById('serialNumber').value = device.serialNumber;
        document.getElementById('condition').value = device.condition;
        document.getElementById('status').value = device.status;
        document.getElementById('notes').value = device.notes || '';
        formHeading.textContent = 'Edit device';
        submitButton.textContent = 'Save changes';
        cancelEdit.hidden = false;
        document.getElementById('deviceType').focus();
    }

    async function readError(response) {
        try {
            const body = await response.json();
            return body.error || response.statusText;
        } catch {
            return response.statusText || 'Request failed.';
        }
    }

    async function loadDevices() {
        const response = await fetch('/api/devices');
        if (!response.ok) {
            throw new Error(await readError(response));
        }
        return response.json();
    }

    function renderStats(devices) {
        document.getElementById('totalDevices').textContent = String(devices.length);
        document.getElementById('availableDevices').textContent = String(
            devices.filter((device) => device.status === 'Available').length
        );
        document.getElementById('assignedDevices').textContent = String(
            devices.filter((device) => device.status === 'Assigned').length
        );
    }

    function renderTable(devices) {
        if (devices.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No devices yet.</td></tr>';
            return;
        }

        tableBody.innerHTML = devices.map((device) => `
            <tr>
                <td>${escapeHtml(device.deviceType)}</td>
                <td>${escapeHtml(device.serialNumber)}</td>
                <td>${escapeHtml(device.condition)}</td>
                <td>${escapeHtml(device.status)}</td>
                <td>${escapeHtml(device.notes || '')}</td>
                <td>
                    <button type="button" data-action="edit" data-id="${escapeHtml(device.id)}">Edit</button>
                    <button type="button" data-action="delete" data-id="${escapeHtml(device.id)}">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    async function refresh() {
        const devices = await loadDevices();
        renderStats(devices);
        renderTable(devices);
        return devices;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearBanner();

        const editingId = document.getElementById('deviceId').value;
        const url = editingId ? `/api/devices/${encodeURIComponent(editingId)}` : '/api/devices';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formPayload())
            });

            if (!response.ok) {
                throw new Error(await readError(response));
            }

            resetForm();
            await refresh();
            showBanner(editingId ? 'Device updated.' : 'Device added.');
        } catch (error) {
            showBanner(error.message, true);
        }
    });

    cancelEdit.addEventListener('click', () => {
        clearBanner();
        resetForm();
    });

    tableBody.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');

        try {
            if (action === 'edit') {
                const response = await fetch(`/api/devices/${encodeURIComponent(id)}`);
                if (!response.ok) {
                    throw new Error(await readError(response));
                }
                enterEditMode(await response.json());
                clearBanner();
                return;
            }

            if (action === 'delete') {
                if (!window.confirm('Delete this device?')) {
                    return;
                }
                const response = await fetch(`/api/devices/${encodeURIComponent(id)}`, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(await readError(response));
                }
                if (document.getElementById('deviceId').value === id) {
                    resetForm();
                }
                await refresh();
                showBanner('Device deleted.');
            }
        } catch (error) {
            showBanner(error.message, true);
        }
    });

    refresh().catch((error) => {
        showBanner(error.message || 'Could not load devices.', true);
    });
})();
