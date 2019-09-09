const Discord = require('discord.js');
const bot = new Discord.Client();

// Discord Token
const token = 'NjE5NDE3ODkyOTQ5MDY1NzM4.XXH7-A.wmxf9bOnlTamlN4989ssOiT_7vkç';

const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');

const creds = require('./client_secret.json');

// Rows in Spreadsheet
var rows;
var sheet;

// Accesses Spreadsheet 
async function accessSpreadsheet() {
    const doc = new GoogleSpreadsheet('1a2cUyq0w9W981cR5iRUD3kNOxfNyonD0bJQ3LdoXBvo');
    await promisify(doc.useServiceAccountAuth)(creds);

    const info = await promisify(doc.getInfo)();

    sheet = info.worksheets[0];

    rows = await promisify(sheet.getRows)({
        offset: 1
    });

}

// Check if user exists in the Spreadsheet 
// returns true if exists; false otherwise
function checkUsers(name) {    

    var check = false;

    rows.forEach(row => {
        console.log(name, row.username);
        if (name === row.username) {
            check = true;
        }
    });

    return check;

}


// Returns the username
function getUser(msg) {

    var hashIndex = (msg.member.user.tag).indexOf('#');
    return msg.member.user.tag.substring(0, hashIndex);

}

// Returns userID
function getUserID(msg) {
    return msg.member.user.id;
}

// Adds 1 to order number
function incrementOrder(name, userID) {

    accessSpreadsheet();

    rows.forEach(row => {

        if (name === row.username) {
            var order = parseInt(row.orders) + 1;
            row.orders = String(order);
            row.userid = userID;
            row.save()

            updateRank();
        }

    });

}

// Update Ranks
function updateRank(name) {
    
    accessSpreadsheet();

    rows.forEach(row => {

        if (name === row.username) {
        
            var order = parseInt(row.orders);
            if (order < 5) {
                row.ranks = `Bronze`;
            }
            else if (order < 10) {
                row.ranks = `Silver`;
            }
            else if (order < 15) {
                row.ranks = `Gold`;
            }
            else if (order < 20) {
                row.ranks = `Platinum`;
            }
            else {
                row.ranks = `Diamond`;
            }
            row.save();
        }

    });

}

// Gets a user's rank
function getRank(name) {

    updateRank(name);

    var rank = '';

    rows.forEach(row => {
        if (name === row.username) {
            rank = row.ranks;
        }
    });

    return rank;
} 

// Get Number of user's order
function getOrderNum(name) {

    var orderNum;

    rows.forEach(row => {
        if (name === row.username) {
            orderNum = row.orders;
        }
    });

    return orderNum;

}

// Add new user row
// Sets user's rank to Bronze and orders to 1
async function addUserRow(username, userID) {

    const row = {
        username: username,
        userid: userID,
        ranks: 'Bronze',
        orders: '1'
    };

    await promisify(sheet.addRow)(row);

}


// On ready queue
bot.on('ready', () => {
    console.log('Success bot is online!')
});


// Function for checking ranks
// If '!rank', shows message owner's rank
// If '!rank *username*', shows message of *username*
// Else, show error message
bot.on('message', msg => {

    const PREFIX = "!";
    var username = getUser(msg);

    let args = msg.content.substring(PREFIX.length).split(" ");

    switch(args[0]) {

        case 'rank':

            var message = '';
            if (args.length == 1) {
                var order = getOrderNum(username);
            }
            else {
                var order = getOrderNum(args[1]);
            }
            

            // Sets message based off of order numbers
            if (!checkUsers(username)) {
                msg.channel.send(`${ msg.author.toString() }, you have not posted in #success!`)
            }
            else{
                updateRank(username);
                if (order < 5) {
                    message = `You are eligible for giveaways! Post in #success ${ 5 - order } more times to rank up!`;
                }
                else if (order < 10) {
                    message = `You are eligible for 55% off any DD order and giveaways! Post in #success ${ 10 - order } more times to rank up!`;
                }
                else if (order < 15) {
                    message = `You are eligible for 55% off any DD order and premium giveaways! Post in #success ${ 15 - order } more times to rank up!`;
                }
                else if (order < 20) {
                    message = `You are eligible for 60% off any DD order, premium giveaways, and FREE Lifetime Spotify Premium! Post in #success ${ 20 - order } more times to rank up!`;
                }
                else if (order >= 20) {
                    message = `You are eligible for 60% off any DD order, premium giveaways, and FREE Lifetime Spotify Premium!`;
                }
    
                // Check if is just '!rank'
                if (args.length == 1) {
                    msg.channel.send(`${ msg.author.toString() } your rank is ${ getRank(username) }! ${ message }`);
                }
                // Check if is '!rank *username*'
                else if (checkUsers(args[1])) {
                    // updateRank(args[1]);

                    msg.channel.send(`${ args[1].toString() } your rank is ${ getRank(args[1]) }! ${ message }`);
                }
                else {
                    msg.channel.send('Provided username is not registered with success-bot!');
                }
            }
            break;
            case 'orders':
                if (args.length == 1) {
                    if (checkUsers(username)) {
                        msg.channel.send(`${ msg.author.toString() }, you have ${ getOrderNum(username) } orders!`);
                    }
                    else {
                        msg.channel.send(`You have not posted in #success!`)
                    }
                }
                else if (checkUsers(args[1])){
                    msg.channel.send(`${ args[1] } has ${ getOrderNum(args[1]) }`);
                }
                else {
                    msg.channel.send(`User has not posted in #success!`);
                }
                
    }

});


// Function checks reacts 
// If user exists increment counter
// Else, add a row for user
bot.on('messageReactionAdd', (reaction, user) => {

    accessSpreadsheet();

    if(reaction.emoji.name === "❤") {

        var username = reaction.message.author.username;
        var userID = reaction.message.author.id;

        if (checkUsers(username)) {
            incrementOrder(username, userID);
        }
        else {
            addUserRow(username, userID);
        }
    }
});

// Function Calls
accessSpreadsheet();
bot.login(token);