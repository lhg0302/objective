/**
 * Created by Layman(http://github.com/anysome) on 16/3/2.
 */

import React from 'react';
import {View, Text, Modal, StyleSheet, ScrollView, TouchableOpacity, Image} from 'react-native';
import Button from 'react-native-button';
import moment from 'moment';

import {analytics, styles, colors, airloy, api, L, toast, hang} from '../../app';
import util from '../../libs/Util';
import TextArea from '../../widgets/TextArea';
import EventTypes from '../../logic/EventTypes';


export default class Anything extends React.Component {

  constructor(props) {
    super(props);
    let {visible} = props;
    this._input = null;
    if (typeof visible === 'undefined') {
      visible = true;
    }
    this.state = {
      input: '',
      tip: '添加事项到今日待办, 保存点击今日',
      btn: 'today',
      modalVisible: visible,
      pin: false
    };
    this._saveToday = this._saveToday.bind(this);
    this._saveTomorrow = this._saveTomorrow.bind(this);
    this._saveInbox = this._saveInbox.bind(this);
    this._saveHabit = this._saveHabit.bind(this);
    this._saveAction = this._saveAction.bind(this);
    this._saveTime = this._saveTime.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({modalVisible: true});
  }

  _btnPress(btn) {
    let tip, callback;
    switch (btn) {
      case 'tomorrow':
        tip = '添加事项到明日待办, 保存点击明日';
        callback = this._saveTomorrow;
        break;
      case 'inbox':
        tip = '添加事项到备忘, 保存点击备忘';
        callback = this._saveInbox;
        break;
      case 'habit':
        tip = '创建每日习惯检查单, 保存点击习惯';
        callback = this._saveHabit;
        break;
      case 'action':
        tip = '创建百次行动计划, 保存点击行动';
        callback = this._saveAction;
        break;
      case 'time':
        tip = '创建一万小时目标, 保存点击计时';
        callback = this._saveTime;
        break;
      default :
        tip = '添加事项到今日待办, 保存点击今日';
        callback = this._saveToday;
    }
    this._saveOrChange(btn, tip, callback);
  }

  _saveOrChange(btn, tip, callback) {
    if (btn === this.state.btn) {
      if (this._input.value.length < 1) {
        this._input.focus();
        return;
      }
      let lr = this._input.value.indexOf('\n');
      let title, detail;
      if (lr > 0) {
        title = this._input.value.substr(0, lr);
        detail = this._input.value.substr(lr + 1);
      } else {
        title = this._input.value;
      }
      hang();
      callback(title, detail);
      hang(false);
      analytics.onEvent('click_add_anything');
    } else {
      this.setState({
        btn: btn,
        tip: tip
      });
    }
  }

  async _saveToday(title, detail) {
    let agenda = {
      title: title,
      detail: detail,
      today: new Date()
    };
    let result = await airloy.net.httpPost(api.agenda.add, agenda);
    if (result.success) {
      airloy.event.emit(EventTypes.agendaAdd, result.info);
      this._cleanCloseOrContinuous(`"${title}" 已添加.`);
    } else {
      alert(L(result.message));
    }
  }

  async _saveTomorrow(title, detail) {
    let agenda = {
      title: title,
      detail: detail,
      today: moment().add(1, 'days').toDate()
    };
    let result = await airloy.net.httpPost(api.agenda.add, agenda);
    if (result.success) {
      airloy.event.emit(EventTypes.agendaAdd, result.info);
      this._cleanCloseOrContinuous(`"${title}" 已添加.`);
    } else {
      alert(L(result.message));
    }
  }

  async _saveInbox(title, detail) {
    let chore = {
      title: title,
      detail: detail
    };
    let result = await airloy.net.httpPost(api.chore.add, chore);
    if (result.success) {
      airloy.event.emit('chore.add', result.info);
      this._cleanCloseOrContinuous(`"${title}" 已添加.`);
    } else {
      alert(L(result.message));
    }
  }

  async _saveHabit(title, detail) {
    var days = 90;
    var endDay = moment().add(days - 1, 'days');
    var target = {
      title: title,
      detail: detail ? detail : '#习惯养成#',
      dateStart: new Date(),
      dateEnd: endDay.toDate(),
      priority: 1,
      frequency: '1',
      requiredAmount: 1,
      unit: '0',
      type: '1'
    };
    let result = await airloy.net.httpPost(api.target.add, target);
    if (result.success) {
      airloy.event.emit(EventTypes.targetChange, result.info);
      airloy.event.emit(EventTypes.agendaChange);
      this._cleanCloseOrContinuous(`"${title}" 已添加.`);
    } else {
      alert(L(result.message));
    }
  }

  async _saveAction(title, detail) {
    let target = {
      title: title,
      detail: detail ? detail : '#百次行动#',
      dateStart: new Date(),
      dateEnd: moment().add(300, 'days').toDate(),
      priority: 2,
      frequency: '4',
      requiredAmount: 100,
      unit: '0',
      type: '4'
    };
    let result = await airloy.net.httpPost(api.target.add, target);
    if (result.success) {
      airloy.event.emit(EventTypes.targetChange, result.info);
      this._cleanCloseOrContinuous(`"${title}" 已添加.`);
    } else {
      alert(L(result.message));
    }
  }

  async _saveTime(title, detail) {
    let target = {
      title: title,
      detail: detail ? detail : '#梦想时分#',
      dateStart: new Date(),
      dateEnd: moment().add(1000, 'days').toDate(),
      priority: 3,
      frequency: '4',
      requiredAmount: 1000,
      unit: '1',
      type: '5'
    };
    let result = await airloy.net.httpPost(api.target.add, target);
    if (result.success) {
      airloy.event.emit(EventTypes.targetChange, result.info);
      this._cleanCloseOrContinuous(`"${title}" 已添加.`);
    } else {
      alert(L(result.message));
    }
  }

  _onClose() {
    this.setState({modalVisible: false});
    this.props.onClose();
  }

  _cleanCloseOrContinuous(message) {
    if (this.state.pin) {
      this.setState({
        input: '',
        tip: message
      });
    } else {
      this.setState({
        input: '',
        modalVisible: false
      });
      this.props.onClose();
      toast(message);
    }
  }

  _pin() {
    let tip = this.state.pin ? '' : '保持窗口, 方便连续添加事项';
    this.setState({
      pin: !this.state.pin,
      tip: tip
    });
  }

  render() {
    return (
      <View style={styles.flex}>
        <Modal animationType='slide' transparent={false} onRequestClose={()=>this._onClose()} visible={this.state.modalVisible}>
          <ScrollView style={styles.modal} keyboardDismissMode='on-drag' keyboardShouldPersistTaps>
            <View style={style.body}>
                <TextArea
                  ref={(c)=> this._input = c}
                  defaultValue={this.state.input}
                  onChangeText={text => this.setState({input:text})}
                  placeholder="想做什么..."
                  autoFocus={true}/>
              <View style={style.pin}>
                <TouchableOpacity activeOpacity={0.5} onPress={() => this._pin()}>
                  <Image source={require('../../../resources/icons/pin.png')} style={{tintColor: this.state.pin ? colors.accent : colors.bright2}} />
                </TouchableOpacity>
                <Text style={style.hint}>{this.state.tip}</Text>
              </View>

              <View style={styles.containerA}>
                <Button style={styles.buttonText} onPress={()=>this._btnPress('today')}
                        activeOpacity={0.7}
                        containerStyle={[style.round,
                          {backgroundColor: this.state.btn === 'today' ? colors.action : colors.accent}]}>今日</Button>
                <Button style={styles.buttonText} onPress={()=>this._btnPress('tomorrow')}
                        activeOpacity={0.7}
                        containerStyle={[style.round,
                          {backgroundColor: this.state.btn === 'tomorrow' ? colors.action : colors.accent}]}>明日</Button>
                <Button style={styles.buttonText} onPress={()=>this._btnPress('inbox')}
                        activeOpacity={0.7}
                        containerStyle={[style.round,
                          {backgroundColor: this.state.btn === 'inbox' ? colors.action : colors.accent}]}>备忘</Button>
              </View>
              <View style={styles.containerA}>
                <Button style={styles.buttonText} onPress={()=>this._btnPress('habit')}
                        activeOpacity={0.7}
                        containerStyle={[style.round,
                          {backgroundColor: this.state.btn === 'habit' ? colors.action : colors.accent}]}>习惯</Button>
                <Button style={styles.buttonText} onPress={()=>this._btnPress('action')}
                        activeOpacity={0.7}
                        containerStyle={[style.round,
                          {backgroundColor: this.state.btn === 'action' ? colors.action : colors.accent}]}>行动</Button>
                <Button style={styles.buttonText} onPress={()=>this._btnPress('time')}
                        activeOpacity={0.7}
                        containerStyle={[style.round,
                          {backgroundColor: this.state.btn === 'time' ? colors.action : colors.accent}]}>计时</Button>
              </View>

              <Button style={styles.buttonText} onPress={()=>this._onClose()}
                      containerStyle={style.button}>
                取消
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </View>
    );
  }
}

const style = StyleSheet.create({
  round: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    marginTop: 10,
    overflow: 'hidden',
    borderRadius: 30,
    backgroundColor: colors.accent
  },
  pin: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 4
  },
  hint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: colors.dark2
  },
  body: {
    paddingTop: util.isAndroid() ? 20 : 30,
    paddingLeft: 16,
    paddingRight: 16
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height:40,
    marginTop: 20,
    marginBottom: 10,
    overflow:'hidden',
    borderRadius: 5,
    backgroundColor: colors.border
  }
});
