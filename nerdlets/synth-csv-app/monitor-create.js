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
    var updateMap = {tags: {}};
    var updates = [];
    var tagMap = {};
    var status = 'Monitor exists, '

    for (const tag of entity.tags) {
      tagMap[tag.key] = tag.values;
    }
    // check URL
    if (obj.uri !== entity.monitoredUrl) {
      updates.push('change URL: ' + obj.uri)
      updateMap.uri = true;
    }
    // check period
    if (tagMap.period?.length === 1) {
      if (obj.period !== this.freq2name[tagMap.period[0]]) {
        updates.push('change period: ' + obj.period)
        updateMap.period = true;
      }
    }
    // check locations
    if (tagMap.publicLocation?.length > 0) {
      var addLocations = [];
      var removeLocations = [];
      for (const label of obj.locationLabels) {
        if (!tagMap.publicLocation.includes(label)) {
          addLocations.push(label)
        }
      }
      for (const label of tagMap.publicLocation) {
        if (!obj.locationLabels.includes(label)) {
          removeLocations.push(label)
        }
      }
      if (addLocations.length > 0) {
        updates.push('add locations: ' + JSON.stringify(addLocations))
      }
      if (removeLocations.length > 0) {
        updates.push('remove locations: ' + JSON.stringify(removeLocations))
      }
    }
    // check tags
    var addTags = [];
    var removeTags = [];
    for (const tag of obj.tags) {
      if (tagMap[tag.key]) {
        if (!tagMap[tag.key].includes(tag.values[0])) {
          addTags.push(tag.key + ':' + tag.values[0]);
          updateMap.tags[tag.key] = true;
        }
        for (const value of tagMap[tag.key]) {
          if (value !== tag.values[0]) {
            removeTags.push(tag.key + ':' + value);
            updateMap.tags[tag.key] = true;
          }
        }
      } else {
        addTags.push(tag.key + ':' + tag.values[0]);
        updateMap.tags[tag.key] = true;
      }
    }
    if (addTags.length > 0) {
      updates.push('add tags: ' + JSON.stringify(addTags))
    }
    if (removeTags.length > 0) {
      updates.push('remove tags: ' + JSON.stringify(removeTags))
    }

    if (updates.length === 0) {
      status += 'nothing to do';
    } else {
      status += 'Awaiting update to ' + updates.join(', ');
    }
    return [status, updateMap];
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
        var updateMap;
        // Get existing monitor attributes
        if (entity) {
          [status, updateMap] = this.compareMonitor(obj, entity);
          //console.log('Monitor exists:', JSON.stringify(entity, null, 4))
          console.log('To update:', JSON.stringify(updateMap));
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