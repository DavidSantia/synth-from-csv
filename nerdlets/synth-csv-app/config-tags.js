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

  componentDidMount() {
    // load tag list from NerdStorage
    AccountStorageQuery.query({accountId: this.props.accountId, collection: 'tagmap', documentId: 'current'})
      .then(({data}) => {
        if (data) {
          this.setState({tagMap: data})
        }
      });
  }

  onCheckbox(event, values) {
    this.setState({ checkboxes: values });
  }

  onCancel() {
    // clear checkbox settings, make no changes
    this.setState({ hidden: true, toUpdate: {}, checkboxes: []});
  }

  camelize(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  onUpdate() {
    const {headings} = this.props;
    if (headings.length === 0) {
      this.setState({hidden: true});
      return
    }

    // save updated settings to tagMap object
    const current = Object.keys(this.state.tagMap);
    var tagMap = Object.assign({}, this.state.tagMap);
    for (const idx of this.state.checkboxes) {
      const key = this.camelize(headings[idx]);
      if (!current.includes(key)) {
        tagMap[key] = headings[idx];
      }
    }

    // persist with NerdStorage
    AccountStorageMutation.mutate({
      accountId: this.props.accountId,
      actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: 'tagmap',
      documentId: 'current',
      document: tagMap,
    }).then(function () {
      console.log('Wrote AccountStorage:', Object.keys(tagMap).length, 'tags mapped');
    });
    this.setState({hidden: true, tagMap, checkboxes: []});
    // refresh settings tab
    this.props.update();
  }

  render() {
    const {headings} = this.props;
    const values = Object.values(this.state.tagMap);

    var current = <p><i>None selected</i></p>;
    if (values.length > 0) {
      current = <ul>{Object.values(this.state.tagMap).map(value => <li>{value}</li>)}</ul>
    }

    var body = <HeadingText spacingType={[HeadingText.SPACING_TYPE.LARGE]} type={HeadingText.TYPE.HEADING_3}>
        Please load a spreadsheet first
      </HeadingText>;
    if (headings.length > 0) {
      body = <CheckboxGroup value={this.state.checkboxes} onChange={this.onCheckbox} label="Additional headings">
        {headings.map((heading, idx) => <Checkbox value={idx.toString()} label={heading}/>)}
      </CheckboxGroup>;
    }

    return(
      <div>
        <Button onClick={() => this.setState({ hidden: false })}>
          Configure Tags
        </Button>
        <Modal hidden={this.state.hidden} onClose={this.onCancel}>
          <HeadingText type={HeadingText.TYPE.HEADING_2}>Current headings</HeadingText>
          <Card>
            <CardBody>
              {current}
            </CardBody>
          </Card>
          <HeadingText type={HeadingText.TYPE.HEADING_2}>Select to include for tags</HeadingText>
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
