const Adapter = require('hubot').Adapter
const User = require('hubot').User
const TextMessage = require('hubot').TextMessage

const QQBot = require("./qqbot");
const config = require('../config');
const auth = require("./qqauth-qrcode");
const defaults = require('./defaults');

const KEY_COOKIES = 'qq-cookies';
const KEY_AUTH = 'qq-auth';

class SmartQQAdapter extends Adapter {
    constructor(robot) {
        super()

        this.robot = robot
        this.robot.logger.info("SmartQQ starting...")
    }

    send(envelope, ...strings) {
        this.robot.logger.info("hubot is sending " + strings)
        console.log(envelope)

        this.qqbot.get_user_uin('43925958', (err, uin)=> {
            this.qqbot.send_message(uin, strings, (ret, e)=> {
                console.log(ret)
            })
        })
    }

    reply(envelope, ...strings) {
        this.robot.logger.info("Reply Message...")
    }

    run() {
        this.robot.logger.info("starting smartqq...")

        var options, self, skip_login;
        const isneedlogin = process.env.HUBOT_QQ_SKIP_LOGIN === 'true';

        return this.getToken(isneedlogin)
            .then(bot => {
                this.qqbot = bot //save to this context
                bot.update_all_members(ret => {
                    if (ret) {
                        this.robot.logger.info('begining qqbot loop enjoy!')

                        this.emit("connected");

                        bot.setMsgListener(msg => {
                            this.robot.logger.info(msg.from_uin + " : " + msg.content);
                            const user = new User(msg.from_uin, {
                                name: msg.from_uin
                            })

                            return this.receive(new TextMessage(user, msg.content, msg.uid))
                        })

                        return Promise.resolve(bot.runloop())
                    }
                })
            })

    }

    getToken(isneedLogin) {
        return new Promise(resolve => {
            auth.login(config, (cookies, authInfo) => {
                defaults.data(KEY_COOKIES, cookies)
                defaults.data(KEY_AUTH, authInfo)

                const bot = new QQBot(cookies, authInfo, config)
                resolve(bot)
            })
        })
    }
}

exports.use = robot => new SmartQQAdapter(robot)
