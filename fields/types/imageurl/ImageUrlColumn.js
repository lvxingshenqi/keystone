import React from 'react';
import CloudinaryImageSummary from '../../components/columns/CloudinaryImageSummary';
import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';

var UrlColumn = React.createClass({
	displayName: 'ImageUrlColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
	renderValue () {
		var value = this.props.data.fields[this.props.col.path];
		if (!value) return;

		// if the value doesn't start with a prototcol, assume http for the href
		var href = value;
		if (href && !/^(mailto\:)|(\w+\:\/\/)/.test(href)) {
			href = 'http://' + value;
		}

		// strip the protocol from the link if it's http(s)
		var label = value.replace(/^https?\:\/\//i, '');

		return (
			<ItemsTableValue padded exterior field={this.props.col.type}>
				<CloudinaryImageSummary label="dimensions" image={value} secure={this.props.col.field.secure} />
			</ItemsTableValue>
		);
	},
	render () {
		return (
			<ItemsTableCell>
				{this.renderValue()}
			</ItemsTableCell>
		);
	},
});

module.exports = UrlColumn;
