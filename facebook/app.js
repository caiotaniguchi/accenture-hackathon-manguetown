const fs = require('fs')
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express();

app.use(bodyParser.urlencoded({"extended": false}));
app.use(bodyParser.json());

http.createServer(app).listen(8000);

const PAGE_ACCESS_TOKEN = 'EAABZCK5heo28BALBZCypTaqScyvM4w43LAV5q0bZA9pKOsa9vhlqsQjIIVcHeQymAMiYdWE4ohB7qWX1sVw91YF3ViTKcHS0RHN20EQbvS5ZCtTQal7D4Wq2CWk69454bbEq6irAeuqQ2OnALmMuVqZAvKQR4t1ZBNF46HNZAclxAZDZD'

const Conversation = require('watson-developer-cloud/conversation/v1');
const conversation = new Conversation({
  'username': "e8433256-cf34-403a-9ab8-99a48ef64425",
  'password': "IDHSjCBzvNsY",
  'version_date': '2017-05-26'
});
const workspace = '3497d50f-361d-4275-8301-b661be5d07e6';

app.get('/', function (req, res) {
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
  if (data.object === 'page') {
    data.entry.forEach(function(entry) {
      const pageID = entry.id;
      const timeOfEvent = entry.time;

      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});


function receivedMessage(event) {
  const senderID = event.sender.id;
  const recipientID = event.recipient.id;
  const timeOfMessage = event.timestamp;
  const message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  const messageId = message.mid;
  const messageText = message.text;

  if (messageText) {
    const payload = {
      workspace_id: workspace,
      context: {
        done: true,
        total: "@sys-currency",
        result: true
      },
      input: messageText
    };

    conversation.message(payload, function(err, data) {
      if (err) {
        return res.status(err.code || 500).json(err);
      }
      return sendTextMessage(recipientId, data.output.text.values[0])
    });
  }
}

function sendTextMessage(recipientId, messageText) {
  const messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const recipientId = body.recipient_id;
      const messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}
