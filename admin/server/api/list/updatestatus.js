var async = require('async');

var updateStatus = function(req, res, ids, status, callback) {
	var updatedCount = 0;
	req.list.model.find().where('_id').in(ids).exec(function (err, results) {
		if (err) {
			console.log('Error deleting ' + req.list.key + ' items:', err);
			return res.apiError('database error', err);
		}
		async.forEachLimit(results, 10, function (item, next) {
			item.status = status;
			item.save(function (err) {
				if (err) return next(err);
				updatedCount++;
				next();
			});
		}, function () {
			callback && callback(null, updatedCount);
		});
	});
}

module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		console.log('Refusing to update ' + req.list.key + ' items; CSRF failure');
		return res.apiError(403, 'invalid csrf');
	}
	if (req.list.get('nodelete')) {
		console.log('Refusing to update ' + req.list.key + ' items; List.nodelete is true');
		return res.apiError(400, 'nodelete');
	}
	if (req.list.get('noedit')) {
		console.log('Refusing to update ' + req.list.key + ' items; List.noedit is true');
		return res.apiError(400, 'noedit');
	}
	if (!req.body.status) {
		console.log('Refusing to update ' + req.list.key + ' items; The status = ' + req.body.status);
		return res.apiError(400, 'nostatus');
	}
	var ids = req.body.ids || req.body.id || req.params.id;
	if (typeof ids === 'string') {
		ids = ids.split(',');
	}
	if (!Array.isArray(ids)) {
		ids = [ids];
	}
	var uncheckIds = req.body.uncheckIds || req.body.uncheckId || req.params.uncheckId;
	if (typeof uncheckIds === 'string') {
		uncheckIds = uncheckIds.split(',');
	}
	if (!Array.isArray(uncheckIds)) {
		uncheckIds = [uncheckIds];
	}

	if (req.user) {
		var checkResourceId = (keystone.get('user model') === req.list.key);

		var userId = String(req.user.id);
		// check if user can update this resources based on resources ids and userId
		if (checkResourceId && ids.some(function (id) {
			return id === userId;
		})) {
			console.log('Refusing to update ' + req.list.key + ' items; ids contains current User id');
			return res.apiError(403, 'not allowed', 'You can not update yourself');
		}
	}
	async.parallel({
		updatedCheckIds(callback) {
			updateStatus(req, res, ids, req.body.status, callback);
		},
		updatedUncheckIds(callback) {
			updateStatus(req, res, uncheckIds, req.body.uncheckStatus, callback);
		}
	}, function(err, result) {
		return res.json({
			success: err ? false : true,
			result: result,
		});
	});
};
