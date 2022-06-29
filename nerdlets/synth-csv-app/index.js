import React from 'react';
import { AccountStorageQuery, Button, Spinner, Tabs, TabsItem } from 'nr1';
import { FilePicker } from 'react-file-picker';
import { parse } from 'csv-parse';
import ConfigLocale from './config-locale';
import ConfigFrequency from "./config-frequency";
import ConfigTags from "./config-tags";
import Generate from "./generate";

const AccountId = YOUR_ACCOUNT_ID_HERE;

// Generate bulk Synthetics monitors from CSV configuration
export default class SynthCsvAppNerdlet extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      fileName: null,
      records: [],
      update: false,
    };
  }

  fileParse(selectedFile) {
    var records = [];
    const reader = new FileReader();
    const parser = parse({delimiter: ','});

    this.setState({fileName: selectedFile.name});
    parser.on('readable', function(){
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    parser.on('error', (err) => alert(err.message));
    parser.on('end', () => {
      console.log('Parsed', records.length, 'rows');
      this.setState({records})
    });
    reader.onload = () => {
      parser.write(reader.result);
      parser.end();
    }
    reader.readAsText(selectedFile);
  }

  makeTable(rows) {
    var table = (<table><tr>No data</tr></table>);
    if (rows && rows.length > 0) {
      table = (
        <table>
          <thead>
          <tr>
            {rows[0].map((item) => {
              return <th>{item}</th>;
            })}
          </tr>
          </thead>
          <tbody>
          {rows.slice(1, rows.length).map((row) => {
            return (
              <tr>
                {row.map((item) => {
                  return <td>{item}</td>;
                })}
              </tr>
            );
          })}
          </tbody>
        </table>
      );
    }
    return table;
  }

  render() {
    const {records, fileName} = this.state;
    var headings = [];
    if (records.length > 0) {
      headings = records[0];
    }

    return (
      <Tabs defaultValue="tab1">
        <TabsItem value="tab1" label="Import">
          <h1>Selected file: {fileName}</h1>
          <FilePicker
            extensions={['csv']}
            onChange={fileObj => this.fileParse(fileObj)}
            onError={errMsg => alert(errMsg)}
          >
            <Button>
              Upload CSV file
            </Button>
          </FilePicker>
          <h1>Rows: {records.length}</h1>
          {this.makeTable(records)}
        </TabsItem>
        <TabsItem value="tab2" label="Settings">
          <ConfigLocale accountId={AccountId} update={() => this.setState({update: true})}/>
          <ConfigFrequency accountId={AccountId} update={() => this.setState({update: true})}/>
          <ConfigTags accountId={AccountId} headings={headings} update={() => this.setState({update: true})}/>
          <br />
          <h1>Locale Map</h1>
          <AccountStorageQuery accountId={AccountId} collection="locale2locations" documentId="current">
            {({ loading, error, data }) => {
              if (loading) {
                return <Spinner />;
              }
              if (error) {
                return 'Error!';
              }
              return <pre>{JSON.stringify(data, null, 2)}</pre>;
            }}
          </AccountStorageQuery>
          <h1>Account Status Map</h1>
          <AccountStorageQuery accountId={AccountId} collection="status2frequency" documentId="current">
            {({ loading, error, data }) => {
              if (loading) {
                return <Spinner />;
              }
              if (error) {
                return 'Error!';
              }
              return <pre>{JSON.stringify(data, null, 2)}</pre>;
            }}
          </AccountStorageQuery>
          <h1>Tag Map</h1>
          <AccountStorageQuery accountId={AccountId} collection="tagmap" documentId="current">
            {({ loading, error, data }) => {
              if (loading) {
                return <Spinner />;
              }
              if (error) {
                return 'Error!';
              }
              return <pre>{JSON.stringify(data, null, 2)}</pre>;
            }}
          </AccountStorageQuery>
        </TabsItem>
        <TabsItem value="tab3" label="Generate">
          <Generate records={records} accountId={AccountId} />
        </TabsItem>
      </Tabs>
    );
  }
}
