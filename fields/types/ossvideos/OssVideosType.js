var _ = require('lodash');
var assign = require('object-assign');
var async = require('async');
var FieldType = require('../Type');
var keystone = require('../../../');
var util = require('util');
var ALY = require('aliyun-sdk');
var fs=require("fs");
var ffprobe = require('ffprobe'),
    ffprobeStatic = require('ffprobe-static');

function getEmptyValue(){
	return {
		url:""
	}
}

function truthy (value) {
	return value;
}

function ossvideos (list, path, options) {
	this._underscoreMethods = ['format'];
	this._fixedSize = 'full';
	this._properties = ['select', 'selectPrefix', 'autoCleanup', 'publicID', 'folder', 'filenameAsPublicID'];

	ossvideos.super_.call(this, list, path, options);

	// validate cloudinary config
	if(!process.env.OSS_ID||!process.env.OSS_SECRETKEY||!process.env.OSS_ENDPOINT){
		throw new Error('Invalid aliyun sdk config!');
	}
	this.oss=new ALY.OSS({
		accessKeyId:process.env.OSS_ID,
		secretAccessKey:process.env.OSS_SECRETKEY,
		endpoint:process.env.OSS_ENDPOINT,
		apiVersion:"2013-10-15"
	})
	this.bucket=process.env.OSS_BUCKET;
	this.endpoint=process.env.OSS_ENDPOINT;
    this.domain=process.env.OSS_DOMAIN;
}


ossvideos.properName = 'OssVideos';
util.inherits(ossvideos, FieldType);


ossvideos.prototype.addToSchema=function(schema){
	var mongoose = keystone.mongoose;
	var field = this;

	var VideoSchema=new mongoose.Schema({
        domain:String,
		url:String,
        original:String,
		filename:String,
		duration:Number,
		size:Number,
		width:Number,
		height:Number,
        data:Object,
		poster:Object,
	});

	var src=function(img,options){
		return img.url;
	}

	var addSize = function (options, width, height, other) {
		if (width) options.width = width;
		if (height) options.height = height;
		if (typeof other === 'object') {
			assign(options, other);
		}
		return options;
	};

	VideoSchema.method('src', function (options) {
		return src(this, options);
	});
	VideoSchema.method('scale', function (width, height, options) {
		return src(this, addSize({ crop: 'scale' }, width, height, options));
	});
	VideoSchema.method('fill', function (width, height, options) {
		return src(this, addSize({ crop: 'fill', gravity: 'faces' }, width, height, options));
	});
	VideoSchema.method('lfill', function (width, height, options) {
		return src(this, addSize({ crop: 'lfill', gravity: 'faces' }, width, height, options));
	});
	VideoSchema.method('fit', function (width, height, options) {
		return src(this, addSize({ crop: 'fit' }, width, height, options));
	});
	VideoSchema.method('limit', function (width, height, options) {
		return src(this, addSize({ crop: 'limit' }, width, height, options));
	});
	VideoSchema.method('pad', function (width, height, options) {
		return src(this, addSize({ crop: 'pad' }, width, height, options));
	});
	VideoSchema.method('lpad', function (width, height, options) {
		return src(this, addSize({ crop: 'lpad' }, width, height, options));
	});
	VideoSchema.method('crop', function (width, height, options) {
		return src(this, addSize({ crop: 'crop', gravity: 'faces' }, width, height, options));
	});
	VideoSchema.method('thumbnail', function (width, height, options) {
		return src(this, addSize({ crop: 'thumb', gravity: 'faces' }, width, height, options));
	});

	schema.add(this._path.addTo({}, [VideoSchema]));

	this.removeVideo = function (item, id, method, callback) {
		var images = item.get(field.path);
		if (typeof id !== 'number') {
			for (var i = 0; i < images.length; i++) {
				if (images[i].filename === id) {
					id = i;
					break;
				}
			}
		}
		// console.log("-----oss--remove"+id);
		var img = images[id];
		if (!img) return;
		if (method === 'delete') {
			field.oss.deleteObject({
				Bucket:field.bucket,
				Key:img.filename
			},function(){})
		}
		images.splice(id, 1);
		if (callback) {
			item.save((typeof callback !== 'function') ? callback : undefined);
		}
	};
	this.underscoreMethod('remove', function (id, callback) {
		field.removeVideo(this, id, 'remove', callback);
	});
	this.underscoreMethod('delete', function (id, callback) {
		field.removeVideo(this, id, 'delete', callback);
	});

	this.bindUnderscoreMethods();

}

ossvideos.prototype.format = function (item) {
	return _.map(item.get(this.path), function (img) {
		return img.src();
	}).join(', ');
};

ossvideos.prototype.getData = function (item) {
	var value = item.get(this.path);
	return Array.isArray(value) ? value : [];
};

ossvideos.prototype.inputIsValid = function (data) { // eslint-disable-line no-unused-vars
	// TODO - how should image field input be validated?
	return true;
};


ossvideos.prototype.updateItem = function (item, data, files, callback) {
	if (typeof files === 'function') {
		callback = files;
		files = {};
	} else if (!files) {
		files = {};
	}

	// console.log("--oss--update--debug starting...")
	// console.log("----"+JSON.stringify(files))


	var field=this;
	var values = this.getValueFromData(data);
	// console.log("----"+JSON.stringify(data));
	// console.log("----"+values);
	if(!values){
		item.set(field.path,[]);
		return process.nextTick(callback);
	}

	if (!Array.isArray(values)) {
		values = [values];
	}

	values = values.map(function (value) {
		// When the value is a string, it may be JSON serialised data.
		if (typeof value === 'string'
			&& value.charAt(0) === '{'
			&& value.charAt(value.length - 1) === '}'
		) {
			try {
				return JSON.parse(value);
			} catch (e) { /* value isn't JSON */ }
		}
		if (typeof value === 'string') {
			// detect file upload (field value must be a reference to a field in the
			// uploaded files object provided by multer)
			if (value.substr(0, 7) === 'upload:') {
				var uploadFieldPath = value.substr(7);
				return files[uploadFieldPath];
			}
			// detect a URL or Base64 Data
			else if (/^(data:[a-z\/]+;base64)|(https?\:\/\/)/.test(value)) {
				return { path: value };
			}
		}
		return value;
	});

	values = _.flatten(values);
	// console.log("--oss-debug--"+JSON.stringify(values));


	async.map(values, function (value, next) {
		if (typeof value === 'object' && 'url' in value) {
			// Cloudinary Image data provided
			if (value.url) {
				// Default the object with empty values
				var v = assign(getEmptyValue(), value);
				return next(null, v);
			} else {
				// public_id is falsy, remove the value
				return next();
			}
		} else if (typeof value === 'object' && value.path) {
			// File provided - upload it
			fs.readFile(value.path,function(err,body){
				if(err)  next(err);
				field.oss.putObject({
					Key:value.name,
					Body:body,
					Bucket:field.bucket,
					ContentType:value.mimetype
				},function(err,data){
					if(err) return next(err);
					ffprobe(value.path, {path: ffprobeStatic.path}, function (err, info) {
                        data = {
                            url: field.domain + "/" + value.name,
                            filename: value.name,
                            domain: field.domain,
							duration: info && info.streams && info.streams[0] ? info.streams[0].duration : null,
							size: info && info.format ? info.format.size : null,
							width: info && info.streams && info.streams[0] ? info.streams[0].width : null,
							height: info && info.streams && info.streams[0] ? info.streams[0].height : null,
                            data: info,
						}
                        console.log('OssVideosType', data, err);
						next(null, data);
					});
				})
			})

		} else {
			// Nothing to do
			// TODO: We should really also support deleting images from cloudinary,
			// see the CloudinaryImageType field for reference
			return next();
		}
	}, function (err, result) {
		if (err) return callback(err);
		result = result.filter(truthy);
		// console.log("--oss-debug"+JSON.stringify(result))
		item.set(field.path, result);
		return callback();
	});




}


module.exports=ossvideos;
