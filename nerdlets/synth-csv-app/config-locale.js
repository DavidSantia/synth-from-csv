import React from 'react';
import PropTypes from 'prop-types';
import {
  AccountStorageMutation,
  AccountStorageQuery,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Dropdown,
  DropdownItem,
  HeadingText,
  Modal
} from 'nr1';
import countries from './countries';
import locations from './locations';

// Settings tab configuration for locales
export default class ConfigLocale extends React.Component {
  static propTypes = {
    accountId: PropTypes.number.isRequired,
    update: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    var locationList = [];
    for (const continent of Object.keys(locations.obj)) {
      locationList.push(...locations.obj[continent]);
    }
    this.state = {
      hidden: true,
      code: 'INT',
      name: 'International - all',
      locationList: locationList,
      toUpdate: {},
      locales: {},
      checkboxes: [],
    };
    this.onCheckbox = this.onCheckbox.bind(this);
    this.onSelectCountry = this.onSelectCountry.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
  }

  componentDidMount() {
    const {locationList} = this.state;
    // load locale map from NerdStorage
    AccountStorageQuery.query({accountId: this.props.accountId, collection: 'locale2locations', documentId: 'current'})
      .then(({data}) => {
        if (!data) {
          data = {}
        }
        const locs = data[this.state.code];
        var checkboxes = [];
        if (locs) {
          // Load previous checkbox settings
          for (const item of locationList) {
            if (locs.includes(item.label)) {
              checkboxes.push(item.idx)
            }
          }
        }
        this.setState({locales: data, checkboxes})
      });
  }

  onCheckbox(event, values) {
    this.setState({checkboxes: values});
  }

  onSelectCountry(country) {
    const {code, locales, locationList} = this.state;
    var {toUpdate} = this.state;

    // store current checkbox updates
    toUpdate[code] = [...this.state.checkboxes];

    // load previous checkbox settings
    var checkboxes = [];
    if (toUpdate[country.code]) {
      // Restore un-applied changes
      checkboxes = toUpdate[country.code];
    } else {
      const locs = locales[country.code];
      if (locs) {
        // Restore previous checkbox settings
        for (const item of locationList) {
          if (locs.includes(item.label)) {
            checkboxes.push(item.idx)
          }
        }
      }
    }
    // save new country selection and updates, and restore previous checkboxes
    this.setState({code: country.code, name: country.name, toUpdate, checkboxes});
  }

  onCancel() {
    const {code, locales, locationList} = this.state;
    var checkboxes = [];

    // restore checkbox settings from locales object, make no changes
    const locs = locales[code];
    if (locs) {
      for (const item of locationList) {
        if (locs.includes(item.label)) {
          checkboxes.push(item.idx)
        }
      }
    }
    this.setState({hidden: true, toUpdate: {}, checkboxes});
  }

  onUpdate() {
    const {code, locationList} = this.state;
    var {toUpdate} = this.state;
    // store current checkbox updates
    toUpdate[code] = [...this.state.checkboxes];

    // save updated settings to locales object
    var locales = Object.assign({}, this.state.locales);
    for (const [code, checkboxes] of Object.entries(toUpdate)) {
      var locs = [];
      for (var checkbox of checkboxes) {
        locs.push(locationList[parseInt(checkbox)].label)
      }
      if (locs.length > 0) {
        locales[code] = locs;
      } else {
        delete locales[code];
      }
    }

    // persist with NerdStorage
    AccountStorageMutation.mutate({
      accountId: this.props.accountId,
      actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: 'locale2locations',
      documentId: 'current',
      document: locales,
    }).then(function () {
      console.log('Wrote AccountStorage:', Object.keys(locales).length, 'locales mapped to locations');
    });
    this.setState({hidden: true, locales, toUpdate: {}});
    // refresh settings tab
    this.props.update();
  }

  render() {
    const {checkboxes, code, hidden, name} = this.state;

    return (
      <div>
        <Button onClick={() => this.setState({hidden: false})}>
          Configure Locations
        </Button>
        <Modal hidden={hidden} onClose={this.onCancel}>
          <HeadingText type={HeadingText.TYPE.HEADING_3}>Select locations for each locale</HeadingText>
          <br/>
          <Card>
            <Dropdown title={code + ' [' + name + ']'}>
              {countries.list.map(country =>
                <DropdownItem onClick={() => this.onSelectCountry(country)}>
                  {country.code + ' [' + country.name + ']'}
                </DropdownItem>)}
            </Dropdown>
            <CardBody>
              {Object.keys(locations.obj).map(continent =>
                <CheckboxGroup value={checkboxes} onChange={this.onCheckbox} label={continent}>
                  {locations.obj[continent].map(location => <Checkbox value={location.idx} label={location.label}/>)}
                  <br/>
                </CheckboxGroup>
              )}
            </CardBody>
          </Card>
          <br/>
          <Button onClick={this.onUpdate}>Apply</Button>
        </Modal>
      </div>
    )
  }
}
