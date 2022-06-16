import React from 'react';
import PropTypes from 'prop-types';
import {
  AccountStorageMutation,
  AccountStorageQuery,
  Button,
  Card,
  CardBody,
  HeadingText,
  Modal,
  Select,
  SelectItem
} from 'nr1';

export default class ConfigFrequency extends React.Component {
  static propTypes = {
    accountId: PropTypes.number.isRequired,
    update: PropTypes.func.isRequired,
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
    this.name2freq = {
      'EVERY_MINUTE': 1,
      'EVERY_5_MINUTES': 5,
      'EVERY_10_MINUTES': 10,
      'EVERY_15_MINUTES': 15,
      'EVERY_30_MINUTES': 30,
      'EVERY_HOUR': 60,
      'EVERY_6_HOURS': 360,
      'EVERY_12_HOURS': 720,
      'EVERY_DAY': 1440,
    }
    this.state = {
      hidden: true,
      statuses: {
        'Key Customer': 1,
        'Customer': 5,
        'Prospect': 10,
      },
      toUpdate: {},
    };
    this.onSelectFrequency = this.onSelectFrequency.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
  }

  componentDidMount() {
    // load frequency map from NerdStorage
    AccountStorageQuery.query({accountId: this.props.accountId, collection: 'status2frequency', documentId: 'current'})
      .then(({data}) => {
        if (data) {
          var statuses = {};
          if (Object.keys(data).length > 0) {
            for (const [label, value] of Object.entries(data)) {
              statuses[label] = this.name2freq[value]
            }
            this.setState({statuses});
          }
        }
      });
  }

  onSelectFrequency(label, value) {
    let {statuses, toUpdate} = this.state;
    if (statuses[label] === value) {
      delete toUpdate[label]
    } else {
      toUpdate[label] = value
    }
    this.setState({toUpdate});
  }

  onCancel() {
    // make no changes, clear values to update
    this.setState({hidden: true, toUpdate: {}});
  }

  onUpdate() {
    // Apply updates to statuses
    let {statuses, toUpdate} = this.state;
    if (Object.keys(toUpdate).length > 0) {
      for (const [label, value] of Object.entries(toUpdate)) {
        statuses[label] = value;
      }
    }

    // persist with NerdStorage
    var data = {};
    for (const [label, value] of Object.entries(statuses)) {
      data[label] = this.freq2name[value];
    }
    AccountStorageMutation.mutate({
      accountId: this.props.accountId,
      actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: 'status2frequency',
      documentId: 'current',
      document: data,
    }).then(function () {
      console.log('Wrote AccountStorage:', Object.keys(statuses).length, 'account statuses mapped to frequencies');
    });

    // save new frequency selections, clear values to update
    this.setState({hidden: true, statuses, toUpdate: {}});
    // refresh settings tab
    this.props.update();
  }

  render() {
    const {toUpdate, statuses} = this.state;
    return (
      <div>
        <Button onClick={() => this.setState({hidden: false})}>
          Configure Frequencies
        </Button>
        <Modal hidden={this.state.hidden} onClose={this.onCancel}>
          <HeadingText type={HeadingText.TYPE.HEADING_3}>Select frequency for each status</HeadingText>
          {Object.entries(statuses).map(item => <Card>
            <CardBody>
              <Select label={item[0]} value={toUpdate[item[0]] ? toUpdate[item[0]] : item[1]}
                      onChange={(event, value) => this.onSelectFrequency(item[0], value)}>
                {Object.entries(this.name2freq).map(entry => <SelectItem value={parseInt(entry[1])}>{entry[0]}</SelectItem>)}
              </Select>
            </CardBody>
          </Card>)}
          <br/>
          &nbsp;&nbsp;<Button onClick={this.onUpdate}>Apply</Button>
        </Modal>
      </div>
    )
  }
}
