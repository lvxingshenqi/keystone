import React, { PropTypes } from 'react';
import { Button } from '../../../admin/client/App/elemental';
import ImageThumbnail from '../../components/ImageThumbnail';
import LazyLoad from 'react-lazyload';

function OssImagesThumbnail ({
	isDeleted,
	imageSourceLarge,
	imageSourceSmall,
	thumbSize,
	inputName,
	isQueued,
	openLightbox,
	shouldRenderActionButton,
	toggleDelete,
	value,
	...props
}) {
	// render icon feedback for intent
	let mask;
	if (isQueued) mask = 'upload';
	else if (isDeleted) mask = 'remove';

	// action button
	const actionButton = (shouldRenderActionButton && !isQueued) ? (
		<Button variant="link" color={isDeleted ? 'default' : 'cancel'} block onClick={toggleDelete}>
			{isDeleted ? 'Undo' : 'Remove'}
		</Button>
	) : null;

	const input = (!isQueued && !isDeleted && value) ? (
		<input type="hidden" name={inputName} value={JSON.stringify(value)} />
	) : null;

	// provide gutter for the images
	const imageStyles = {
		float: 'left',
		marginBottom: 10,
		marginRight: 10,
	};
	const imgStyles = {
		width: '100%',
		'max-width': thumbSize || 250 || 90,
	};

	return (
		<div style={imageStyles}>
			<ImageThumbnail
				component={imageSourceLarge ? 'a' : 'span'}
				href={!!imageSourceLarge && imageSourceLarge}
				onClick={!!imageSourceLarge && openLightbox}
				mask={mask}
				target={!!imageSourceLarge && '__blank'}
			>
				<LazyLoad height={thumbSize}>
					<img src={imageSourceSmall} style={imgStyles} />
				</LazyLoad>
			</ImageThumbnail>
			{actionButton}
			{input}
		</div>
	);

};

OssImagesThumbnail.propTypes = {
	imageSourceLarge: PropTypes.string,
	imageSourceSmall: PropTypes.string.isRequired,
	thumbSize: PropTypes.number,
	isDeleted: PropTypes.bool,
	isQueued: PropTypes.bool,
	openLightbox: PropTypes.func.isRequired,
	shouldRenderActionButton: PropTypes.bool,
	toggleDelete: PropTypes.func.isRequired,
};

module.exports = OssImagesThumbnail;
