const { Client } = require("discord.js");
const { AUTHOR, SERVER_ID, SAFE_BOTS, SAFE_USERS } = require("./configurations.json").DEFAULTS;
const { IGNORE_OWNERS, OWNER_ROLE } = require("./configurations.json").SETTINGS.IGNORE_OWNER_MODE;
const perms = ["ADMINSTRATOR", "KICK_MEMBERS", "MANAGE_GUILD", "BAN_MEMBERS", "MANAGE_ROLES", "MANAGE_WEBHOOKS", "MANAGE_CHANNELS"];

module.exports = class AetherClient extends Client {
    constructor(token) {
        super();
        this.token = token;
        this.author = AUTHOR;
        this.closeAllPermissionsFromRoles = async () => {
            let g = this.guilds.cache.get(SERVER_ID);
            if (!g) return;
            g.roles.cache.filter(r => r.editable && perms.some(x => r.permissions.has(x))).forEach(async (x) => {
                await x.setPermissions(0);
            });   
        };
        this.punish = async (id) => {
            let g = this.guilds.cache.get(SERVER_ID);
            if (!g) return;
            let m = g.members.cache.get(id);
            if (!m) return;
            m.ban({reason: "Aether Guard"}).catch();
        };
        this.whitelisted = function (id) {
            let g = this.guilds.cache.get(SERVER_ID);
            let m = g.members.cache.get(id);
            if (!m || m.id === this.user.id || SAFE_BOTS.includes(m.id) || SAFE_USERS.includes(m.id) || (IGNORE_OWNERS === true && m.roles.cache.has(OWNER_ROLE))) return true;
            else return false;
        };
        this.renk = {
            "mor": "#3c0149",
            "mavi": "#10033d",
            "turkuaz": "#00ffcb",
            "kirmizi": "#750b0c",
            "yesil": "#032221"
        };
        this.randomColor = function () {
            return this.renk[Object.keys(this.renk).random()];
        };
        Array.prototype.random = function () {
            return this[Math.floor((Math.random()*this.length))];
          };
    };
};