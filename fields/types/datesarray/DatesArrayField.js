import Field from '../Field';
import _ from 'lodash';
import { findDOMNode } from 'react-dom';
import moment from 'moment';
import React from 'react';
import DateInput from '../../components/DateInput';
import DateSelect from '../../components/DateSelect'
import {
	Button,
	FormField,
	FormInput,
} from '../../../admin/client/App/elemental';


var lastId = 0;
const ENTER_KEYCODE = 13;
const DEFAULT_INPUT_FORMAT = 'YYYY-MM-DD';
const DEFAULT_FORMAT_STRING = 'Do MMM YYYY';

const inputStyle={
	display:"inline-block",
	width:"30%",
	marginLeft:"5px",
	marginRight:"15px",
}



function newItem (value) {
	lastId = lastId + 1;
	return { key: 'i' + lastId, start: value.start, end: value.end };
}

function reduceValues(values){
	return values.map(item=>{
		return {start:item.start,end:item.end}
	})
}


module.exports = Field.create({
	displayName: 'DatesArrayField',
	statics: {
		type: 'DatesArray',
	},
	getDefaultProps () {
		return {
			formatString: DEFAULT_FORMAT_STRING,
			inputFormat: DEFAULT_INPUT_FORMAT,
		};
	},
	getInitialState(){
		return {
			values:Array.isArray(this.props.value.dates)?this.props.value.dates.map(newItem):[],
			opts:Array.isArray(this.props.value.optDates)?this.props.value.optDates:[]
		};
	},
	componentWillUpdate(nextProps){
		var starts=_.map(this.props.value.dates, 'start').join();
		var ends=_.map(this.props.value.dates, 'end').join();
		var _starts=_.map(nextProps.value.dates, 'start').join();
		var _ends=_.map(nextProps.value.dates, 'end').join();
		if(starts!==_starts||ends!==_ends){
			this.setState({
				values: nextProps.value.dates.map(newItem)
			})
		}
	},
	addItem(){
		var newValues=this.state.values.concat(newItem({start:"",end:""}))
		this.setState({
			values: newValues,
		})
		this.valueChanged(reduceValues(newValues));
	},
	removeItem(index){
		var newValues = _.without(this.state.values, index);
		this.setState({
			values: newValues,
		}, function () {
			findDOMNode(this.refs.button).focus();
		});
		this.valueChanged(reduceValues(newValues));
	},
	updateItem(value,item,type){
		var updatedValues = this.state.values;
		var updateIndex = updatedValues.indexOf(item);
		var newValue = value;
		updatedValues[updateIndex][type] = this.cleanInput ? this.cleanInput(newValue) : newValue;
		this.setState({
			values: updatedValues,
		});
		this.valueChanged(reduceValues(updatedValues));
	},
	valueChanged(values) {
		this.props.onChange({
			path: this.props.path,
			value: {dates:values,optDates:this.state.opts}
		});
	},
	processInputValue (value) {
		if (!value) return;
		const m = moment(value);
		return m.isValid() ? m.format(this.props.inputFormat) : value;
	},
	formatValue (value) {
		return value ? moment(value).format(this.props.formatString) : '';
	},
	renderField(){
		return (
			<div>
				{this.state.values.map(this.renderItem)}
				<Button ref="button" onClick={this.addItem}>Add item</Button>
			</div>
		);
	},
	renderItem(item,index){
		let start=this.processInputValue(item.start);
		let end=this.processInputValue(item.end);
		return (
			<FormField key={item.key}>
				<label>start:</label>
				<DateSelect
					style={inputStyle}
					format={this.props.inputFormat}
					ref={"item_start"+(index+1)}
					name={this.getInputName(this.props.path)}
					value={start}
					optDates={this.state.opts}
					onChange={({value})=>{
						this.updateItem(value,item,'start')
					}} />
				<label>end:</label>
				<DateSelect
					style={inputStyle}
					format={this.props.inputFormat}
					ref={"item_end"+(index+1)}
					name={this.getInputName(this.props.path)}
					value={end}
					optDates={this.state.opts}
					onChange={({value})=>{
						this.updateItem(value,item,'end')
					}} />
				<Button type="link-cancel" onClick={this.removeItem.bind(this, item)} className="keystone-relational-button">
					<span className="octicon octicon-x" />
				</Button>
			</FormField>
		)
	},
	renderValue(item,index){
		return (
			<div>
				{this.state.values.map((item, i) => {
					const start=this.formatValue(item.start);
					const end=this.formatValue(item.end);
					return (
						<div key={i} style={i ? { marginTop: '1em' } : null}>
							<DateSelect noedit value={start} />
							<DateSelect noedit value={end} />
						</div>
					);
				})}
			</div>
		);
	},
	shouldCollapse() {
		return this.props.collapse && !this.props.value.length;
	},
	addItemOnEnter: function (event) {
		if (event.keyCode === ENTER_KEYCODE) {
			this.addItem();
			event.preventDefault();
		}
	},

});
