import React from 'react';
import PropTypes from 'prop-types';

import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';

class BasesTable extends React.Component {

  state = {checked: null};

  handleToggle = index => () => {
    const {props: {onToggle, rows, multi}, state: {checked}}  = this;
    (onToggle ? onToggle(rows[index], checked !== index) : Promise.resolve())
      .then(() => !multi && this.setState({checked: checked === index ? null : index}));
  };

  render() {
    const {title, rows, check, toolbar, className} = this.props;

    return <div className={className}>
      <Typography key="title">{title}</Typography>
      {toolbar}
      <List key="list">
        {rows.map((value, index) => (
          <ListItem
            key={`i-${index}`}

            button
            onClick={this.handleToggle(index)}
            disabled={value.disabled}
          >

            {
              check && <Checkbox
                checked={value.checked || this.state.checked === index}
                tabIndex={-1}
                disableRipple
              />
            }

            {typeof value === 'string' && <ListItemText primary={value} />}

            {typeof value === 'object' && <ListItemText
              primary={value.name}
              secondary={Array.isArray(value.value) ? value.value.join(', ') : value.value}
            />}

          </ListItem>
        ))}
      </List>
    </div>;
  }
}

BasesTable.propTypes = {
  onToggle: PropTypes.func,
  rows: PropTypes.array,
  multi: PropTypes.bool,
  check: PropTypes.bool,
  title: PropTypes.string,
  className: PropTypes.string,
  toolbar: PropTypes.node,
};

export default BasesTable;
