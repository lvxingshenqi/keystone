import React from 'react';
import moment from 'moment';
import assign from 'object-assign';
import {
	Form,
	FormField,
	FormInput,
	Grid,
	ResponsiveText,
} from '../../../elemental';

import { series } from 'async';
import { Fields } from 'FieldTypes';
import { fade } from '../../../../utils/color';
import theme from '../../../../theme';

import { Button, LoadingButton } from '../../../elemental';
import AlertMessages from '../../../shared/AlertMessages';
import ConfirmationDialog from './../../../shared/ConfirmationDialog';

import FormHeading from './FormHeading';
import AltText from './AltText';
import FooterBar from './FooterBar';
import InvalidFieldType from '../../../shared/InvalidFieldType';

import { deleteItem } from '../actions';

import { upcase } from '../../../../utils/string';
import { HotKeys } from 'react-hotkeys';

function getNameFromData (data) {
	if (typeof data === 'object') {
		if (typeof data.first === 'string' && typeof data.last === 'string') {
			return data.first + ' ' + data.last;
		} else if (data.id) {
			return data.id;
		}
	}
	return data;
}

function smoothScrollTop () {
	if (document.body.scrollTop || document.documentElement.scrollTop) {
		window.scrollBy(0, -50);
		var timeOut = setTimeout(smoothScrollTop, 20);
	}	else {
		clearTimeout(timeOut);
	}
}

var EditForm = React.createClass({
	displayName: 'EditForm',
	propTypes: {
		data: React.PropTypes.object,
		list: React.PropTypes.object,
	},
	getInitialState () {
		return {
			values: assign({}, this.props.data.fields),
			confirmationDialog: null,
			loading: false,
			loadingNext: false,
			loadingPub: false,
			loadingPubNext: false,
			loadingHandledAndNext: false,
			lastValues: null, // used for resetting
			focusFirstField: !this.props.list.nameField && !this.props.list.nameFieldIsFormHeader,
		};
	},
	componentDidMount () {
		this.__isMounted = true;
	},
	componentWillUnmount () {
		this.__isMounted = false;
	},
	componentDidUpdate(prevProps) {
        if(!prevProps.isFocused && this.props.isFocused) {
            this._hotkeyContainer.focus();
        }
    },
	getFieldProps (field) {
		const props = assign({}, field);
		const alerts = this.state.alerts;
		// Display validation errors inline
		if (alerts && alerts.error && alerts.error.error === 'validation errors') {
			if (alerts.error.detail[field.path]) {
				// NOTE: This won't work yet, as ElementalUI doesn't allow
				// passed in isValid, only invalidates via internal state.
				// PR to fix that: https://github.com/elementalui/elemental/pull/149
				props.isValid = false;
			}
		}
		props.value = this.state.values[field.path];
		props.values = this.state.values;
		props.onChange = this.handleChange;
		props.mode = 'edit';
		return props;
	},
	handleChange (event) {
		const values = assign({}, this.state.values);

		values[event.path] = event.value;
		this.setState({ values });
	},

	toggleDeleteDialog () {
		this.setState({
			deleteDialogIsOpen: !this.state.deleteDialogIsOpen,
		});
	},
	toggleResetDialog () {
		this.setState({
			resetDialogIsOpen: !this.state.resetDialogIsOpen,
		});
	},
	handleReset () {
		this.setState({
			values: assign({}, this.state.lastValues || this.props.data.fields),
			resetDialogIsOpen: false,
		});
	},
	handleDelete () {
		const { data } = this.props;
		this.props.dispatch(deleteItem(data.id, this.props.router));
	},
	handleKeyFocus () {
		const input = this.refs.keyOrIdInput;
		input.select();
	},
	removeConfirmationDialog () {
		this.setState({
			confirmationDialog: null,
		});
	},
	updateItem () {
		const { data, list } = this.props;
		const editForm = this.refs.editForm;
		const formData = new FormData(editForm);

		// Show loading indicator
		this.setState({
			loading: true,
		});

		list.updateItem(data.id, formData, (err, data) => {
			smoothScrollTop();
			if (err) {
				this.setState({
					alerts: {
						error: err,
					},
					loading: false,
				});
			} else {
				// Success, display success flash messages, replace values
				// TODO: Update key value
				this.setState({
					alerts: {
						success: {
							success: 'Your changes have been saved successfully',
						},
					},
					lastValues: this.state.values,
					values: data.fields,
					loading: false,
				});
			}
		});
	},
	loadNext(that, noMoreItemForThatAccount = false) {
		const {data, list, router } = that.props;
		var options = data && data.fields && data.fields.account && !noMoreItemForThatAccount ? {account: data.fields.account, status:'pending'} : {status:'pending'};
		list.loadNext(options, function(err, item) {
			console.log('EditForm pubAndNext loadNext', err, 'item', item, 'data', data);
			if (!item || (item && item.result && item.result === 'no more item satisfied with options')) {
				!noMoreItemForThatAccount && that.loadNext(that, true);
			} else {
				var state = {
					loading: false,
					loadingNext: false,
					loadingPub: false,
					loadingPubNext: false,
					loadingHandledAndNext: false,
				};
				if (err) {
					state.alerts = {
						error:{
							error:err.err
						}
					};
					that.setState(state);
				} else if(item.result._id === data.id){
					smoothScrollTop();
					state.alerts = {
						error: {
							error: 'Status not changed,return the same page!',
						},
					};
					that.setState(state);
				}else{
					state.alerts = {
						success: {
							success: 'loadNext successed!',
						},
					};
					that.setState(state ,function() {
						router.push({
							pathname: '/backend/'+list.id+'/'+item.result._id
						});
					})
				}
			}
		});
	},
	//进入下一条草稿
	getNext (noMoreItemForThatAccount = false) {
		const {data, list, router } = this.props;
		if(list.id === "messages" || list.id === "scraper-media" || list.id === "scraper-accounts"){
			this.setState({
				loadingNext:true,
			});
			this.loadNext(this);
		} else {
			return;
		}
	},
	//保存并发布
	pubAndSave() {
		const { data, list } = this.props;
		const editForm = this.refs.editForm;
		const formData = new FormData(editForm);
		//强制将状态变成发布
		if(formData.has("status")){
			formData.set("status","publish");
		}

		// Show loading indicator
		this.setState({
			loadingPub: true,
		});

		list.updateItem(data.id, formData, (err, data) => {
			smoothScrollTop();
			if (err) {
				this.setState({
					alerts: {
						error: {
							err:err.err
						},
					},
					loadingPub: false,
				});
			} else {
				// Success, display success flash messages, replace values
				// TODO: Update key value
				this.setState({
					alerts: {
						success: {
							success: 'Your changes have been saved successfully',
						},
					},
					lastValues: this.state.values,
					values: data.fields,
					loadingPub: false,
				});
			}
		});
	},
	//发布并且进入下一条
	pubAndNext(){
		const {data, list, router } = this.props;
		const editForm = this.refs.editForm;
		const formData = new FormData(editForm);
		//强制将状态变成发布
		if (formData.has("status")) {
			formData.set("status", "publish");
		}
		this.setState({
			loadingPubNext: true,
		});
		var that=this
		series([
			function(callback){
				list.updateItem(data.id, formData, callback)
			},
			function(callback){
				that.loadNext(that);
			}])

	},
	//已处理并且进入下一条
	handledAndNext(){
		const {data, list, router } = this.props;
		const editForm = this.refs.editForm;
		const formData = new FormData(editForm);
		//强制将状态变成发布
		if (formData.has("status")) {
			formData.set("status", "handled");
		}
		this.setState({
			loadingHandledAndNext: true,
		});
		var that=this
		series([
			function(callback){
				list.updateItem(data.id, formData, callback)
			},
			function(callback){
				that.loadNext(that);
			}])

	},

	renderKeyOrId () {
		var className = 'EditForm__key-or-id';
		var list = this.props.list;

		if (list.nameField && list.autokey && this.props.data[list.autokey.path]) {
			return (
				<div className={className}>
					<AltText
						modified="ID:"
						normal={`${upcase(list.autokey.path)}: `}
						title="Press <alt> to reveal the ID"
						className="EditForm__key-or-id__label" />
					<AltText
						modified={<input ref="keyOrIdInput" onFocus={this.handleKeyFocus} value={this.props.data.id} className="EditForm__key-or-id__input" readOnly />}
						normal={<input ref="keyOrIdInput" onFocus={this.handleKeyFocus} value={this.props.data[list.autokey.path]} className="EditForm__key-or-id__input" readOnly />}
						title="Press <alt> to reveal the ID"
						className="EditForm__key-or-id__field" />
				</div>
			);
		} else if (list.autokey && this.props.data[list.autokey.path]) {
			return (
				<div className={className}>
					<span className="EditForm__key-or-id__label">{list.autokey.path}: </span>
					<div className="EditForm__key-or-id__field">
						<input ref="keyOrIdInput" onFocus={this.handleKeyFocus} value={this.props.data[list.autokey.path]} className="EditForm__key-or-id__input" readOnly />
					</div>
				</div>
			);
		} else if (list.nameField) {
			return (
				<div className={className}>
					<span className="EditForm__key-or-id__label">ID: </span>
					<div className="EditForm__key-or-id__field">
						<input ref="keyOrIdInput" onFocus={this.handleKeyFocus} value={this.props.data.id} className="EditForm__key-or-id__input" readOnly />
					</div>
				</div>
			);
		}
	},
	renderNameField () {
		var nameField = this.props.list.nameField;
		var nameFieldIsFormHeader = this.props.list.nameFieldIsFormHeader;
		var wrapNameField = field => (
			<div className="EditForm__name-field">
				{field}
			</div>
		);
		if (nameFieldIsFormHeader) {
			var nameFieldProps = this.getFieldProps(nameField);
			nameFieldProps.label = null;
			nameFieldProps.size = 'full';
			nameFieldProps.autoFocus = true;
			nameFieldProps.inputProps = {
				className: 'item-name-field',
				placeholder: nameField.label,
				size: 'large',
			};
			return wrapNameField(
				React.createElement(Fields[nameField.type], nameFieldProps)
			);
		} else {
			return wrapNameField(
				<h2>{this.props.data.name || '(no name)'}</h2>
			);
		}
	},
	renderFormElementsBase(elements) {
		var headings = 0;
		return elements.map((el, index) => {
			// Don't render the name field if it is the header since it'll be rendered in BIG above
			// the list. (see renderNameField method, this is the reverse check of the one it does)
			if (
				this.props.list.nameField
				&& el.field === this.props.list.nameField.path
				&& this.props.list.nameFieldIsFormHeader
			) return;
			if((this.props.list.id == "messages" || this.props.list.id == "scraper-media") && (
				(el.type == "heading" && el.content == "Meta") ||
				(el.type == "field" && el.field == "createdAt") ||
				(el.type == "field" && el.field == "createdBy") ||
				(el.type == "field" && el.field == "updatedAt") ||
				(el.type == "field" && el.field == "updatedBy")))
			return;

			if (el.type === 'heading') {
				headings++;
				el.options.values = this.state.values;
				el.key = 'h-' + headings;
				return React.createElement(FormHeading, el);
			}

			if (el.type === 'field') {
				var field = this.props.list.fields[el.field];
				var props = this.getFieldProps(field);
				if (typeof Fields[field.type] !== 'function') {
					return React.createElement(InvalidFieldType, { type: field.type, path: field.path, key: field.path });
				}
				props.key = field.path;
				if (index === 0 && this.state.focusFirstField) {
					props.autoFocus = true;
				}
				return React.createElement(Fields[field.type], props);
			}
		}, this);
	},
	renderFormElements () {
		return this.renderFormElementsBase(this.props.list.uiElements);
	},
	renderFooterBar () {
		if (this.props.list.noedit && this.props.list.nodelete) {
			return null;
		}

		const { loading, loadingNext, loadingPub, loadingPubNext, loadingHandledAndNext } = this.state;
		const loadingButtonText = loading ? '保存中' : '保存';
		const loadingButtonNext = loadingNext ? '加载中' : '下一个 ↓↓↓';
		const loadingButtonPubSave = loadingPub ? '保存&发布中' : '↑↑↑ 保存并发布';
		const loadingButtonHandledAndNext = loadingHandledAndNext ? '处理并加载中' : '<<< 处理&下一个';
		const loadingButtonPubNext = loadingPubNext ? '发布并加载中' : '发布&下一个 >>>';

		// Padding must be applied inline so the FooterBar can determine its
		// innerHeight at runtime. Aphrodite's styling comes later...
		// console.log('EditForm renderFooterBar', this.props);
		return (
			<FooterBar style={styles.footerbar}>
				<div style={styles.footerbarInner}>
					{!this.props.list.noedit && (
						<LoadingButton
							color="primary"
							disabled={loading}
							loading={loading}
							onClick={this.updateItem}
							data-button="update"
						>
							{loadingButtonText}
						</LoadingButton>
					)}
					{!this.props.list.noedit && (this.props.list.id=="messages" || this.props.list.id=="scraper-media" || this.props.list.id=="scraper-accounts")&&(
						<LoadingButton
							color="primary"
							style={{marginLeft:'10px'}}
							disabled={loadingPub}
							loading={loadingPub}
							onClick={this.pubAndSave}
							data-button="pub&save"
						>
							{loadingButtonPubSave}
						</LoadingButton>
					)}
					{!this.props.list.noedit && (this.props.list.id=="messages" || this.props.list.id=="scraper-media" || this.props.list.id=="scraper-accounts")&&(
						<LoadingButton
							color="primary"
							style={{marginLeft:'10px'}}
							disabled={loadingNext}
							loading={loadingNext}
							onClick={this.getNext}
							data-button="next"
						>
							{loadingButtonNext}
						</LoadingButton>
					)}
					{!this.props.list.noedit && (this.props.list.id=="messages" || this.props.list.id=="scraper-media" || this.props.list.id=="scraper-accounts")&&(
						<LoadingButton
							color="primary"
							style={{marginLeft:'10px'}}
							disabled={loadingHandledAndNext}
							loading={loadingHandledAndNext}
							onClick={this.handledAndNext}
							data-button="handled&next"
						>
							{loadingButtonHandledAndNext}
						</LoadingButton>
					)}
					{!this.props.list.noedit && (this.props.list.id=="messages" || this.props.list.id=="scraper-media" || this.props.list.id=="scraper-accounts")&&(
						<LoadingButton
							color="primary"
							style={{marginLeft:'10px'}}
							disabled={loadingPubNext}
							loading={loadingPubNext}
							onClick={this.pubAndNext}
							data-button="pub&next"
						>
							{loadingButtonPubNext}
						</LoadingButton>
					)}
					{!this.props.list.noedit && (
						<Button disabled={loading} onClick={this.toggleResetDialog} variant="link" color="cancel" data-button="reset">
							<ResponsiveText
								hiddenXS="reset changes"
								visibleXS="reset"
							/>
						</Button>
					)}
					{!this.props.list.nodelete && (
						<Button disabled={loading} onClick={this.toggleDeleteDialog} variant="link" color="delete" style={styles.deleteButton} data-button="delete">
							<ResponsiveText
								hiddenXS={`delete ${this.props.list.singular.toLowerCase()}`}
								visibleXS="delete"
							/>
						</Button>
					)}
				</div>
			</FooterBar>
		);
	},
	renderTrackingMeta () {
		// TODO: These fields are visible now, so we don't want this. We may revisit
		// it when we have more granular control over hiding fields in certain
		// contexts, so I'm leaving this code here as a reference for now - JW
		if (true) return null; // if (true) prevents unreachable code linter errpr

		if (!this.props.list.tracking) return null;

		var elements = [];
		var data = {};

		if (this.props.list.tracking.createdAt) {
			data.createdAt = this.props.data.fields[this.props.list.tracking.createdAt];
			if (data.createdAt) {
				elements.push(
					<FormField key="createdAt" label="Created on">
						<FormInput noedit title={moment(data.createdAt).format('DD/MM/YYYY h:mm:ssa')}>{moment(data.createdAt).format('Do MMM YYYY')}</FormInput>
					</FormField>
				);
			}
		}

		if (this.props.list.tracking.createdBy) {
			data.createdBy = this.props.data.fields[this.props.list.tracking.createdBy];
			if (data.createdBy && data.createdBy.name) {
				let createdByName = getNameFromData(data.createdBy.name);
				if (createdByName) {
					elements.push(
						<FormField key="createdBy" label="Created by">
							<FormInput noedit>{data.createdBy.name.first} {data.createdBy.name.last}</FormInput>
						</FormField>
					);
				}
			}
		}

		if (this.props.list.tracking.updatedAt) {
			data.updatedAt = this.props.data.fields[this.props.list.tracking.updatedAt];
			if (data.updatedAt && (!data.createdAt || data.createdAt !== data.updatedAt)) {
				elements.push(
					<FormField key="updatedAt" label="Updated on">
						<FormInput noedit title={moment(data.updatedAt).format('DD/MM/YYYY h:mm:ssa')}>{moment(data.updatedAt).format('Do MMM YYYY')}</FormInput>
					</FormField>
				);
			}
		}

		if (this.props.list.tracking.updatedBy) {
			data.updatedBy = this.props.data.fields[this.props.list.tracking.updatedBy];
			if (data.updatedBy && data.updatedBy.name) {
				let updatedByName = getNameFromData(data.updatedBy.name);
				if (updatedByName) {
					elements.push(
						<FormField key="updatedBy" label="Updated by">
							<FormInput noedit>{data.updatedBy.name.first} {data.updatedBy.name.last}</FormInput>
						</FormField>
					);
				}
			}
		}

		return Object.keys(elements).length ? (
			<div className="EditForm__meta">
				<h3 className="form-heading">Metasaaaa</h3>
				{elements}
			</div>
		) : null;
	},
	render () {
		var list=this.props.list;
		// console.log('this.props.list.uiElements', this.props.list.uiElements);

		const hotkeyMap = {
			pubAndSaveHotkeys: 'alt+up',
			getNextHotkeys: 'alt+down',
			handledAndNextHotkeys: 'alt+left',
	      	pubAndNextHotkeys: 'alt+right',
	    };
		const hotkeyHandlers = {
            pubAndSaveHotkeys: this.pubAndSave.bind(this),
            getNextHotkeys: this.getNext.bind(this),
            handledAndNextHotkeys: this.handledAndNext.bind(this),
            pubAndNextHotkeys: this.pubAndNext.bind(this),
        };

		return (
			<HotKeys keyMap={hotkeyMap} handlers={hotkeyHandlers} ref={ (c) => this._hotkeyContainer = c } tabIndex="0">
			<form ref="editForm" className="EditForm-container">
				{(this.state.alerts) ? <AlertMessages alerts={this.state.alerts} /> : null}
				{
					list.id=="messages"?(
					<Grid.Row>
						<Grid.Col large="one-third">
							<Form layout="horizontal" component="div" style={{marginRight:20}}>
								{this.renderNameField()}
								{/* {this.renderKeyOrId()} */}
								{this.renderFormElementsBase(this.props.list.uiElements.slice(0,3))}
								{/* {this.renderTrackingMeta()} */}
							</Form>
						</Grid.Col>
						<Grid.Col large="one-third">
							<Form layout="horizontal" component="div" style={{marginRight:20}}>
								 {/* style={{marginLeft:'20px',marginRight:'30px',position:"fixed",top:"300px"}}> */}
								{/* {this.renderNameField()} */}
								{/* {this.renderKeyOrId()} */}
								{this.renderFormElementsBase(this.props.list.uiElements.slice(3,9))}
								{/* {this.renderTrackingMeta()} */}
							</Form>
						</Grid.Col>
						<Grid.Col large="one-third">
							<Form layout="horizontal" component="div" style={{marginRight:20}}>
								 {/* style={{marginLeft:'20px',marginRight:'30px',position:"fixed",top:"300px"}}> */}
								{/* {this.renderNameField()} */}
								{/* {this.renderKeyOrId()} */}
								{this.renderFormElementsBase(this.props.list.uiElements.slice(9))}
								{/* {this.renderTrackingMeta()} */}
							</Form>
						</Grid.Col>
					</Grid.Row>
				): ( list.id=="scraper-media"?(
				<Grid.Row>
					<Grid.Col large="one-third">
						<Form layout="horizontal" component="div" style={{marginRight:20}}>
							{this.renderNameField()}
							{/* {this.renderKeyOrId()} */}
							{this.renderFormElementsBase(this.props.list.uiElements.slice(0, 11))}
							{/* {this.renderTrackingMeta()} */}
						</Form>
					</Grid.Col>
					<Grid.Col large="two-thirds">
						<Form layout="horizontal" component="div" style={{marginRight:20}}>
							 {/* style={{marginLeft:'20px',marginRight:'30px',position:"fixed",top:"300px"}}> */}
							{/* {this.renderNameField()} */}
							{/* {this.renderKeyOrId()} */}
							{this.renderFormElementsBase(this.props.list.uiElements.slice(11))}
							{/* {this.renderTrackingMeta()} */}
						</Form>
					</Grid.Col>
				</Grid.Row>
			): (
					<Grid.Row>
						<Grid.Col large="three-quarters">
							<Form layout="horizontal" component="div">
								{this.renderNameField()}
								{this.renderKeyOrId()}
								{this.renderFormElements()}
								{this.renderTrackingMeta()}
							</Form>
						</Grid.Col>
						<Grid.Col large="one-quarter">
							<Form layout="horizontal" component="div">
								<span />
							</Form>
						</Grid.Col>
					</Grid.Row>
				))
				}
				{this.renderFooterBar()}
				<ConfirmationDialog
					confirmationLabel="Reset"
					isOpen={this.state.resetDialogIsOpen}
					onCancel={this.toggleResetDialog}
					onConfirmation={this.handleReset}
				>
					<p>Reset your changes to <strong>{this.props.data.name}</strong>?</p>
				</ConfirmationDialog>
				<ConfirmationDialog
					confirmationLabel="Delete"
					isOpen={this.state.deleteDialogIsOpen}
					onCancel={this.toggleDeleteDialog}
					onConfirmation={this.handleDelete}
				>
					Are you sure you want to delete <strong>{this.props.data.name}?</strong>
					<br />
					<br />
					This cannot be undone.
				</ConfirmationDialog>
			</form>
			</HotKeys>
		);
	},
});

const styles = {
	footerbar: {
		backgroundColor: fade(theme.color.body, 93),
		boxShadow: '0 -2px 0 rgba(0, 0, 0, 0.1)',
		paddingBottom: 10,
		paddingTop: 10,
		zIndex: 99,
	},
	footerbarInner: {
		height: 54,//theme.component.height, // FIXME aphrodite bug
	},
	deleteButton: {
		float: 'right',
	},
};

module.exports = EditForm;
