import Field from '../Field';
import _ from 'lodash';
import { findDOMNode } from 'react-dom';

var React = require('react');
var Button = require('elemental').Button;
var FormField = require('elemental').FormField;
var FormInput = require('elemental').FormInput;

var lastId = 0;
var ENTER_KEYCODE = 13;

var inputStyle={
	display:"inline-block",
	width:"30%",
	marginLeft:"5px",
	marginRight:"15px",
}



function newItem (value) {
	lastId = lastId + 1;
	return { key: 'i' + lastId, cover: value.cover, url: value.url };
}

function reduceValues(values){
	return values.map(item=>{
		return {cover:item.cover,url:item.url}
	})
}


module.exports = Field.create({
	displayName: 'VideoArrayField',
	statics: {
		type: 'VideoArray',
	},
	getInitialState(){
		return {
			values:Array.isArray(this.props.value)?this.props.value.map(newItem):[],
		};
	},
	componentWillUpdate(nextProps){
		var covers=_.map(this.props.value, 'cover').join();
		var urls=_.map(this.props.value, 'url').join();
		var _covers=_.map(nextProps.value, 'cover').join();
		var _urls=_.map(nextProps.value, 'url').join();
		if(covers!==_covers||urls!==_urls){
			this.setState({
				values: nextProps.value.map(newItem)
			})
		}
	},
	addItem(){
		var newValues=this.state.values.concat(newItem({cover:"",url:""}))
		this.setState({
			values: newValues,
		},()=>{
			if (!this.state.values.length) return;
			findDOMNode(this.refs['item_cover' + this.state.values.length]).focus();
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
	updateItem(item,type){
		var updatedValues = this.state.values;
		var updateIndex = updatedValues.indexOf(item);
		var newValue = event.value || event.target.value;
		updatedValues[updateIndex][type] = this.cleanInput ? this.cleanInput(newValue) : newValue;
		this.setState({
			values: updatedValues,
		},()=>{
			findDOMNode(this.refs[`item_${type}${updateIndex+1}`]).focus();
		});
		this.valueChanged(reduceValues(updatedValues));
	},
	valueChanged(values) {
		this.props.onChange({
			path: this.props.path,
			value: values,
		});
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
		return (
			<FormField key={item.key}>
				<label>cover:</label>
				<FormInput style={inputStyle} ref={"item_cover"+(index+1)} name={this.getInputName(this.props.path)} value={item.cover} onChange={this.updateItem.bind(this, item, "cover")} onKeyDown={this.addItemOnEnter} autoComplete="off"/>
				<label>url:</label>
				<FormInput style={inputStyle} ref={"item_url"+(index+1)} name={this.getInputName(this.props.path)} value={item.url} onChange={this.updateItem.bind(this, item, "url")} onKeyDown={this.addItemOnEnter} autoComplete="off"/>
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
					const cover=item.cover;
					const url=item.url;
					return (
						<div key={i} style={i ? { marginTop: '1em' } : null}>
							<FormInput noedit value={cover} />
							<FormInput noedit value={url} />
						</div>
					);
				})}
			</div>
		);
	},
	shouldCollapse() {
		return this.props.collapse && !this.props.value.length;
	},

	addItemOnEnter(event) {
		if (event.keyCode === ENTER_KEYCODE) {
			this.addItem();
			event.preventDefault();
		}
	},

});