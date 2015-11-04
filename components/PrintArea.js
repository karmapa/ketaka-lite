import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';


export default class PrintArea extends React.Component {

  static PropTypes = {
    print: PropTypes.bool.isRequired,
    doc: PropTypes.object.isRequired
  };

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    return (
      <div className="print-area">
        {this.renderPages()}
      </div>
    );
  }

  renderPages() {
    let {doc, print} = this.props;

    if (! doc) {
      return '';
    }

    if (! print) {
      return '';
    }

    return doc.pages.map(page => {
      return <p className="page">{page.content}</p>;
    });
  }
}
