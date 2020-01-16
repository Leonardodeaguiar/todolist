const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const Schema = mongoose.Schema;
const port = 8080;

const app = express();

//middlewares
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// database
mongoose.connect('mongodb+srv://Lenrd:l30nardo@cluster-vytov.mongodb.net/todolistDB', {
	useNewUrlParser: true,
	useUnifiedTopology: true
});
const todoSchema = Schema(
	{
		name: {
			type: String,
			require: true
		}
	},
	{ collection: 'todos' }
);

const listSchema = Schema(
	{
		name: {
			type: String,
			require: true
		},
		items: [ todoSchema ]
	},
	{ collection: 'lists' }
);

const Todo = mongoose.model('todo', todoSchema);
const List = mongoose.model('list', listSchema);

//routes
app.get('/', (req, res) => {
	Todo.find({})
		.then((item) => {
			res.render('list', { listTitle: 'Today', items: item });
		})
		.catch((err) => console.log(err));
});

app.post('/', (req, res) => {
	const itemName = req.body.name;
	const listName = req.body.list;
	const item = new Todo({
		name: itemName
	});

	if (listName === 'Today') {
		item
			.save()
			.then(() => {
				res.redirect('/');
			})
			.catch((err) => {
				console.log(err);
			});
	} else {
		// non promise function to add items to cetain model
		List.findOne({ name: listName }, function(error, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect('/' + _.capitalize(listName));
		});
	}
});

app.post('/delete', (req, res) => {
	const itemId = req.body.id;
	const listName = req.body.list;
	if (listName === 'Today') {
		Todo.findByIdAndDelete({ _id: itemId })
			.then(() => {
				res.redirect('/');
			})
			.catch((err) => {
				console.log(err);
			});
	} else {
		List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemId } } })
			.then(() => {
				res.redirect('/' + listName);
			})
			.catch((err) => {
				console.log(error);
			});
	}
});

app.get('/:newList', (req, res) => {
	const newList = _.capitalize(req.params.newList);
	List.findOne({ name: newList }, function(error, foundList) {
		if (!error) {
			if (!foundList) {
				// create new list
				const list = new List({
					name: newList,
					items: []
				});
				list
					.save()
					.then(() => {
						console.log('saved!');
					})
					.catch((err) => {
						console.log(err);
					});
				res.redirect('/' + newList);
			} else {
				res.render('list', {
					listTitle: foundList.name,
					items: foundList.items
				});
			}
		}
	});
});

app.listen(process.env.PORT || port, () => {
	console.log(`server running on ${port}`);
});
