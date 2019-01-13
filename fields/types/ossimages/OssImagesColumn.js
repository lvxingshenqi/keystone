import React from 'react';
import CloudinaryImageSummary from '../../components/columns/CloudinaryImageSummary';
import Thumbnail from './OssImagesThumbnail';
import ItemsTableCell from '../../components/ItemsTableCell';
import ItemsTableValue from '../../components/ItemsTableValue';
import Lightbox from 'react-images';

const moreIndicatorStyle = {
	color: '#888',
	fontSize: '.8rem',
};

var OssImagesColumn = React.createClass({
	displayName: 'OssImagesColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
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
	renderLightbox () {
		const { value } = this.props;
		if (!value || !value.length) return;

		const images = value.map(image => ({
			src: image.url
		}));

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
	renderThumbnails (value, thumbSize = 250) {
		if (!value || !value.length) return;
		const items = [];
		for (let i = 0; i < value.length; i++) {
			if (!value[i] || (value[i] && !value[i].url)) break;
			items.push(<Thumbnail
				key={`thumbnail-${i}`}
				openLightbox={(e) => this.openLightbox(e, i)}
				imageSourceSmall={value[i].url}
				imageSourceLarge={value[i].url}
				thumbSize={thumbSize}
			/>);
		}
		return items;
	},
	renderMany (value) {
		if (!value || !value.length) return;
		const items = [];
		for (let i = 0; i < 3; i++) {
			if (!value[i]) break;
			items.push(<CloudinaryImageSummary key={'image' + i} image={value[i]} />);
		}
		if (value.length > 3) {
			items.push(<span key="more" style={moreIndicatorStyle}>[...{value.length - 3} more]</span>);
		}
		return items;
	},
	renderValue (value) {
		if (!value || !Object.keys(value).length) return;

		return <CloudinaryImageSummary image={value} />;

	},
	render () {
		const value = this.props.data.fields[this.props.col.path];
		const many = value.length > 1;
		const bigthumb = this.props.list.id === 'scraper-media' || this.props.list.id === 'posts' || this.props.list.id === 'scraper-accounts';
		const thumbSize = this.props.list.id === 'scraper-accounts' ? 150 : 250;
		return (
			<ItemsTableCell>
				<ItemsTableValue field={this.props.col.type}>
					{bigthumb ? this.renderThumbnails(value, thumbSize) : (many ? this.renderMany(value) : this.renderValue(value[0]))}
					{bigthumb ? this.renderLightbox() : null}
				</ItemsTableValue>
			</ItemsTableCell>
		);
	},
});

module.exports = OssImagesColumn ;
