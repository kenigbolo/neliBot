var restify = require('restify');
var builder = require('botbuilder');
var config = require('./config.json');
var http = require('http');
//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 8080, function () {
   console.log('%s listening to %s', server.name, server.url);
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: config.appId,
    appPassword: config.appPassword
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());
//Bot on
bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text(
                  "Hello %s... Thanks for adding me. My name is Neli and I am a bot that helps you with coporate information about\
                  Estonian Comapnies. Test me out by typing 'Get me financial information on Mooncascade' to get the company's financial information", name || 'there'
                );
        bot.send(reply);
    } else {
        // delete their data
    }
});
bot.on('typing', function (message) {
  // User is typing
});
bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});
//=========================================================
// Bots Dialogs
//=========================================================
String.prototype.contains = function(content){
  return this.indexOf(content) !== -1;
}

// Checker function for keywords
function checkMessage(message, valueToCheck) {
  if(message.contains(valueToCheck)) {
    return true;
  }
}

function getInfoRegData(session, company, action) {
    var host = "http://nellychatbot-randomnames.azurewebsites.net/api";
    var params = "?company=%cm&action=%ac".replace(/%cm/, company).replace(/%ac/, action);
    var query = host + params
    console.log(query);
    http.get(query, function(res){
      var buffer = "";
      res.on('data', function(chunk) {
        session.send(res.code);
        buffer += chunk;
      });

      res.on('end', function(){
        var bufferStr = buffer;
        const bufferJson = JSON.parse(bufferStr);
        if (typeof bufferJson.message === 'undefined') {
          session.send("Hey, I couldn't get you the requested information at the moment :D I'm still a work in progress");
        } else {
          session.send(bufferJson.message);
        }
      });

      res.on('error', function(){
        session.send("Hey, I couldn't get find anything on the company. Try again please");
      });
    });
}

function getCompanyName(message){
  var indexValue = message.toLowerCase().lastIndexOf("of ");
  let companyName;
  if (indexValue > 1) {
      return message.substring(indexValue+3);
  }else if (message.toLowerCase().lastIndexOf("on ") > 1) {
      return message.substring(message.toLowerCase().lastIndexOf("on ")+3);
  }
  return companyName;
}

function capitalize(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function defaultErrorMessage(session){
  session.send(`I didn't understand your request. Ask me something like 'financial status of Pipedrive'`);
}

bot.dialog('/', function (session) {
    var message = session.message.text.toLowerCase();
    if(checkMessage(message, 'hello') || checkMessage(message, 'hi')){
      session.send(`Hey, How are you? (wave)`);
    }else if(checkMessage(message, 'help')){
        session.send(`How can I help you?`);
    }else if(checkMessage(message, 'bye')){
        session.send(`Have a nice day (wave)`);
    }else if(checkMessage(message, 'board') || checkMessage(message, 'financial') || checkMessage(message, 'finance')){
      var name = session.message.user ? session.message.user.name : null;
      let companyName;
      if(checkMessage(message, 'board')){
        companyName = getCompanyName(message);
        session.send('Hang on a few seconds while I get you %s board information', companyName);
        getInfoRegData(session, companyName, 'board');
      }else if (checkMessage(message, 'history')) {
        defaultErrorMessage(session);
      }else if (checkMessage(message, 'financial')) {
        companyName = getCompanyName(message);
        session.send('Hang on a few seconds while I get you %s financial information', companyName);
        getInfoRegData(session, companyName, 'financial');
      }else if (checkMessage(message, 'credit')) {
        defaultErrorMessage(session);
      }else {
        session.send('Hey %s... What kind of information exactly do you want and for what company?', capitalize(name) || 'there');
      }
      }else{
        defaultErrorMessage(session);
      }
});
