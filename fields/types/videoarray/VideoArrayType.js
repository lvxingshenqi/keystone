var FieldType = require('../Type');
var util = require('util');
var utils = require('keystone-utils');
var keystone=require('keystone');
var addPresenceToQuery = require('../../utils/addPresenceToQuery');

/**
 * TextArray FieldType Constructor
 * @extends Field
 * @api public
 */
function videoarray (list, path, options) {
	this._underscoreMethods = ['format'];
	this.separator = options.separator || ' | ';
	videoarray.super_.call(this, list, path, options);
}
videoarray.properName = 'VideoArray';
util.inherits(videoarray, FieldType);

/**
 * Formats the field value
 */
videoarray.prototype.format = function (item, separator) {
	return _.map(item.get(this.path),function(video){
		return video.url
	}).join(separator||this.separator);
};

videoarray.prototype.addToSchema = function (schema) {
	var mongoose = keystone.mongoose;
	var field = this;

	var VideoSchema=new mongoose.Schema({
		cover:String,
		url:String
	});

	schema.add(this._path.addTo({}, [VideoSchema]));

}
/**
 * Updates the value for this field in the item from a data object.
 * If the data object does not contain the value, then the value is set to empty array.
 */
videoarray.prototype.updateItem = function (item, data, callback) {
	let values = this.getValueFromData(data);

	let items=[];
	if (values === undefined || values === null || values === '') {
		values = [];
	}
	if (!Array.isArray(values)) {
		values = [values];
	}
	// console.log("------videoarray-debug----"+JSON.stringify(values));
	if(values.length==0) item.set(this.path,[]);
	else if(typeof values[0]=="object"){
		item.set(this.path,values);
	}else{
		let result=[];
		for(var i=0;i<values.length/2;i++){
			let item={};
			item.cover=values[2*i];
			item.url=values[2*i+1];
			result.push(item);
		}
		item.set(this.path, result);
	}
	process.nextTick(callback);
};

/* Export Field Type */
module.exports = videoarray;
