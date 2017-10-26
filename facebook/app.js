const fs = require('fs')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const rp = require('request-promise');
const Promise = require('bluebird');
const Conversation = Promise.promisifyAll(require('watson-developer-cloud/conversation/v1'));

const app = express();

app.use(bodyParser.urlencoded({"extended": false}));
app.use(bodyParser.json());

http.createServer(app).listen(8000);

const PAGE_ACCESS_TOKEN = 'EAABZCK5heo28BALBZCypTaqScyvM4w43LAV5q0bZA9pKOsa9vhlqsQjIIVcHeQymAMiYdWE4ohB7qWX1sVw91YF3ViTKcHS0RHN20EQbvS5ZCtTQal7D4Wq2CWk69454bbEq6irAeuqQ2OnALmMuVqZAvKQR4t1ZBNF46HNZAclxAZDZD'

const conversation = new Conversation({
  'username': "e8433256-cf34-403a-9ab8-99a48ef64425",
  'password': "IDHSjCBzvNsY",
  'version_date': '2017-05-26'
});
const workspace = '3497d50f-361d-4275-8301-b661be5d07e6';

app.get('/', function (req, res) {
  console.log('Home accessed');
  res.header('Content-type', 'text/html');
  return res.end('<h1>Hello, Secure World!</h1>');
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'manguetown') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  const data = req.body;
  console.log('Request received');
  if (data.object === 'page') {
    console.log('App found');
    data.entry.forEach(function(entry) {
      const pageID = entry.id;
      const timeOfEvent = entry.time;

      processedMessages = []

      entry.messaging.forEach(function(event) {
        console.log('Message');
        if (event.message) {
          processedMessages.append(receivedMessage(event, res));
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    return Promise.all(processedMessages).then(() => {
      res.sendStatus(200);
    });
  }
});


function receivedMessage(event, res) {
  console.log("Received message for user %d and page %d at %d with message:",
    event.sender.id, event.recipient.id, event.timestamp);
  console.log(JSON.stringify(event.message));

  if (messageText) {
    const payload = {
      workspace_id: workspace,
      context: {
        done: true,
        total: "@sys-currency",
        result: true
      },
      input: event.message.text
    };

    return conversation.message(payload).then(data => {
      return sendTextMessage(event.recipient.id, data.output.text.values[0])
    }).catch((err) => {
      return res.status(err.code || 500).json(err);
    });
  }
}

function sendTextMessage(recipientId, messageText) {
  return rp({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText
      }
    }
  }).then((res) => {
    console.log("Successfully sent generic message with id %s to recipient %s",
      res.body.message_id, res.body.recipient_id);
  }).catch((err) => {
    console.error("Unable to send message.");
    console.error(err);
  });
};
