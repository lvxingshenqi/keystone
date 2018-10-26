import React, { PropTypes } from 'react';
import { Button, FormField, FormInput, FormNote } from '../../../admin/client/App/elemental';
import ImageThumbnail from '../../components/ImageThumbnail';

function CloudinaryVideosThumbnail ({
	isDeleted,
	imageSourceLarge,
	imageSourceSmall,
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

	const openValue = function() {
		if (!imageSourceLarge) return;
		if (!/^(mailto\:)|(\w+\:\/\/)/.test(imageSourceLarge)) {
			imageSourceLarge = 'http://' + imageSourceLarge;
		}
		window.open(imageSourceLarge);
	}

	return (
		<div style={imageStyles}>
			<ImageThumbnail
				component={imageSourceLarge ? 'a' : 'span'}
				href={!!imageSourceLarge && imageSourceLarge}
				onClick={!!imageSourceLarge && openLightbox}
				mask={mask}
				target={!!imageSourceLarge && '__blank'}
			>
				<img src={imageSourceSmall} style={{ height: 90 }} />
				{/* <div style={{ position: 'relative' }}>
					<FormInput noedit onClick={imageSourceLarge && openValue}>
						{imageSourceLarge}
					</FormInput>
				</div> */}
			</ImageThumbnail>
			{actionButton}
			{input}
		</div>
	);

};

CloudinaryVideosThumbnail.propTypes = {
	imageSourceLarge: PropTypes.string,
	imageSourceSmall: PropTypes.string.isRequired,
	isDeleted: PropTypes.bool,
	isQueued: PropTypes.bool,
	openLightbox: PropTypes.func.isRequired,
	shouldRenderActionButton: PropTypes.bool,
	toggleDelete: PropTypes.func.isRequired,
};

module.exports = CloudinaryVideosThumbnail;
