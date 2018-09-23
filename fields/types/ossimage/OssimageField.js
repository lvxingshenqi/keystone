import _ from 'lodash';
import async from 'async';
import React, { cloneElement } from 'react';
import Field from '../Field';
import { Button, FormField, FormNote } from '../../../admin/client/App/elemental';
import Lightbox from 'react-images';
import Thumbnail from './OssImageThumbnail';
import HiddenFileInput from '../../components/HiddenFileInput';
import FileChangeMessage from '../../components/FileChangeMessage';

const SUPPORTED_TYPES = ['image/*', 'application/pdf', 'application/postscript'];
const SUPPORTED_REGEX = new RegExp(/^image\/|application\/pdf|application\/postscript/g);
const RESIZE_DEFAULTS = {
	crop: 'fit',
	format: 'jpg',
};

let uploadInc = 1000;

module.exports = Field.create({
	displayName: 'OssImageField',
	statics: {
		type: 'OssImage',
		getDefaultValue: () => ([]),
	},
	getInitialState () {
		return this.buildInitialState(this.props);
	},
	componentWillUpdate (nextProps) {
		// Reset the thumbnail and upload ID when the item value changes
		// TODO: We should add a check for a new item ID in the store
		const value = _.map(this.props.value, 'url').join();
		const nextValue = _.map(nextProps.value, 'url').join();
		if (value !== nextValue) {
			this.setState(this.buildInitialState(nextProps));
		}
	},
	buildInitialState (props) {
		const uploadFieldPath = `OssImage-${props.path}-${++uploadInc}`;
		const thumbnail = this.getThumbnail({
			value: props.value,
			imageSourceSmall: props.value.url,
			imageSourceLarge: props.value.url,
		}, 0);
		return { thumbnail, uploadFieldPath };
	},
	getThumbnail (props, index) {
		return (
			<Thumbnail
				key={`thumbnail-${index}`}
				inputName={this.getInputName(this.props.path)}
				openLightbox={(e) => this.openLightbox(e, index)}
				shouldRenderActionButton={this.shouldRenderField()}
				toggleDelete={this.removeImage.bind(this, index)}
				{...props}
			/>
		);
	},

	// ==============================
	// HELPERS
	// ==============================

	triggerFileBrowser () {
		this.refs.fileInput.clickDomNode();
	},
	hasFiles () {
		return this.refs.fileInput && this.refs.fileInput.hasValue();
	},
	openLightbox (event, index) {
		event.preventDefault();
		this.setState({
			lightboxIsVisible: true,
			lightboxImageIndex: index,
		});
	},
	closeLightbox () {
		this.setState({
			lightboxIsVisible: false,
			lightboxImageIndex: null,
		});
	},
	// ==============================
	// METHODS
	// ==============================

	removeImage (index) {
		const newThumbnails = [...this.state.thumbnail];
		const target = newThumbnails[index];

		// Use splice + clone to toggle the isDeleted prop
		newThumbnails.splice(index, 1, cloneElement(target, {
			isDeleted: !target.props.isDeleted,
		}));

		this.setState({ thumbnail: newThumbnails });
	},
	getCount (key) {
		var count = 0;

		if (this.state.thumbnail && this.state.thumbnail.props[key]) count++;

		return count;
	},
	clearFiles () {
		this.refs.fileInput.clearValue();

		this.setState({
			thumbnail: !this.state.thumbnail.props.isQueued,
		});
	},
	uploadFile (event) {
		if (!window.FileReader) {
			return alert('File reader not supported by browser.');
		}

		// FileList not a real Array; process it into one and check the types
		const files = [];
		for (let i = 0; i < event.target.files.length; i++) {
			const f = event.target.files[i];
			if (!f.type.match(SUPPORTED_REGEX)) {
				return alert('Unsupported file type. Supported formats are: GIF, PNG, JPG, BMP, ICO, PDF, TIFF, EPS, PSD, SVG');
			}
			files.push(f);
		}

		let index = 1;
		async.mapSeries(files, (file, callback) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (e) => {
				callback(null, this.getThumbnail({
					isQueued: true,
					imageSourceSmall: e.target.result,
				}, index++));
			};
		}, (err, thumbnail) => {
			this.setState({
				thumbnail: {...this.state.thumbnail, ...thumbnail},
			});
		});
	},

	// ==============================
	// RENDERERS
	// ==============================

	renderFileInput () {
		if (!this.shouldRenderField()) return null;

		return (
			<HiddenFileInput
				accept={SUPPORTED_TYPES.join()}
				key={this.state.uploadFieldPath}
				name={this.state.uploadFieldPath}
				onChange={this.uploadFile}
				ref="fileInput"
			/>
		);
	},
	renderValueInput () {
		if (!this.shouldRenderField()) return null;

		// This renders an input with either the upload field reference, or an
		// empty value to reset the field if all images have been removed
		if (this.hasFiles()) {
			return (
				<input
					name={this.getInputName(this.props.path)}
					value={`upload:${this.state.uploadFieldPath}`}
					type="hidden"
				/>
			);
		} else if (this.props.value && this.getCount('isDeleted') === this.props.value.length) {
			return (
				<input
					name={this.getInputName(this.props.path)}
					value=""
					type="hidden"
				/>
			);
		}
	},
	renderLightbox () {
		const { value } = this.props;
		if (!value || !value.length) return;

		const images = [{
			src: value.url
		}];

		return (
			<Lightbox
				images={images}
				currentImage={this.state.lightboxImageIndex}
				isOpen={this.state.lightboxIsVisible}
				onClose={this.closeLightbox}
			/>
		);
	},
	renderToolbar () {
		if (!this.shouldRenderField()) return null;

		const uploadCount = this.getCount('isQueued');
		const deleteCount = this.getCount('isDeleted');

		// provide a gutter for the change message
		// only required when no cancel button, which has equiv. padding
		const uploadButtonStyles = !this.hasFiles()
			? { marginRight: 10 }
			: {};

		// prepare the change message
		const changeMessage = uploadCount || deleteCount ? (
			<FileChangeMessage>
				{uploadCount && deleteCount ? `${uploadCount} added and ${deleteCount} removed` : null}
				{uploadCount && !deleteCount ? `${uploadCount} image added` : null}
				{!uploadCount && deleteCount ? `${deleteCount} image removed` : null}
			</FileChangeMessage>
		) : null;

		// prepare the save message
		const saveMessage = uploadCount || deleteCount ? (
			<FileChangeMessage color={!deleteCount ? 'success' : 'danger'}>
				Save to {!deleteCount ? 'Upload' : 'Confirm'}
			</FileChangeMessage>
		) : null;

		// clear floating images above
		const toolbarStyles = {
			clear: 'both',
		};

		return (
			<div style={toolbarStyles}>
				<Button onClick={this.triggerFileBrowser} style={uploadButtonStyles} data-e2e-upload-button="true">
					上传图片
				</Button>
				{this.hasFiles() && (
					<Button variant="link" color="cancel" onClick={this.clearFiles}>
						清除
					</Button>
				)}
				{changeMessage}
				{saveMessage}
			</div>
		);
	},
	renderUI () {
		const { label, note, path } = this.props;
		const { thumbnail } = this.state;

		return (
			<FormField label={label} className="field-type-cloudinaryimage" htmlFor={path}>
				<div>
					{thumbnail}
				</div>
				{this.renderValueInput()}
				{this.renderFileInput()}
				{this.renderToolbar()}
				{!!note && <FormNote note={note} />}
				{this.renderLightbox()}
			</FormField>
		);
	},
});
