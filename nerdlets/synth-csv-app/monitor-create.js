import React from 'react';
import PropTypes from 'prop-types';
import {NerdGraphQuery} from 'nr1';

// Find monitor entities to see if update or generate is needed
export default class MonitorCreate extends React.Component {
  static propTypes = {
    obj: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.freq2name = {
      '1': 'EVERY_MINUTE',
      '5': 'EVERY_5_MINUTES',
      '10': 'EVERY_10_MINUTES',
      '15': 'EVERY_15_MINUTES',
      '30': 'EVERY_30_MINUTES',
      '60': 'EVERY_HOUR',
      '360': 'EVERY_6_HOURS',
      '720': 'EVERY_12_HOURS',
      '1440': 'EVERY_DAY',
    }
    this.state = {
      status: 'Searching...',
    };
  }

  componentDidMount() {
    const {obj} = this.props;
    this.searchMonitor(obj);
  }

  compareMonitor(obj, entity) {
    var updates = [];
    var tagMap = {};
    var status = 'Monitor exists, '

    for (const tag of entity.tags) {
      tagMap[tag.key] = tag.values;
    }
    if (obj.uri !== entity.monitoredUrl) {
      updates.push('change URL: ' + obj.uri)
    }
    if (tagMap.period?.length === 1) {
      if (obj.period !== this.freq2name[tagMap.period[0]]) {
        updates.push('change period: ' + obj.period)
      }
    }
    if (tagMap.publicLocation?.length > 0) {
      var adding = [];
      var removing = [];
      for (const label of obj.locationLabels) {
        if (!tagMap.publicLocation.includes(label)) {
          adding.push(label)
        }
      }
      for (const label of tagMap.publicLocation) {
        if (!obj.locationLabels.includes(label)) {
          removing.push(label)
        }
      }
      if (adding.length > 0) {
        updates.push('add locations: ' + JSON.stringify(adding))
      }
      if (removing.length > 0) {
        updates.push('remove locations: ' + JSON.stringify(removing))
      }
    }
    if (updates.length === 0) {
      status += 'nothing to do';
    } else {
      status += 'Awaiting update to ' + updates.join(', ');
    }
    console.log('Obj Tags:', JSON.stringify(obj.tags))
    console.log('Entity Tags:', JSON.stringify(tagMap))

    return status;
  }

  searchMonitor(obj) {
    const searchMonitor = `query ($name: String!, $accountId: String!) {
      actor {
        entitySearch(queryBuilder: {domain: SYNTH, name: $name, tags: {key: "accountId", value: $accountId}}) {
          results {entities { ... on SyntheticMonitorEntityOutline {guid monitoredUrl name tags { key values }}}}
        }
      }
    }`
    var status;
    var messages = [];

    NerdGraphQuery.query({query: searchMonitor, variables: {name: obj.name, accountId: obj.accountId.toString()}})
      .then(result => {
        const entities = result.data.actor.entitySearch.results.entities;
        // Find monitor with exact same name
        for (const entity of entities) {
          if (entity.name === obj.name) {
            return entity;
          }
        }
        return null;
      })
      .then(entity => {
        var status;
        // Get existing monitor attributes
        if (entity) {
          status = this.compareMonitor(obj, entity);
          //console.log('Monitor exists:', JSON.stringify(entity, null, 4))
        } else {
          status = 'Awaiting generation'
        }
        this.setState({status});
      })
  }

  render() {
    const {status} = this.state;
    return status;
  }
}