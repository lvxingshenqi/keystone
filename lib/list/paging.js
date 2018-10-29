/* @flow weak */
/**
 * Gets a special Query object that will paging documents in the list
 *
 * Example:
 *     list.paging({
 *         page: 1,
 *         perPage: 100,
 *         maxPages: 10
 *     }).exec(function(err, results) {
 *         // do something
 *     });
 *
 * @param {Object} options
 * @param {Function} callback (optional)
 */
function paging (options, callback) {
	var model = this.model;

	options = options || {};

	var query = model.find(options.filters, options.optionalExpression);

	query._original_exec = query.exec;
	query._original_sort = query.sort;
	query._original_select = query.select;

	var currentPage = Number(options.page) || 1;
	var resultsPerPage = Number(options.perPage) || 50;
	var maxPages = Number(options.maxPages) || 10;
	var skip = (currentPage - 1) * resultsPerPage;

	query.select = function () {
		options.select = arguments[0];
		return query;
	};

	query.sort = function () {
		options.sort = arguments[0];
		return query;
	};

	query.exec = function (callback) {
		query.find().limit(resultsPerPage).skip(skip);

		// apply the select and sort options before calling exec
		if (options.select) {
			query._original_select(options.select);
		}

		if (options.sort) {
			query._original_sort(options.sort);
		}

		query._original_exec(function (err, results) {
			if (err) return callback(err);
			var rtn = {
				results: results,
				currentPage: currentPage,
				next: !!(results && results.length > 0),
			};
			callback(err, rtn);
		});
	};

	if (callback) {
		return query(callback);
	} else {
		return query;
	}
}

module.exports = paging;
