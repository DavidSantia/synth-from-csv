import React from 'react';
import PropTypes from 'prop-types';
import {AccountStorageQuery, AccountStorageMutation, Button, Card, CardBody, Checkbox, CheckboxGroup, HeadingText, Modal} from 'nr1';

export default class ConfigTags extends React.Component {
  static propTypes = {
    accountId: PropTypes.number.isRequired,
    headings: PropTypes.array.isRequired,
    update: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props);
    this.state = {
      hidden: true,
      tagMap: {},
      checkboxes: [],
    };
    this.onCheckbox = this.onCheckbox.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
  }

  camelize(str) {
    return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  componentDidMount() {
    const {headings, accountId} = this.props;
    // load tag list from NerdStorage
    AccountStorageQuery.query({accountId: accountId, collection: 'tagmap', documentId: 'current'})
      .then(({data}) => {
        if (data && headings.length > 0) {
          // aggregate list of all headings
          var tagMap = Object.assign({}, data);
          for (const heading of headings) {
            const key = this.camelize(heading);
            if (!tagMap[key]) {
              tagMap[key] = {enabled: false, heading: heading}
            }
          }
          // save aggregated list
          AccountStorageMutation.mutate({
            accountId: accountId,
            actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
            collection: 'tagmap',
            documentId: 'current',
            document: tagMap,
          }).then(() => {
            // initialize checkboxes
            var checkboxes = [];
            for (const [idx, key] of Object.entries(Object.keys(tagMap))) {
              if (tagMap[key].enabled) {
                checkboxes.push(idx)
              }
            }
            this.setState({tagMap, checkboxes});
          });
        }
      });
  }

  onCheckbox(event, values) {
    this.setState({ checkboxes: values });
  }

  onCancel() {
    // reset checkbox settings, make no changes
    const {tagMap} = this.state;
    var checkboxes = [];
    for (const [idx, key] of Object.entries(Object.keys(tagMap))) {
      if (tagMap[key].enabled) {
        checkboxes.push(idx)
      }
    }
    this.setState({ hidden: true, checkboxes});
  }

  onUpdate() {
    const {headings, accountId} = this.props;
    const {checkboxes} = this.state;
    if (headings.length === 0) {
      this.setState({hidden: true});
      return
    }

    // save updated settings to tagMap object
    var tagMap = Object.assign({}, this.state.tagMap);
    const current = Object.keys(tagMap);
    // clear all enables
    for (const key of current) {
      tagMap[key].enabled = false;
    }
    // enable for checkbox list
    for (const idx of checkboxes) {
      tagMap[current[idx]].enabled = true;
    }

    // persist with NerdStorage
    AccountStorageMutation.mutate({
      accountId: accountId,
      actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: 'tagmap',
      documentId: 'current',
      document: tagMap,
    }).then(function () {
      console.log('Wrote AccountStorage:', checkboxes.length, 'tags mapped,', Object.keys(tagMap).length, 'headings total');
    });
    this.setState({hidden: true, tagMap});
    // refresh settings tab
    this.props.update();
  }

  render() {
    const {headings} = this.props;
    const {tagMap, checkboxes} = this.state;

    var body = <HeadingText spacingType={[HeadingText.SPACING_TYPE.LARGE]} type={HeadingText.TYPE.HEADING_3}>
        Please load a spreadsheet first
      </HeadingText>;
    if (headings.length > 0) {
      body = <CheckboxGroup value={checkboxes} onChange={this.onCheckbox} label="Available Headings">
        {Object.values(tagMap).map((item, idx) => <Checkbox value={idx.toString()} label={item.heading}/>)}
      </CheckboxGroup>;
    }

    return(
      <div>
        <Button onClick={() => this.setState({ hidden: false })}>
          Configure Tags
        </Button>
        <Modal hidden={this.state.hidden} onClose={this.onCancel}>
          <HeadingText type={HeadingText.TYPE.HEADING_2}>Select to include for tagging</HeadingText>
          <br/>
          <Card>
            <CardBody>
              {body}
            </CardBody>
          </Card>
          <br/>
          <Button onClick={this.onUpdate}>Apply</Button>
        </Modal>
      </div>
    )
  }
}
