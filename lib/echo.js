// Connect to a peripheral running the echo service
// https://github.com/noble/bleno/blob/master/examples/echo

// subscribe to be notified when the value changes
// start an interval to write data to the characteristic

//const noble = require('noble');
const noble = require('noble')

const ECHO_SERVICE_UUID = 'ffe0';
const ECHO_CHARACTERISTIC_UUID = 'a5a3';

noble.on('stateChange', state => {
    if (state === 'poweredOn') {
        console.log('Scanning');
        noble.startScanning([ECHO_SERVICE_UUID]);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', peripheral => {
    // connect to the first peripheral that is scanned
    noble.stopScanning();
    const name = peripheral.advertisement.localName;
    console.log(`Connecting to '${name}' ${peripheral.id}`);
    connectAndSetUp(peripheral);
});

function connectAndSetUp(peripheral) {

    peripheral.connect(error => {
        console.log('Connected to', peripheral.id);

        // specify the services and characteristics to discover
        const serviceUUIDs = [ECHO_SERVICE_UUID];
        const characteristicUUIDs = [ECHO_CHARACTERISTIC_UUID];

        peripheral.discoverSomeServicesAndCharacteristics(
            serviceUUIDs,
            characteristicUUIDs,
            onServicesAndCharacteristicsDiscovered
        );
    });

    peripheral.on('disconnect', () => console.log('disconnected'));
}

function onServicesAndCharacteristicsDiscovered(error, services, characteristics) {
    console.log('Discovered services and characteristics');
    console.log(error, services, characteristics)
    const echoCharacteristic = characteristics[0];

    // data callback receives notifications
    echoCharacteristic.on('data', (data, isNotification) => {
        console.log('Received: "' + data + '"');
    });

    // subscribe to be notified whenever the peripheral update the characteristic
    echoCharacteristic.subscribe(error => {
        if (error) {
            console.error('Error subscribing to echoCharacteristic');
        } else {
            console.log('Subscribed for echoCharacteristic notifications');
        }
    });

    // create an interval to send data to the service
    let count = 0;
    setInterval(() => {
        count++;
        const message = new Buffer('hello, ble ' + count, 'utf-8');
        console.log("Sending:  '" + message + "'");
        echoCharacteristic.write(message);
    }, 2500);
}