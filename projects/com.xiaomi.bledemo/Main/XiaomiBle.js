/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * 
 * hmpace.watch.v1
 * 
 */

'use strict';

import { Bluetooth, BluetoothEvent, Device } from "miot";
import Host from "miot/Host";
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from "react-native";
import CommonCell from './CommonCell';
import { IBluetoothLock } from "miot";


let bt = Device.getBluetoothLE();
const DEMOCHAR = '00000001-0000-1000-8000-00805f9b34fb';
let status_enable = false;
export default class MainPage extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            did: Device.deviceID,
            chars: {},
            services: [],
            buttonText: Device.mac,
            isEnable: false,
            log: ''
        }
    }

    componentDidMount() {
        this.showing = true;

        Bluetooth.checkBluetoothIsEnabled().then(result => {
            this.state.isEnable = result;
            if (result) {
                this.addLog("蓝牙已开启")
                this.connect();
            } else {
                this.addLog("蓝牙未开启，请检查开启蓝牙后再试")
                Host.ui.showBLESwitchGuide();
            }
        });
        this._s5 = BluetoothEvent.bluetoothStatusChanged.addListener((data) => {
            console.log("bluetoothStatusChanged", data);
            if (!data) {
                this.addLog("蓝牙状态发生变化 ： " + JSON.stringify(data))
            }
        });
        this._s1 = BluetoothEvent.bluetoothSeviceDiscovered.addListener((blut, services) => {
            if (services.length <= 0) { return }
            console.log("bluetoothSeviceDiscovered", blut.mac, services.map(s => s.UUID), bt.isConnected)
            this.addLog("蓝牙服务发现完成：\n" + JSON.stringify(services.map(s => s.UUID)))

            let s = services.map(s => { return { uuid: s.UUID, char: [] } })
            this.setState({
                services: s
            })
            if (bt.isConnected) {
                this.addLog("开始扫描特征值")
                services.forEach(s => {
                    this.state.services[s.UUID] = s;
                    s.startDiscoverCharacteristics()
                })
            }
            Device.getBluetoothLE().getVersion(true, true).then(version => {
                var data = Device.getBluetoothLE().securityLock.decryptMessageWithToken(version).then(data => {
                    console.log("设备版本为：" + data);
                    this.addLog("设备版本为：" + version);
                })
            }).catch(err => {
                console.log(err, '-------');
            });
        })
        this._s2 = BluetoothEvent.bluetoothCharacteristicDiscovered.addListener((bluetooth, service, characters) => {
            console.log("bluetoothCharacteristicDiscovered", characters.map(s => s.UUID), bt.isConnected);
            // this.addLog("蓝牙特征值发现：\n" + JSON.stringify(characters.map(s => s.UUID)))
            this.setState({ buttonText: service.UUID + "\n CharacteristicDiscovered" })
            let services = this.state.services;
            for (let i in services) {
                if (services[i].uuid === service.UUID) {
                    services[i].char = characters.map(s => s.UUID)
                }
            }
            this.setState({ services })
            if (bt.isConnected) {
                characters.forEach(c => {
                    this.state.chars[c.UUID] = c;
                })
            }
        })
        this._s3 = BluetoothEvent.bluetoothCharacteristicValueChanged.addListener((bluetooth, service, character, value) => {
            if (service.UUID.indexOf("ffd5") > 0) {
                console.log("bluetoothCharacteristicValueChanged", character.UUID, value);//刷新界面
            }
            this.addLog("bluetoothCharacteristicValueChanged:" + character.UUID + ">" + value)
        })
        this._s4 = BluetoothEvent.bluetoothSeviceDiscoverFailed.addListener((blut, data) => {
            console.log("bluetoothSeviceDiscoverFailed", data);
            this.setState({ buttonText: "bluetoothSeviceDiscoverFailed :" + data });
        })
        this._s5 = BluetoothEvent.bluetoothCharacteristicDiscoverFailed.addListener((blut, data) => {
            console.log("bluetoothCharacteristicDiscoverFailed", data);
            this.setState({ buttonText: "bluetoothCharacteristicDiscoverFailed:" + data })
        })
        this._s6 = BluetoothEvent.bluetoothConnectionStatusChanged.addListener((blut, isConnect) => {
            console.log("bluetoothConnectionStatusChanged", blut, isConnect);
            this.setState({ buttonText: "bluetoothConnectionStatusChanged:" + isConnect });
            if (bt.mac === blut.mac && !isConnect) {
                this.setState({ chars: {} });
            }
        })
    }

    componentWillUnmount() {
        this.showing = false;
        if (bt.isConnected) {
            bt.disconnect();
            console.log("disconnect");
        }
        this._s1.remove();
        this._s2.remove();
        this._s3.remove();
        this._s4.remove();
        this._s5.remove();
        this._s6.remove();
    }

    /**
     * 更新固件后重新链接设备
     */
    update() {
        Bluetooth.startScan(30000, "1000000-0000-0000-00000000000");//扫描指定设备
        BluetoothEvent.bluetoothDeviceDiscovered.addListener((result) => {
            bt = Bluetooth.createBluetoothLE(result.uuid || result.mac);//android 用 mac 创建设备，ios 用 uuid 创建设备
            // this.connect();
        })
    }

    connect() {
        this.addLog("准备开始蓝牙连接")
        if (bt.isConnected) {
            // bt.getVersion(true, true).then(version => {
            //     this.addLog("设备版本为：" + version);
            // }).then(err => {
            //     console.log(err, '-------');
            // });
            console.log();
            this.addLog("蓝牙设备已经连接")
            this.addLog("开始发先服务")
            bt.startDiscoverServices();
        } else if (bt.isConnecting) {
            this.addLog("蓝牙正处于连接中，请等待连接结果后再试")
        } else {
            bt.connect(-1).then((data) => {
                bt.startDiscoverServices();
            }).catch((data) => {
                this.addLog("ble connect failed: " + JSON.stringify(data))
                if (data.code === -7) {
                    Bluetooth.retrievePeripheralsWithServicesForIOS('serviceid1', 'serviceid2').then(res => {
                        //在这里可以获取到已经连接的蓝牙对象，小米协议设备返回-7，大几率是本身已经连接，在这里可以选择
                        // 1. 获取到蓝牙的uuid，通过普通蓝牙对象操作
                        /**
                         * let ble = Bluetooth.createBluetoothLE(result.uuid || result.mac)
                         * ble.connect(3).then(...)
                         */
                        // 2. 获取到蓝牙uuid， 之后disconnect， 随后再使用小米协议的拦截方式
                        /**
                         * let ble = Bluetooth.createBluetoothLE(result.uuid || result.mac)
                         * ble.disconnect()
                         * ble.connect(-1).then(...)
                         */
                    })
                }
            });
        }
    }

    checkBluetoothIsEnabled() {
        Bluetooth.checkBluetoothIsEnabled().then(yes => {
            status_enable = yes;
            this.setState({ buttonText: "checkBluetoothIsEnabled " + yes })
        })
    }

    enableBluetoothForAndroid() {
        Bluetooth.enableBluetoothForAndroid(!status_enable);
    }

    addLog(string) {
        let log = this.state.log;
        log += "\n" + string;
        this.setState({ log })
    }

    render() {
        return (
            <View style={styles.container}>
                <ScrollView>
                    {
                        this.state.services.map((val, index) => {
                            return (
                                <View key={index} style={{ marginTop: 20 }}>
                                    <Text style={[{ backgroundColor: 'white' }]}>service: {val.uuid}</Text>
                                    {
                                        val.char.map((v, i) => {
                                            return (<CommonCell
                                                title={"char: " + v}
                                            />)
                                        })
                                    }

                                </View>

                            )
                        })
                    }
                </ScrollView>
                <ScrollView>
                    <Text style={styles.log}>
                        {this.state.log}
                    </Text>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        backgroundColor: '#999999',
        marginBottom: 0,
        marginTop: 0,
    }, text: {
        flex: 1,
        fontSize: 20,
        textAlign: 'center',
        color: '#000000',
        alignSelf: 'stretch',
        marginTop: 300,
    }, log: {
        flex: 1,
        fontSize: 15,
        textAlign: 'center',
        color: '#000000',
        alignSelf: 'stretch',
    },
    testText: {
        color: '#000000cc',
        fontSize: 15,
        textAlignVertical: 'center',
        textAlign: 'center',
    },
})

const KEY_OF_MAINPAGE = 'MainPage';
