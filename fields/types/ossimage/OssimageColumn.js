import React from 'react';
import CloudinaryImageSummary from '../../components/columns/CloudinaryImageSummary';
import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';

var OssImageColumn = React.createClass({
	displayName: 'OssImageColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
	renderValue (value) {
		if (!value || !Object.keys(value).length) return;

		return <CloudinaryImageSummary image={value} />;

	},
	render () {
		const value = this.props.data.fields[this.props.col.path];
		return (
			<ItemsTableCell>
				<ItemsTableValue field={this.props.col.type}>
					{this.renderValue(value)}
				</ItemsTableValue>
			</ItemsTableCell>
		);
	},
});

module.exports = OssImageColumn ;
