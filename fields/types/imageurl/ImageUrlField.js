import React from 'react';
import Field from '../Field';
import {
	Button,
	GlyphButton,
	FormField,
	FormInput,
	FormNote,
} from '../../../admin/client/App/elemental';
import ImageThumbnail from '../../components/ImageThumbnail';

module.exports = Field.create({
	displayName: 'ImageUrlField',
	statics: {
		type: 'ImageUrl',
	},
	openValue () {
		var href = this.props.value;
		if (!href) return;
		if (!/^(mailto\:)|(\w+\:\/\/)/.test(href)) {
			href = 'http://' + href;
		}
		window.open(href);
	},
	renderLink () {
		console.log('ImageUrl renderLink', this.props);
		if (!this.props.value) return null;
		return (
			<GlyphButton
				className="keystone-relational-button"
				glyph="link"
				onClick={this.openValue}
				title={'Open ' + this.props.value + ' in a new tab'}
				variant="link"
			/>
		);
	},
	renderField () {
		console.log('ImageUrl renderField', this.props);
		return (
			<div style={{ position: 'relative' }}>
				<FormInput
					autoComplete="off"
					name={this.getInputName(this.props.path)}
					onChange={this.valueChanged}
					ref="focusTarget"
					type="url"
					value={this.props.value}
				/>
				{this.renderImagePreview()}
			</div>
		);
	},
	wrapField () {
		console.log('ImageUrl wrapField', this.props);
		return (
			<div style={{ position: 'relative' }}>
				{this.renderField()}
				{this.renderImagePreview()}
				{this.renderLink()}
			</div>
		);
	},
	renderValue () {
		const { value } = this.props;
		console.log('ImageUrl renderValue', this.props, this.openValue);
		return (
			<div style={{ position: 'relative' }}>
				<FormInput noedit onClick={value && this.openValue}>
					{value}
				</FormInput>
				{this.renderImagePreview()}
			</div>
		);
	},
	renderImagePreview () {
		const { value } = this.props;
		console.log('ImageUrl renderImagePreview', this.props);
		if (!value) return null;
		return (
			<ImageThumbnail
				component="a"
				href={value}
				target="__blank"
				style={{ float: 'left', marginRight: '1em' }}
			>
				<img src={value} style={{ height: 90 }} />
			</ImageThumbnail>
		);
	},
});
