const fs = require('fs')
const https = require('https')
const http = require('http')
const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const request = require('request')

app.use(bodyParser.urlencoded({"extended": false}));
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = 'EAABZCK5heo28BALBZCypTaqScyvM4w43LAV5q0bZA9pKOsa9vhlqsQjIIVcHeQymAMiYdWE4ohB7qWX1sVw91YF3ViTKcHS0RHN20EQbvS5ZCtTQal7D4Wq2CWk69454bbEq6irAeuqQ2OnALmMuVqZAvKQR4t1ZBNF46HNZAclxAZDZD'

var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  'username': "e8433256-cf34-403a-9ab8-99a48ef64425",
  'password': "IDHSjCBzvNsY",
  'version_date': '2017-05-26'
});

// Endpoint to be call from the client side
  var workspace = '3497d50f-361d-4275-8301-b661be5d07e6';


//https.createServer({
//  key: fs.readFileSync('key.pem'),
//  cert: fs.readFileSync('cert.pem')
//}, app).listen(8443);

http.createServer(app).listen(8000);

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
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    var payload = {
      workspace_id: workspace,
      context: {
        done: true,
        total: "@sys-currency",
        result: true
      },
      input: messageText
    };

    // Send the input to the conversation service
    conversation.message(payload, function(err, data) {
      if (err) {
        return res.status(err.code || 500).json(err);
      }
      return sendTextMessage(recipientId, data.output.text.values[0])
    });
  }
}

function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}
