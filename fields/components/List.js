import moment from 'moment';
import React from 'react';
import { findDOMNode } from 'react-dom';
import { FormInput } from '../../admin/client/App/elemental';

let lastId = 0;

module.exports = React.createClass({
	displayName: 'List',
	propTypes: {
		onChange: React.PropTypes.func.isRequired,
		options: React.PropTypes.array,
	},
	getDefaultProps () {
		return {
			options: [],
		};
	},
	getInitialState () {
		return {
			selected: -1,
			options: this.props.options
		}
	},
	componentDidMount () {
		console.log("List component did mount!")
	},
	handleClick(index) {
		this.props.onChange(this.state.options[index]);
		this.setState({
			selected:index
		})
	},
 	render () {
 		var items=this.state.options.map((option,index)=>{
 			return <div key={option+"-"+index} style={{color:this.state.selected==index?"blue":""}} onClick={()=>{this.handleClick(index)}}>{option}</div>
 		})
 		return (
 			<div style={{padding:"12px",width:"100px",overflow:"hidden"}}>{items}</div>
 		)
	},
});
