const assign = require('object-assign');

module.exports=function(req,res){
	let options={};
	assign(options,req.query);
	req.list.model.findOne(options,function(err,item){
		if (err) return res.status(500).json({ err: 'database error', detail: err });
		if(!item) return res.json({
			result: 'no more item satisfied with options',
		});
		return res.json({
			result: item
		})
	})
}