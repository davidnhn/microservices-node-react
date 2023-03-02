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

  comments.push({ id: commentId, content, status: 'pending' });

  commentsByPostsId[req.params.id] = comments;

  try {
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentCreated',
      data: {
        id: commentId,
        content,
        postId: req.params.id,
        status: 'pending',
      },
    });
  } catch (err) {
    console.log(err.message);
  }

  res.status(201).send(comments);
});

app.post('/events', async (req, res) => {
  console.log('Event Received : ', req.body.type);

  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    // on reçoit le commentaire dont le status a été modifier dans le service moderation, on update le commentaire puis on l'envoie a query service
    const { postId, id, status, content } = data;

    const comments = commentsByPostsId[postId];
    const comment = comments.find((comment) => {
      return comment.id === id;
    });

    comment.status = status;

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,
        status,
        postId,
        content,
      },
    });
  }
  res.send({});
});

app.listen(4001, () => {
  console.log('Listening on 4001');
});
