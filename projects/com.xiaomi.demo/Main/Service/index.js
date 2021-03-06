'use strict';

import TitleBar from 'miot/ui/TitleBar';
import React from 'react';
import { Image, ListView, PixelRatio, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Service } from "miot";

export default class HostDemo extends React.Component {

  static navigationOptions = ({ navigation }) => {
    return {
      header: <TitleBar type='dark' title={navigation.state.params.title} style={{ backgroundColor: '#fff' }}
        onPressLeft={() => { navigation.goBack(); }} />,
    };
  };

  constructor(props) {
    super(props);
    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
    this._createMenuData();
    this.state = {
      dataSource: ds.cloneWithRows(this._menuData.map((o) => (o.name))),
    };
  }

  _createMenuData() {
    this._menuData = [
      {
        'name': '智能家庭接口模块-smarthome',
        'func': () => {
          this.props.navigation.navigate('callSmartHomeAPIDemo', { title: '智能家庭接口模块-smarthome' })
        }
      },
      {
        'name': '智能家庭接口模块-room',
        'func': () => {
          this.props.navigation.navigate('MHRoomDemo', { title: '智能家庭接口模块-room' })
        }
      }, {
        'name': 'miot-spec模块',
        'func': () => {
          this.props.navigation.navigate('MiotSpecDemo', { title: 'miot-spec模块' })
        }
      },
      {
        'name': '通用的米家后台API调用接口',
        'func': () => {
          Service.callSmartHomeAPI('/home/profiles', { uids: [Service.account.ID, '894158105'] })
            .then(res => alert(JSON.stringify(res)))
            .catch(e => alert(e));
        }
      },
      {
        'name': '通用的米家后台API调用接口(错误测试)',
        'func': () => {
          Service.callSmartHomeAPI('/xx/xx', {})
            .then(res => alert(JSON.stringify(res)))
            .catch(e => alert(e));
        }
      },
      {
        'name': 'callSpecificAPI',
        'func': () => {
          Service.callSpecificAPI('http://api.goseek.cn/Tools/holiday', 'get', { "date": "20191102" })
            .then(res => alert(JSON.stringify(res)))
            .catch(e => alert(JSON.stringify(e)));
        }
      }
    ];
  }

  componentWillUnmount() {

  }

  render() {
    return (
      <View style={styles.container}>
        <ListView style={styles.list} dataSource={this.state.dataSource} renderRow={this._renderRow.bind(this)} />
      </View>
    );
  }

  _renderRow(rowData, sectionID, rowID) {
    return (
      <TouchableHighlight underlayColor='#838383' onPress={() => this._pressRow(rowID)}>
        <View>
          <View style={styles.rowContainer}>
            <Text style={styles.title}>{rowData}</Text>
            <Image style={styles.subArrow} source={require("../../Resources/sub_arrow.png")} />
          </View>
          <View style={styles.separator}></View>
        </View>
      </TouchableHighlight>
    );
  }

  _pressRow(rowID) {
    this._menuData[rowID].func();
  }

};

var styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopColor: '#f1f1f1',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 0,
    marginTop: 0,
  },
  rowContainer: {
    height: 52,
    alignSelf: 'stretch',
    flexDirection: 'row',
    paddingLeft: 23,
    paddingRight: 23,
    alignItems: 'center',
    flex: 1,
  },
  list: {
    alignSelf: 'stretch',
  },

  title: {
    fontSize: 15,
    color: '#333333',
    alignItems: 'center',
    flex: 1,
  },
  subArrow: {
    width: 7,
    height: 14,
  },
  separator: {
    height: 1 / PixelRatio.get(),
    backgroundColor: '#e5e5e5',
    marginLeft: 20,
  }
});
