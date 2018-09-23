var FieldType = require('../Type');
var TextType = require('../text/TextType');
var util = require('util');


/**
 * URL FieldType Constructor
 * @extends Field
 * @api public
 */
function imageurl (list, path, options) {
	this._nativeType = String;
	this._underscoreMethods = ['format'];
	imageurl.super_.call(this, list, path, options);
}
imageurl.properName = 'ImageUrl';
util.inherits(imageurl, FieldType);


// TODO: is it worth adding URL specific validation logic? it would have to be
// robust so as to not trigger invalid cases on valid input, might be so
// flexible that it's not worth adding.
imageurl.prototype.validateInput = TextType.prototype.validateInput;
imageurl.prototype.validateRequiredInput = TextType.prototype.validateRequiredInput;

/* Inherit from TextType prototype */
imageurl.prototype.addFilterToQuery = TextType.prototype.addFilterToQuery;

/**
 * Formats the field value using either a supplied format function or default
 * which strips the leading protocol from the value for simpler display
 */
imageurl.prototype.format = function (item) {
	var imageurl = item.get(this.path) || '';
	if (this.options.format === false) {
		return imageurl;
	} else if (typeof this.options.format === 'function') {
		return this.options.format(imageurl);
	} else {
		return removeProtocolPrefix(imageurl);
	}
};

/**
 * Remove the protocol prefix from imageurl
 */
function removeProtocolPrefix (imageurl) {
	return imageurl.replace(/^[a-zA-Z]+\:\/\//, '');
}

/* Export Field Type */
module.exports = imageurl;
