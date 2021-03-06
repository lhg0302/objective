/**
 * Created by Layman(http://github.com/anysome) on 16/3/9.
 */
import React from 'react';
import {View, Text, StyleSheet, Modal, TouchableWithoutFeedback, Image} from 'react-native';
import Button from 'react-native-button';

import {analytics, styles, colors, px1, airloy, api, L, toast, hang} from '../../app';
import EventTypes from '../../logic/EventTypes';
import TextField from '../../widgets/TextField';
import TextArea from '../../widgets/TextArea';

export default class Punch extends React.Component {

  constructor(props) {
    super(props);
    this.target = props.data;
    this.state = {
      output: props.data.unit === '0' ? '1' : '',
      remark: '',
      tip: '记录一下...'
    };
    this._output = null;
  }

  async _commit() {
    if (this.state.output) {
      let increasement = parseInt(this.state.output);
      hang();
      let result = await airloy.net.httpGet(api.target.punch, {
        id: this.target.id,
        amount: increasement,
        remark: this.state.remark
      });
      hang(false);
      if (result.success) {
        toast('太给力了!');
        this.setState({
          output: '',
          remark: ''
        });
        airloy.event.emit(EventTypes.agendaChange);
        airloy.event.emit(EventTypes.targetChange);
        this.target.doneAmount = this.target.doneAmount + increasement;
        this.target.doneTotal = this.target.doneTotal +increasement;
        this.target.roundTotal = this.target.roundTotal + increasement;
        this.props.onFeedback(this.target);
      } else {
        toast(L(result.message));
      }
      analytics.onEvent('click_check_punch');
    } else {
      this.setState({output: '1'});
      this._output.focus();
    }
  }

  render() {
    return (
      <Modal animationType='slide'  transparent={true} onRequestClose={() => this.props.onFeedback()} visible={this.props.visible}>
        <View style={style.container}>
          <Text style={style.title}>{this.props.data.title}</Text>
                    <TextArea placeholder={this.state.tip}
                              defaultValue={this.state.remark}
                              onChangeText={text => this.setState({remark: text})}/>
          <View style={style.bar}>
            <TextField style={style.input}
                       ref={c => this._output = c}
                       placeholder='新增完成数'
                       defaultValue={this.state.output}
                       keyboardType='number-pad'
                       onChangeText={text => this.setState({output: text})}/>
            <Button
              style={styles.buttonText}
              containerStyle={styles.button}
              activeOpacity={0.5}
              onPress={()=>this._commit()}>
              <Image source={require('../../../resources/icons/checked.png')} style={{tintColor: 'white'}} />  打卡
            </Button>
          </View>
        </View>
        <TouchableWithoutFeedback onPress={() => this.props.onFeedback()}>
          <View style={style.bg}/>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }
}

const style = StyleSheet.create({
  container: {
    height: 220,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 30,
    paddingBottom: 16,
    backgroundColor: colors.bright1
  },
  title: {
    paddingTop: 4,
    paddingBottom: 4,
    color: colors.dark1,
    fontSize: 18
  },
  input: {
    flex: 1,
    marginRight: 16,
    marginTop: 5,
    borderWidth: px1,
    borderColor: colors.bright2
  },
  icon: {
    marginRight: 16
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bg: {
    flex: 1,
    backgroundColor: 'black',
    opacity: 0.3
  }
});
