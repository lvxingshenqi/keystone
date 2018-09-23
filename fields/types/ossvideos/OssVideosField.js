import _ from 'lodash';
import async from 'async';
import React, { cloneElement } from 'react';
import Field from '../Field';
import { Button, FormField, FormNote } from '../../../admin/client/App/elemental';
import Lightbox from 'react-images';
import Thumbnail from './OssVideosThumbnail';
import HiddenFileInput from '../../components/HiddenFileInput';
import FileChangeMessage from '../../components/FileChangeMessage';

const SUPPORTED_TYPES = ['video/*'];
const SUPPORTED_REGEX = new RegExp(/^video\//g);
const RESIZE_DEFAULTS = {
	crop: 'fit',
	format: 'jpg',
};

let uploadInc = 1000;

module.exports = Field.create({
	displayName: 'OssVideosField',
	statics: {
		type: 'OssVideos',
		getDefaultValue: () => ([]),
	},
	getInitialState () {
		return this.buildInitialState(this.props);
	},
	componentWillUpdate (nextProps) {
		// Reset the thumbnails and upload ID when the item value changes
		// TODO: We should add a check for a new item ID in the store
		const value = _.map(this.props.value, 'url').join();
		const nextValue = _.map(nextProps.value, 'url').join();
		if (value !== nextValue) {
			this.setState(this.buildInitialState(nextProps));
		}
	},
	buildInitialState (props) {
		const uploadFieldPath = `OssVideos-${props.path}-${++uploadInc}`;
		const thumbnails = props.value ? props.value.map((img, index) => {
			let url = img.url + '?x-oss-process=video/snapshot,t_1000,f_jpg,w_800,h_600,m_fast';
			if (img && img.url && img.poster && img.poster.url) {
				url = img.poster.url.indexOf('instagram') !== -1 ? img.poster.url : img.poster.url + '?x-oss-process=image/resize,m_mfit,w_800,h_600';
			}
			return this.getThumbnail({
				value: img,
				imageSourceSmall: url,
				imageSourceLarge: url,
			}, index);
		}) : [];
		return { thumbnails, uploadFieldPath };
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
	lightboxPrevious () {
		this.setState({
			lightboxImageIndex: this.state.lightboxImageIndex - 1,
		});
	},
	lightboxNext () {
		this.setState({
			lightboxImageIndex: this.state.lightboxImageIndex + 1,
		});
	},

	// ==============================
	// METHODS
	// ==============================

	removeImage (index) {
		const newThumbnails = [...this.state.thumbnails];
		const target = newThumbnails[index];

		// Use splice + clone to toggle the isDeleted prop
		newThumbnails.splice(index, 1, cloneElement(target, {
			isDeleted: !target.props.isDeleted,
		}));

		this.setState({ thumbnails: newThumbnails });
	},
	getCount (key) {
		var count = 0;

		this.state.thumbnails.forEach((thumb) => {
			if (thumb && thumb.props[key]) count++;
		});

		return count;
	},
	clearFiles () {
		this.refs.fileInput.clearValue();

		this.setState({
			thumbnails: this.state.thumbnails.filter(function (thumb) {
				return !thumb.props.isQueued;
			}),
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

		var that = this;
		let index = this.state.thumbnails.length;
		async.mapSeries(files, (file, callback) => {
			const reader = new FileReader();
			reader.onload = function() {
	      var blob = new Blob([reader.result], {type: file.type});
	      var url = URL.createObjectURL(blob);
	      var video = document.createElement('video');
	      var timeupdate = function() {
	        if (snapImage()) {
	          video.removeEventListener('timeupdate', timeupdate);
	          video.pause();
	        }
	      };
	      video.addEventListener('loadeddata', function() {
	        if (snapImage()) {
	          video.removeEventListener('timeupdate', timeupdate);
	        }
	      });
	      var snapImage = function() {
	        var canvas = document.createElement('canvas');
					console.log('video', video, video.duration, video.videoWidth, video.videoHeight);
	        canvas.width = video.videoWidth;
	        canvas.height = video.videoHeight;
	        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
	        var image = canvas.toDataURL();
	        var success = image.length > 100000;
	        if (success) {
						callback(null, that.getThumbnail({
							isQueued: true,
							imageSourceSmall: image,
						}, index++));
	          URL.revokeObjectURL(url);
	        }
	        return success;
	      };
	      video.addEventListener('timeupdate', timeupdate);
	      video.preload = 'metadata';
	      video.src = url;
	      // Load video in Safari / IE11
	      video.muted = true;
	      video.playsInline = true;
	      video.play();
	    };
	    reader.readAsArrayBuffer(file);

			// reader.readAsDataURL(file);
			// reader.onload = (e) => {
			// 	callback(null, this.getThumbnail({
			// 		isQueued: true,
			// 		imageSourceSmall: e.target.result,
			// 	}, index++));
			// };
		}, (err, thumbnails) => {
			this.setState({
				thumbnails: [...this.state.thumbnails, ...thumbnails],
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
				multiple
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

		const images = value.map(function(image) {
			let url = image.url + '?x-oss-process=video/snapshot,t_1000,f_jpg,w_800,h_600,m_fast';
			if (image && image.url && image.poster && image.poster.url) {
				url = image.poster.url.indexOf('instagram') !== -1 ? image.poster.url : image.poster.url + '?x-oss-process=image/resize,m_mfit,w_800,h_600';
			}
			return {
				src: url
			}
		});

		return (
			<Lightbox
				images={images}
				currentImage={this.state.lightboxImageIndex}
				isOpen={this.state.lightboxIsVisible}
				onClickPrev={this.lightboxPrevious}
				onClickNext={this.lightboxNext}
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
					Upload Videos
				</Button>
				{this.hasFiles() && (
					<Button variant="link" color="cancel" onClick={this.clearFiles}>
						Clear selection
					</Button>
				)}
				{changeMessage}
				{saveMessage}
			</div>
		);
	},
	renderUI () {
		const { label, note, path } = this.props;
		const { thumbnails } = this.state;

		return (
			<FormField label={label} className="field-type-cloudinaryimages" htmlFor={path}>
				<div>
					{thumbnails}
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
