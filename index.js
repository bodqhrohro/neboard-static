const express = require('express')
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const fs = require('fs');

const app = express()

const TITLE = 'Neboard static backup';
const root = '../apibak';

const wrapHTML = function(title, children) {
	const body = React.createElement('div', {key: 'body'}, [
		React.createElement('header', {key: 'header'}, [
			React.createElement('a', {key: 'home', className: 'home', href: '/'}, title === TITLE ? '' : '⌂'),
			React.createElement('h1', {key: 'h1'}, title),
		]),
		...children
	]);
	return React.createElement('html', null, [
		React.createElement('head', {key: 'head'}, [
			React.createElement('meta', {charSet: 'utf-8', key: 'charset'}),
			React.createElement('meta', {name: 'viewport', content: 'width=device-width, initial-scale=1'}),
			React.createElement('title', {key: 'title'}, title),
			React.createElement('link', {key: 'title', rel: 'stylesheet', href: '/static/neboard.css'}),
		]),
		body
	]);
};

const renderPost = function(post) {
	return React.createElement('div', {key: post.id, className: 'post'}, [
		React.createElement('div', {key: 'post-head', className: 'post-head'}, [
			React.createElement('a', {key: 'post-anchor', name: post.id}),
			React.createElement('a', {key: 'post-id', className: 'post-id', href: '/thread/' + (post.opening ? post.id : `${post.thread}#${post.id}`)}, `#${post.id}`),
			React.createElement('span', {key: 'post-date', className: 'post-date'}, post.pubTime),
			post.postCount ? React.createElement('span', {key: 'post-count', className: 'post-count'}, `${post.postCount}/300`) : null,
			React.createElement('span', {key: 'post-title', className: 'post-title'}, post.title),
		]),
		React.createElement('div', {key: 'post-body', className: 'post-body'}, [
			React.createElement('div', {key: 'post-attachments', className: 'post-attachments'}, post.attachments.map((attachment, i) => React.createElement('div', {key: `attachment${i}`, className: 'post-attachment', dangerouslySetInnerHTML: {__html: attachment.attachment.content}}))),
			React.createElement('div', {key: 'post-body-text', className: 'post-body-text', dangerouslySetInnerHTML: {__html: post.text}}),
		]),
	]);
};

app.get('/', function(req, res) {
	try {
		const page = parseInt(req.query.page) || 'main';
		const contents = React.createElement('div', {key: 'posts', className: 'posts'}, JSON.parse(fs.readFileSync(`../apibak/${page}.json`)).models.map((post) => {
			return renderPost(post.openingPost);
		}));
		const navigation = React.createElement('div', {key: 'navigation', className: 'navigation'}, [
			React.createElement('a', {key: 'left', className: 'navigation-left', href: '/' + ((page > 1) ? `?page=${page-1}`: '')}, (page !== 'main') ? '<<<' : null),
			React.createElement('output', {key: 'counter', className: 'navigation-counter'}, page),
			React.createElement('a', {key: 'right', className: 'navigation-right', href: `/?page=${(page === 'main') ? 1 : (page + 1)}`}, '>>>'),
		]);
		res.send(ReactDOMServer.renderToStaticMarkup(wrapHTML(TITLE, [navigation, contents, navigation])));
	} catch(e) {
		res.send(e.code);
	}
});
app.get('/thread/:id(\\d+)', function(req, res) {
	try {
		const model = JSON.parse(fs.readFileSync(`../apibak/posts/${req.params.id}.json`)).models[0];
		const contents = React.createElement('div', {key: 'posts', className: 'posts'}, model.posts.map((post) => {
			return renderPost(post);
		}));
		res.send(ReactDOMServer.renderToStaticMarkup(wrapHTML(model.title, [contents])));
	} catch(e) {
		res.send(e.code);
	}
});

app.use('/static', express.static('static'));
app.listen(11111);
