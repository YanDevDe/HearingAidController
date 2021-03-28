const noble = require("noble");
const async = require('async');

const serviceUUIDs = ["7d74f4bdc74a4431862ccce884371592"];


noble.on('stateChange', function (state) {
    if (state === 'poweredOn') {
        noble.startScanning(serviceUUIDs);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function (peripheral) {
    //noble.stopScanning();

    console.log('peripheral with ID ' + peripheral.id + ' found');
    var advertisement = peripheral.advertisement;

    var localName = advertisement.localName;
    var txPowerLevel = advertisement.txPowerLevel;
    var manufacturerData = advertisement.manufacturerData;
    var serviceData = advertisement.serviceData;
    var serviceUuids = advertisement.serviceUuids;

    if (localName) {
        console.log('  Local Name        = ' + localName);
    }

    if (txPowerLevel) {
        console.log('  TX Power Level    = ' + txPowerLevel);
    }

    if (manufacturerData) {
        console.log('  Manufacturer Data = ' + manufacturerData.toString('hex'));
    }

    if (serviceData) {
        console.log('  Service Data      = ' + JSON.stringify(serviceData, null, 2));
    }

    if (serviceUuids) {
        console.log('  Service UUIDs     = ' + serviceUuids);
    }

    explore(peripheral);
});

async function explore(peripheral) {
    console.log('services and characteristics:');

    peripheral.on('disconnect', function () {
        console.log("peripheral.disconnect");
    });

    peripheral.connect(function (error) {
        console.log("peripheral.connect", error);
        peripheral.discoverServices(["7d74f4bdc74a4431862ccce884371592", "8341f2b4c0134f048197c4cdb42e26dc"], async (error, services) => {
            var serviceIndex = 0;
            let characterVolume = null;
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                const characteristics = await discoverCharacteristicsPromise(service, ["4603580d3c154fec93beb86b243ada64", "76b3db1f44c446cca7b5e9ce7dfbef50", "0188bf66463a405d91fd0b8940b92254"])

                for (let j = characteristics.length - 1; j >= 0; j--) {
                    const characteristic = characteristics[j];
                    //await characteristicReadPromise(characteristic);
                    //let buf = Buffer.allocUnsafe(1);
                    //buf.writeUInt8(3);
                    //await characteristicWritePromise(characteristic, buf, true);
                    // await sleep(3000);
                    const data = await characteristicReadPromise(characteristic);
                    console.log(characteristic._serviceUuid, characteristic.uuid, data);
                    //if (characteristic.uuid === "0188bf66463a405d91fd0b8940b92254") {
                    //    break;
                    //}

                    if (characteristic.uuid === "4603580d3c154fec93beb86b243ada64") {
                        characterVolume = characteristic;
                    }
                }
            }
            if (characterVolume) {
                await sleep(3000);
                const buff = Buffer.from("c0ffee", "hex");
                const val = await characteristicWritePromise(characterVolume, buff, true);
                console.log("VOLUME WRITED TO", buff, val);
                const data = await characteristicReadPromise(characterVolume);
                console.log(characterVolume._serviceUuid, characterVolume.uuid, data);
            }

            /*
            for (let i = 0; i < services.length; i++) {
                console.log("?", i, "/", services.length); //stuck after 5
                const service = services[i];
                let serviceInfo = service.uuid;
                if (service.name) {
                    serviceInfo += ' (' + service.name + ')';
                }
                const characteristics = await discoverCharacteristicsPromise(service, [])
                console.log(characteristic);

                if (characteristics === "timeout") {
                    console.log("[dService]", serviceInfo, "--->", "timeout");
                } else {
                    for (let j = 0; j < characteristics.length; j++) {
                        var characteristic = characteristics[j];
                        characteristic.subscribe();
                        characteristic.broadcast(true);
                        characteristic.notify(true);
                        var characteristicInfo = characteristic.uuid;

                        if (characteristic.name) {
                            characteristicInfo += ' (' + characteristic.name + ')';
                        }
                        console.log("[dCharacteristics]", serviceInfo, "-", characteristicInfo);
                        const descriptors = await discoverDescriptorsPromise(characteristic);
                        try {
                            const characteristicData = await characteristicReadPromise(characteristic);
                            console.log("=======================================================");
                            console.log();
                            console.log("   ├──ServiceInfo UUID:", serviceInfo);
                            console.log("   ├──Characteristic Properties: ", characteristic.properties);
                            console.log("   ├──Characteristic UUID:", characteristicInfo);

                            if (descriptors === "timeout") {
                                console.log("   ├──Descriptors [TIMEOUT]")
                            } else {
                                if (descriptors.length > 0) {
                                    console.log("   ├──Descriptors Count:", descriptors.length);
                                }

                                for (let m = 0; m < descriptors.length; m++) {
                                    let descriptorsLog = "";
                                    const descriptor = descriptors[m];
                                    let descriptorInfo = descriptor.uuid;
                                    await sleep(500);
                                    const descriptorData = await descriptorReadPromise(descriptor);
                                    if (descriptor.name) {
                                        descriptorInfo += ' (' + descriptor.name + ')';
                                    }
                                    if (descriptor.type) {
                                        descriptorInfo += ' [' + descriptor.type + ']';
                                    }
                                    if (descriptor.length - 1 == m) {
                                        descriptorsLog += "        └──[" + (m + 1) + ".] " + descriptorInfo
                                    } else {
                                        descriptorsLog += "        ├──[" + (m + 1) + ".] " + descriptorInfo
                                    }
                                    console.log(descriptorsLog)

                                    if (descriptorData === "timeout") {
                                        console.log("             └──TIMEOUT")
                                    } else {
                                        if (descriptorData.length <= 6 && descriptorData.length >= 1) {
                                            console.log("             ├──Buffer:", descriptorData)
                                            console.log("             ├──UTF8:", descriptorData.toString("utf8"))
                                            console.log("             └──Number:", descriptorData.readUIntBE(0, descriptorData.length))
                                        } else {
                                            console.log("             ├──Buffer:", descriptorData)
                                            console.log("             └──UTF8:", descriptorData.toString("utf8"))
                                        }
                                    }
                                }
                            }
                            if (characteristicData === "timeout") {
                                console.log("   └──Characteristic Data [TIMEOUT]");
                            } else {
                                console.log("   └──Characteristic Data");
                                if (characteristicData.length <= 6 && characteristicData.length >= 1) {
                                    console.log("        ├──Buffer:", characteristicData)
                                    console.log("        ├──UTF8:", characteristicData.toString("utf8"))
                                    console.log("        ├──readIntBE:", characteristicData.readIntBE(0, characteristicData.length))
                                    console.log("        ├──readIntLE:", characteristicData.readIntLE(0, characteristicData.length))
                                    console.log("        ├──readUIntBE:", characteristicData.readUIntBE(0, characteristicData.length))
                                    console.log("        └──readUIntLE:", characteristicData.readUIntLE(0, characteristicData.length))
                                } else {
                                    console.log("        ├──Buffer:", characteristicData)
                                    console.log("        └──UTF8:", characteristicData.toString("utf8"))
                                }
                            }
                            console.log();
                            //if (characteristic.uuid === "4603580d3c154fec93beb86b243ada64") {
                            //    let buf = Buffer.allocUnsafe(1);
                            //    buf.writeUInt8(254);
                            //    console.log("--------CHANGE VOLUME TO ", buf);
                            //    characteristic.once('write', (state) => {
                            //        console.log("WRITE", state);
                            //    });
                            //    await characteristicWritePromise(characteristic, buf, true);
                            //}



                            characteristic.on('broadcast', (state) => {
                                console.log("BROADCAST", state);
                            });
                            characteristic.on('data', (state) => {
                                console.log("DATA", state);
                            });

                            characteristic.on('NOTIFY', (state) => {
                                console.log("NOTIFY", state);
                            });


                        } catch (e) {
                            console.log("[err] characteristicWritePromise", e);
                        }
                        await sleep(1000);
                    }
                }

            }*/

            console.log("End of brute-force");
        });
    });
}


async function discoverCharacteristicsPromise(service, characteristicUUIDs = []) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            return resolve("timeout")
        }, 4000)
        service.discoverCharacteristics(characteristicUUIDs, function (error, characteristics) {
            clearTimeout(timeout);
            if (error) {
                return reject(error);
            }
            return resolve(characteristics)
        });
    })
}

async function discoverDescriptorsPromise(characteristic) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            return resolve("timeout")
        }, 4000)
        characteristic.discoverDescriptors(function (error, descriptors) {
            clearTimeout(timeout);
            if (error) {
                return reject(error);
            }
            return resolve(descriptors)
        });
    })
}

async function descriptorReadPromise(descriptor) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            return resolve("timeout")
        }, 4000)
        descriptor.readValue(function (error, data) {
            clearTimeout(timeout);
            if (error) {
                console.log("readValue Error", error);
                return reject(error);
            }
            return resolve(data)
        });
    })
}

async function characteristicReadPromise(characteristic) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            return resolve("timeout")
        }, 4000)
        characteristic.read(function (error, data) {
            clearTimeout(timeout);
            if (error) {
                return reject(error);
            }
            return resolve(data)
        });
    })
}

async function characteristicWritePromise(characteristic, buff, withoutResponse) {
    return new Promise((resolve, reject) => {
        characteristic.write(buff, withoutResponse, (error) => {
            if (error) {
                reject(error);
            }
            resolve();
        })
    });
}

async function sleep(n) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, n)
    })
}