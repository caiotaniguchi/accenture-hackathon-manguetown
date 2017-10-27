const Conversation = require('watson-developer-cloud/conversation/v1');
const TelegramBot = require('node-telegram-bot-api');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const exec = require('child-process-promise').exec;

mongoose.Promise = Promise;
mongoose.connect('mongodb://127.0.0.1/manguetown', {
  useMongoClient: true
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
const Chat = mongoose.model('Chat', new mongoose.Schema({
    telegramId: String,
    watsonContext: Object,
    updated: { type: Date, default: Date.now }
}));

const bot = new TelegramBot(
  '457433143:AAHZUnQJgGKMC8xvhYCCAnD_MYkOo5pvs7o',
  { polling: true }
);

const conversation = new Conversation({
  'username': "e8433256-cf34-403a-9ab8-99a48ef64425",
  'password': "IDHSjCBzvNsY",
  'version_date': '2017-05-26'
});
conversation.message = Promise.promisify(conversation.message);


bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const payload = {
    workspace_id: '3497d50f-361d-4275-8301-b661be5d07e6',
    input: { text: msg.text },
  };

  return Chat.findOne({ telegramId: msg.chat.id }).then(chat => {
    if (chat) {
      payload.context = chat.watsonContext;
    }

    return conversation.message(payload).then(data => {
      let chatInstance = new Chat({
        telegramId: chatId,
        watsonContext: data.context,
      });
      if (chat) {
        chatInstance = chat;
        chatInstance.watsonContext = data.context;
      }
      return chatInstance.save().then(() => {
        bot.sendMessage(chatId, data.output.text[0]);

        if (data.output.action) {
          const additionalCredit = data.context.total;
          // chamar o modelo
          // data.context.result = model_result(chatId, additionalCredit);
          return exec('docker exec ds python transaction_approval_service.py')
            .then((result) => {
              payload.context = data.context;
              payload.context.result = result.stdout.trim().toLowerCase();
              console.log(JSON.stringify(payload));

              return conversation.message(payload).then(data => {
                chatInstance.watsonContext = data.context;

                return chatInstance.save().then(() => {
                  let options = {};
                  if (payload.context.result === 'true') {
                    options = {
                      reply_markup: JSON.stringify({
                        inline_keyboard: [
                          [{ text: 'Yes', callback_data: 'yes' }],
                          [{ text: 'No', callback_data: 'no' }],
                        ]
                      })
                    };
                  }

                  return bot.sendMessage(chatId, data.output.text[0], options);
                });
              });
            })
            .catch(function (err) {
                console.error('ERROR: ', err);
            });
        }
      });
    });
  });
});

bot.on('callback_query', (res) => {
  const payload = {
    workspace_id: '3497d50f-361d-4275-8301-b661be5d07e6',
    input: { text: res.data },
  };

  return Chat.findOne({ telegramId: res.from.id }).then(chat => {
    payload.context = chat.watsonContext;

    return conversation.message(payload).then(data => {
      chat.watsonContext = data.context;

      return chat.save()
        .then(() => bot.sendMessage(chat.telegramId, data.output.text[0]))
        .then(() => bot.sendMessage(chat.telegramId, data.output.text[1]))
        .then(() => bot.answerCallbackQuery({ callback_query_id: res.id }));
    });
  });
});
