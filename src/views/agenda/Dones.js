/**
 * Created by Layman(http://github.com/anysome) on 16/5/14.
 */
import React from 'react';
import {StyleSheet, View, ListView, Text, RefreshControl, TouchableOpacity, Image, InteractionManager} from 'react-native';
import moment from 'moment';

import {analytics, airloy, styles, colors, api, toast, L} from '../../app';
import ListSource from '../../logic/ListSource';
import ListSectionView from '../../widgets/ListSectionView';
import Edit from './Edit';

export default class Dones extends React.Component {

  constructor(props) {
    super(props);
    this.listSource = null;
    this.circleDay = null;
    this.state = {
      isRefreshing: true,
      dataSource: new ListView.DataSource({
        getSectionHeaderData: (dataBlob, sectionId) => dataBlob[sectionId],
        getRowData: (dataBlob, sectionId, rowId) => dataBlob[sectionId].getRow(rowId),
        rowHasChanged: (row1, row2) => row1 !== row2,
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2
      })
    };
    this._renderRow = this._renderRow.bind(this);
  }

  componentWillUnmount() {
    analytics.onPageEnd('page_dones');
  }

  componentDidMount() {
    analytics.onPageStart('page_dones');
    InteractionManager.runAfterInteractions(() => this.reload());
  }

  async reload() {
    this.setState({
      isRefreshing: true
    });
    let result = await airloy.net.httpGet(api.agenda.list.done);
    if (result.success) {
      this.listSource = new ListSource(result.info);
      this._sortList();
      this.setState({
        isRefreshing: false
      });
    } else {
      result.message !== 'error.request.auth' && this.setState({
        isRefreshing: false
      });
      toast(L(result.message));
    }
    console.log(' load content list');
  }

  _sortList() {
    let sectionIds = [];
    let sections = [];
    let count = 0, currentSection = null;
    for (let rowData of this.listSource) {
      if ( rowData.today !== this.circleDay ) {
        this.circleDay = rowData.today;
        currentSection = new ListSectionView.DataSource({id: count, name: moment(this.circleDay).format('YYYY-MM-DD')});
        sections.push(currentSection);
        sectionIds.push(count++);
      }
      currentSection.push(rowData);
    }
    this.setState({
      dataSource: this.state.dataSource.cloneWithRowsAndSections(
        sections,
        sectionIds,
        sections.map( section => section.rowIds)
      )
    });
  }

  _renderRow(rowData, sectionId, rowId) {
    return (
      <TouchableOpacity style={style.container} onPress={() => this._pressRow(rowData)}>
        <Image source={require('../../../resources/icons/checked.png')} style={styles.iconSmall} />
        <View style={style.body}>
          <Text style={styles.title}>{rowData.title}</Text>
          <Text style={style.hint} numberOfLines={1}>{rowData.detail}</Text>
        </View>
        <Text style={style.text}>{moment(rowData.doneTime).format('H:mm')}</Text>
      </TouchableOpacity>
    );
  }

  _pressRow(rowData) {
    this.props.navigator.push({
      title: '查看',
      component: Edit,
      passProps: {
        today: this.today,
        data: rowData
      }
    });
  }

  _renderSectionHeader(sectionData, sectionId) {
    return <ListSectionView data={sectionData}/>;
  }

  _renderSeparator(sectionId, rowId, adjacentRowHighlighted) {
    return <View key={rowId + '_separator'} style={styles.hr}></View>
  }

  render() {
    return (
      <View style={styles.flex}>
        <ListView
          enableEmptySections={true}
          initialListSize={10}
          pageSize={10}
          dataSource={this.state.dataSource}
          renderRow={(rowData, sectionId, rowId) => this._renderRow(rowData, sectionId, rowId)}
          renderSectionHeader={this._renderSectionHeader}
          renderSeparator={this._renderSeparator}
          refreshControl={
                          <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={() => this.reload()}
                            tintColor={colors.accent}
                            title={'加载中...'}
                            colors={[colors.accent, colors.action]}
                            progressBackgroundColor={colors.bright1}
                          />}
        />
      </View>
    );
  }
}


const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  body: {
    flex: 1,
    marginLeft: 10,
    marginRight: 5
  },
  hint: {
    marginTop: 2,
    textAlign: 'left',
    fontSize: 12,
    color: colors.border
  },
  text: {
    color: colors.dark2,
    fontSize: 14
  },
});
