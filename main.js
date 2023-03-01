const { createBluetooth } = require('node-ble')
const { bluetooth, destroy } = createBluetooth();

const PRIMARY_SERVICE_UUID = '19b10000-0000-537e-4f6c-d104768a1214';
const DEVICE_ADDRESS = '71:5D:4D:33:3C:06';

(async () => {
    function sliceIntoChunks(buffer, chunkSize) {
        const res = [];
        for (let i = 0; i < buffer.length; i += chunkSize) {
            const chunk = buffer.slice(i, i + chunkSize);
            res.push(chunk);
        }
        return res;
    }
    
    const NiclaCharacteristics = [
        {
            uuid: '19b10000-2001-537e-4f6c-d104768a1214',
            properties: ['BLERead'],
            structure: ['Float32'],
            data: { temperature: [] },
            dataFunction: (buffer) => Buffer.from(buffer).readFloatLE(),
            label: 'temperature'
        },
        {
            uuid: '19b10000-3001-537e-4f6c-d104768a1214',
            properties: ['BLERead'],
            structure: ['Uint8'],
            data: { humidity: [] },
            dataFunction: (buffer) => Buffer.from(buffer).readUInt8(),
            label: 'humidity'
        },
        {
            uuid: '19b10000-4001-537e-4f6c-d104768a1214',
            properties: ['BLERead'],
            structure: ['Float32'],
            data: { pressure: [] },
            dataFunction: (buffer) => Buffer.from(buffer).readFloatLE(),
            label: 'pressure'
        },
        {
            uuid: '19b10000-9002-537e-4f6c-d104768a1214',
            properties: ['BLERead'],
            structure: ['Float32'],
            data: { monoxide: [] },
            dataFunction: (buffer) => Buffer.from(buffer).readUint32LE(),
            label: 'carbon monoxide'
        },
        {
            uuid: '19b10000-9001-537e-4f6c-d104768a1214',
            properties: ['BLERead'],
            structure: ['Float32'],
            data: { quality: [] },
            dataFunction: (buffer) => Buffer.from(buffer).readFloatLE(),
            label: 'air quality'
        },
    ]
    const adapter = await bluetooth.defaultAdapter();
    if (! await adapter.isDiscovering()) {
        await adapter.startDiscovery()
    }
    /* setTimeout(async () => {
        const devices = await adapter.devices();
        for( const device of devices) {
            const bluetoothDevice = await adapter.waitDevice(device);
            const deviceName = await bluetoothDevice.getName();
            const gattServ = await device.gatt();
            const primaryService = gattServ.getPrimaryService(PRIMARY_SERVICE_UUID);
        }
        console.log(devices);
    }, 10000); */
    console.log('WAIT DEVICE');
    const device = await adapter.waitDevice(DEVICE_ADDRESS);
    console.log('WAIT NAME');
    const name = await device.getName();
    console.log(name);
    console.log('WAIT CONNECT');
    await device.connect();
    console.log('WAIT GATT SERVER');
    const gattServer = await device.gatt();
    console.log('WAIT SERVICES');
    const services = await gattServer.services();

   /*  const otherService = await gattServer.getPrimaryService('00001801-0000-1000-8000-00805f9b34fb');
    console.log(otherService);
    const characteristics1 = await otherService.characteristics();
    console.log(characteristics1); */



    console.log(services);
    console.log('WAIT SERVICES 1');
    const service1 = await gattServer.getPrimaryService(PRIMARY_SERVICE_UUID);
    console.log('WAIT characteristics');
    const characteristics = await service1.characteristics();
    console.log(characteristics);


    for (const dataConfing of NiclaCharacteristics) {
        console.log('WAIT characteristic ' + dataConfing.label);
        const characteristic = await service1.getCharacteristic(dataConfing.uuid);
        if (!characteristic) {
            console.log('No characteristic');
            continue;
        }
        const bufferValue = await characteristic.readValue();
        if (!bufferValue) {
            console.log('No Value');
            continue;
        }
        try {
            console.log('Buffer', bufferValue);
            const test = dataConfing.dataFunction(bufferValue);
            console.log(`${dataConfing.label}: ${test}`);
        } catch (error) {
            console.log(error);
        }

    }

    const ledCharacteristic = await service1.getCharacteristic('19b10000-8001-537e-4f6c-d104768a1214');
    let color = Buffer.from([0xFF, 0xFF, 0xFF]);
    let res = await ledCharacteristic.writeValue(color);
    color = Buffer.from([0x0, 0x0, 0xFF]);
    res = await ledCharacteristic.writeValue(color);
    color = Buffer.from([0x0, 0xFF, 0x0]);
    res = await ledCharacteristic.writeValue(color);
    color = Buffer.from([0xFF, 0x0, 0x0]);
    res = await ledCharacteristic.writeValue(color);
    color = Buffer.from([0x0, 0x0, 0x0]);
    res = await ledCharacteristic.writeValue(color);

    
    /* console.log('WAIT characteristic 1');
    const characteristic1 = await service1.getCharacteristic('19b10000-2001-537e-4f6c-d104768a1214');
    console.log(characteristic1);
    console.log('WAIT characteristic VALUE');
    const buffer = await characteristic1.readValue()
    console.log(buffer);
    try {
        console.log(buffer.readFloatLE());
        const test = Buffer.from(buffer);
        console.log(test);
    } catch (error) {

    }
    const flags = await characteristic1.getFlags();
    console.log(flags); */

    /* const characteristic2 = await service1.getCharacteristic('19b10000-6001-537e-4f6c-d104768a1214');
    console.log('START NOTIFICATIONS');
    await characteristic2.startNotifications();
    characteristic2.on('valuechanged', buffer => {
        console.log('VALUE CHANGED', sliceIntoChunks(buffer, 4), buffer.length);
        const bufferArray = sliceIntoChunks(buffer, 4);
        const values = [];
        for(const bufferValue of bufferArray) {
            values.push(bufferValue.readFloatLE());
        }
        console.log(values);
        
    });
    await new Promise(r => setTimeout(r, 5000));
    console.log('WAIT STOP');
    await characteristic2.stopNotifications()
 */


    console.log('WAIT DISCONNECT');
    await device.disconnect();
    destroy();


})();