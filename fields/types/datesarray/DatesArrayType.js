var FieldType = require('../Type');
var moment = require('moment');
var util = require('util');
var utils = require('keystone-utils');
var keystone=require('keystone');
var addPresenceToQuery = require('../../utils/addPresenceToQuery');


function datesarray(list,path,options){
	this._underscoreMethods = ['format'];
	this.separator = options.separator || ' | ';
	this._properties = ['formatString'];
	this.parseFormatString = options.parseFormat || 'YYYY-MM-DD';
	this.formatString = (options.format === false) ? false : (options.format || 'Do MMM YYYY');
	if (this.formatString && typeof this.formatString !== 'string') {
		throw new Error('FieldType.DateArray: options.format must be a string.');
	}
	datesarray.super_.call(this, list, path, options);
}

datesarray.properName = 'DatesArray';
util.inherits(datesarray, FieldType);


datesarray.prototype.format=function(item, format, separator){
	value=item.get(this.path).Dates;
	if(format || this.formatString){
		value=value.map(o=>{
			let start=moment(o.start).format(format||this.formatString);
			let end=moment(o.end).format(format||this.formatString);
			return `${start}-${end}`;
		})
	}
	else{
		value=value.map(o=>{
			let start=o.start;
			let end=o.end;
			return `${start}~${end}`;
		})
	}
	return value.join(separator||this.separator);
}


datesarray.prototype.addToSchema=function(schema){
	var mongoose = keystone.mongoose;
	var field = this;

	var DateSchema=new mongoose.Schema({
		start:Date,
		end:Date
	});

	var DatesSchema=new mongoose.Schema({
		Dates:[DateSchema],
		optDates:[String]
	});

	schema.add(this._path.addTo({}, DatesSchema));
}

datesarray.prototype.updateItem = function (item, data, callback) {
	let values = this.getValueFromData(data);
	let optDates=item.get(this.path)?item.get(this.path).optDates:[];
	let items=[];
	if (values === undefined || values === null || values === '') {
		values = [];
	}
	if (!Array.isArray(values)) {
		values = [values];
	}
	// console.log("------videoarray-debug----"+JSON.stringify(values));
	if(values.length==0) item.set(this.path,{Dates:[],optDates});
	else if(typeof values[0]=="object"){
		item.set(this.path,values);
	}else{
		let result=[];
		for(var i=0;i<values.length/2;i++){
			let item={};
			item.start=values[2*i];
			item.end=values[2*i+1];
			//如果结束时间为空，设为与开始时间相同
			if(!item.end){
				item.end=item.start;
			}
			result.push(item);
		}
		result=result.filter(o=>{
			return moment(o.start).isValid()&&moment(o.end).isValid();
		})
		item.set(this.path, {Dates:result,optDates});
	}
	process.nextTick(callback);
};

/* Export Field Type */
module.exports = datesarray;
