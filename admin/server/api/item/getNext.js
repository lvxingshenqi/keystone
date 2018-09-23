const assign = require('object-assign');

module.exports=function(req,res){
	let conditions={};
	let options={limit:1,sort:{"date":-1, "insertDate":-1}}
	assign(conditions,req.query);

	req.list.model.find(conditions,null,options,function(err,items){
		if (err) return res.status(500).json({ err: 'database error', detail: err });
		if(!items||items.length==0) return res.json({
			result: 'no more item satisfied with options',
		});
		return res.json({
			result: items[0]
		})
	})
}
