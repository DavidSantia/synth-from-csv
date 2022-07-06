import React from 'react';
import PropTypes from 'prop-types';
import {NerdGraphMutation} from 'nr1';

// export const MonitorMutate = React.forwardRef((props, ref) => {
//   const makeMonitor = (obj, update) => {
//     console.log('Button pressed:', update)
//     console.log('Executing GraphQl mutations to create monitor', obj.name);
//   };
//   ref.current = makeMonitor;
//   //return <Mutate obj={obj} />;
//   return 'Awaiting generation';
// })

export default class MonitorMutate extends React.Component {
  static propTypes = {
    update: PropTypes.bool.isRequired,
    obj: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
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
