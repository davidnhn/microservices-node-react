const express = require('express');
const { randomBytes } = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const axios = require('axios');

app.use(bodyParser.json());
app.use(cors());

const commentsByPostsId = {};

app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostsId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;

  const comments = commentsByPostsId[req.params.id] || [];

  comments.push({ id: commentId, content });

  commentsByPostsId[req.params.id] = comments;

  try {
    await axios.post('http://localhost:4005/events', {
      type: 'CommentCreated',
      data: {
        id: commentId,
        content,
        postId: req.params.id,
      },
    });
  } catch (err) {
    console.log(err.message);
  }

  res.status(201).send(comments);
});

app.post('/events', (req, res) => {
  console.log('Received Eevent', req.body.type);
  res.send({});
});

app.listen(4001, () => {
  console.log('Listening on 4001');
});
