import React, {PropTypes} from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';

export default class PrintArea extends React.Component {

  static PropTypes = {
    doc: PropTypes.object.isRequired
  };

  componentDidMount() {
    // wait for tooltip to disappear
    setTimeout(() => {
      window.print();
    }, 2000);
  }

  shouldComponentUpdate = shouldPureComponentUpdate;

  render() {

    let content = this.props.doc.pages.map(page => page.content).join('');

    return (
      <div className="print-area">{content}</div>
    );
  }
}
