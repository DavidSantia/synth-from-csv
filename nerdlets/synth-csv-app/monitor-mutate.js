import React from 'react';
import PropTypes from 'prop-types';
import {NerdGraphMutation, NerdGraphQuery} from 'nr1';
import locations from "./locations";

export default class MonitorMutate extends React.Component {
  static propTypes = {
    update: PropTypes.bool.isRequired,
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
    this.labelMap = {};
    this.locationMap = {};
    for (const continent of Object.keys(locations.obj)) {
      for (const item of locations.obj[continent]) {
        this.locationMap[item.label] = item.location
        this.labelMap[item.location] = item.label
      }
    }
    this.state = {
      awaiting: true,
      status: 'Awaiting generation',
    };
  }

  componentDidMount() {
    const {obj, update} = this.props;
    //this.makeMonitor(obj);
    if (update) {
      console.log('Button was pressed, generating', obj.name)
    }
  }

  makeMonitor(obj) {
    const searchMonitor = `query ($name: String!, $accountId: String!) {
      actor {
        entitySearch(queryBuilder: {domain: SYNTH, name: $name, tags: {key: "accountId", value: $accountId}}) {
          results {entities { ... on SyntheticMonitorEntityOutline {guid monitoredUrl name tags { key values }}}}
        }
      }
    }`
    const createMonitor = `mutation ($name: String!, $accountId: Int!, $period: SyntheticsMonitorPeriod!, $locations: [String], $uri: String!) {
      syntheticsCreateSimpleBrowserMonitor(accountId: $accountId, monitor: {
        name: $name,
        status: DISABLED,
        period: $period,
        locations: {public: $locations},
        uri: $uri,
        runtime: {runtimeType: "CHROME_BROWSER", runtimeTypeVersion: "100", scriptLanguage: "JAVASCRIPT"}
      }) {
        errors { description }
        monitor { guid }
      }
    }`
    const tagMonitor = `mutation ($guid: EntityGuid!, $tags: [TaggingTagInput!]!) {
      taggingAddTagsToEntity(guid: $guid, tags: $tags) {
        errors {
          message
          type
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
        // Get existing monitor attributes
        if (entity) {
          this.compareMonitor(obj, entity);
          //console.log('Monitor exists:', JSON.stringify(entity, null, 4))
        }
      })

    return;

    //console.log(createMonitor);
    //console.log('Variables:', JSON.stringify(obj));
    NerdGraphMutation.mutate({mutation: createMonitor, variables: obj})
      .then(result => {
        const data = result.data.syntheticsCreateSimpleBrowserMonitor;
        if (data.errors.length > 0) {
          for (const error of data.errors) {
            messages.push(error.__typename + ': ' + error.description)
          }
          status = messages.join(", ");
          this.setState({status});
        } else {
          const guid = data.monitor.guid;
          const vars = {guid: guid, tags: obj.tags}
          messages.push('Success, guid: ' + guid)
          //console.log(tagMonitor);
          //console.log('Variables:', JSON.stringify(vars));
          NerdGraphMutation.mutate({mutation: tagMonitor, variables: vars})
            .then(result => {
              const errors = result.data.taggingAddTagsToEntity.errors;
              if (errors.length > 0) {
                for (const error of errors) {
                  messages.push(error.__typename + ': ' + error.description)
                }
              }
              status = messages.join(", ");
              this.setState({status});
            });
        }
      });
  }

  render() {
    const {awaiting, status} = this.state;
    const {obj, update} = this.props;
    if (awaiting && update) {
      console.log('Generating', obj.name)
      this.setState({awaiting: false})
      this.makeMonitor(obj);
    }
    return status;
  }
}
