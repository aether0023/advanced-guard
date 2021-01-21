const chalk = require("chalk");
const moment = require("moment");
const { MessageEmbed } = require("discord.js");
const { SERVER_ID, SAFE_BOTS, MAIN_TOKEN, AUTHOR, SAFE_USERS, STATUS, LOG_CHANNEL } = require("./configurations.json").DEFAULTS;
const { IGNORE_OWNER_MODE, OWNER_GUARD, DANGER_DETECTION, BOT_GUARD, AUDIT_CONTROLLER } = require("./configurations.json").SETTINGS;
const dangerPerms = ["ADMINISTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];

module.exports = {

    approvedConsole: (log = String) => {
        console.log(chalk`{bgGreen [SUCCESSFUL]} ${log}`);
    },

    declinedConsole: (log = String) => {
        console.log(chalk`{bgRed [DECLINED]} ${log}`);
    },

    logMessage: (guild, log = String) => {
        let Guild = guild;
        let Channel = guild.channels.cache.get(LOG_CHANNEL);
        const embed = new MessageEmbed().setTitle(Guild.name, Guild.iconURL({dynamic: true, size: 2048})).setColor("RANDOM").setTimestamp().setFooter(client.users.cache.get(AUTHOR).tag).setDescription(log);
        if (Channel) Channel.send(embed);
    },

    dangerModeControl: async (guild) => {
        let Guild = guild;
        Guild.members.cache.filter(x => !x.user.bot && (dangerPerms.some(y => x.hasPermission(y))) && x.manageable).forEach(async (user, index) => {
           await user.roles.remove(user.roles.cache.filter(x => dangerPerms.some(y => x.permissions.has(y)))).catch();
        });
    },

    clientAuthorSend: (guild, log = String) => {
        let Guild = guild;
        const author = guild.members.cache.get(AUTHOR);
        const embed = new MessageEmbed().setTitle(Guild.name, Guild.iconURL({dynamic: true, size: 2048})).setColor("RANDOM").setTimestamp().setFooter(client.users.cache.get(AUTHOR).tag).setDescription(log);
        author.send(embed)
    },

    guardConsoleLog: async (guild, value = String, executor = String, type = Number, secondValue = String) => {
        let Guild = guild;
        if (type == 0) {
            let oldRole = Guild.roles.cache.get(value);
            console.log(chalk`{bgYellow [ROLE UPDATE]} a role updated in {underline ${Guild.name}}
- UPDATED ROLE NAME: ${oldRole.name}
- UPDATED ROLE ID: ${value}
- UPDATED ROLE COLOR: ${oldRole.hexColor}
- UPDATED ROLE POSITION: ${oldRole.position}
- UPDATED ROLE MENTIONABLE: ${oldRole.mentionable ? chalk`{bgGreen true}` : chalk`{bgRed false}`}
- UPDATED ROLE HOIST: ${oldRole.hoist ? chalk`{bgGreen true}` : chalk`{bgRed false}`}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
            `)
        } else if (type == 1) {
            let role = Guild.roles.cache.get(value);
            console.log(chalk`{bgRed [ROLE DELETED]} a role deleted in {underline ${Guild.name}}.
- DELETED ROLE ID: ${value}
- DELETED ROLE NAME: ${role.name}
- DELETED ROLE MENTIONABLE: ${role.mentionable ? chalk`{green true}` : chalk`{red false}`}
- DELETED ROLE HOIST: ${role.hoist ? chalk`{green true}` : chalk`{red false}`}
- DELETED ROLE POSITION: ${role.position}
- DELETED ROLE PERMISSIONS: ${role.permissions}
- DELETED ROLE MEMBERS: ${role.members ? role.members.length : 0}
- DELETED ROLE COLOR: {inverse ${role.hexColor}}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
            `)
        } else if (type == 2) {
            let role = Guild.roles.cache.get(value);
            console.log(chalk`{bgCyan [ROLE CREATED]} a role created in {underline ${Guild.name}}.
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
`)
        } else if (type == 3) {
            let channel = Guild.channels.cache.get(value);
            console.log(chalk`{bgYellow [CHANNEL UPDATE]} a channel updated in {underline ${Guild.name}}
- UPDATED CHANNEL ID: ${value}
- UPDATED CHANNEL NAME: ${channel.name}
- UPDATED CHANNEL TYPE: ${channel.type.replace("text", "Metin").replace("voice", "Ses").replace("category", "Kategori")}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
            `)
        } else if (type == 4) {
            let channel = Guild.channels.cache.get(value);
            console.log(chalk`{bgRed [CHANNEL DELETED]} a channel deleted in {underline ${Guild.name}}.
- DELETED CHANNEL ID: ${value}
- DELETED CHANNEL NAME: ${channel.name}
- DELETED CHANNEL TYPE: ${channel.type.replace("text", "Metin").replace("voice", "Ses").replace("category", "Kategori")}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
`)
        } else if (type == 5) {
            let channel = Guild.channels.cache.get(value);
            console.log(chalk`{bgCyan [CHANNEL CREATED]} a channel created in {underline ${Guild.name}}.
- CREATED CHANNEL ID: ${value}
- CREATED CHANNEL NAME: ${channel.name}
- CREATED CHANNEL TYPE: ${channel.type.replace("text", "Metin").replace("voice", "Ses").replace("category", "Kategori")}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
`)
        } else if (type == 6) {
            let user = Guild.members.cache.get(value);
            console.log(chalk`{bgRed [MEMBER BANNED]} a user banned from {underline ${Guild.name}}.
- BANNED USER ID: ${value}
- BANNED USER: ${user.user.tag}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
`)
        } else if (type == 7) {
            let user = Guild.members.cache.get(value);
            console.log(chalk`{bgRed [MEMBER ROLES UPDATED]} a user roles updated in {underline ${Guild.name}}.
- UPDATED USER ID: ${value}
- UPDATED USER: ${user.user.tag}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
`)
        } else if (type == 8) {
            console.log(chalk`{bgRed [GUILD UPDATED]} {underline ${Guild.name}} is updated.
- UPDATED GUILD ID: ${Guild.id}
- UPDATED GUILD NAME: ${Guild.name}
- VANITY URL STOLED?: ${value === secondValue ? chalk`{red Yes}` : chalk`{green No}`}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
            `)
        } else if (type == 9) {
            console.log(chalk`{bgRed [BOT ADDED]} someone trying add bot to ${Guild.name}
- BOT ID: ${value}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
            `)
        } else if (type == 10) {
            let user = Guild.members.cache.get(value);
            console.log(chalk`{bgYellow [MEMBER KICKED]} a user kicked from {underline ${Guild.name}}.
- KICKED USER ID: ${value}
- KICKED USER: ${user.user.tag}
- EXECUTOR: ${Guild.members.cache.get(executor).user.tag} - ${executor} ${!Guild.members.cache.has(executor) ? chalk`{bgGreen BANNED}` : chalk`{bgRed NOT BANNED}`}
- TIMESTAMP: {inverse ${moment().format("YYYY-MM-DD HH:mm:ss")}} 
`)
        }
    }

};
