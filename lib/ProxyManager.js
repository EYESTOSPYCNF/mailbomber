const rp = require('request-promise');
const PAgent = require('proxy-agent');
const {
    readFileSync
} = require('fs')
class ProxyManager {
    static init() {
        this.proxies = [];
    }
    static proxyLength() {
        return this.proxies.length
    }
    static shuffle() {
        let currentIndex = this.proxies.length;
        let temporaryValue, randomIndex;

        while (currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex--);
            temporaryValue = this.proxies[currentIndex];

            this.proxies[currentIndex] = this.proxies[randomIndex];
            this.proxies[randomIndex] = temporaryValue;
        }

    }
    static async loadProxiesLink(link) {
        const proxies = await rp.get(link).then(e => {
          let tmp = e.replace(/\r/g, '').split('\n')
          console.log(`Downloaded total of ${tmp.length} proxies`)
            return tmp;
        })
        for (let p of this.proxies) {
            this.proxies.push(p);
        }
        this.shuffle()
    }

    static loadProxies(file) {
        const proxies = readFileSync(file, 'utf8')
            .replace(/\r/g, '')
            .split('\n');

        for (const proxy of this.proxies) {
            if (!proxy.includes('://')) {
                this.proxies[this.proxies.indexOf(proxy)] = 'socks4://' + proxy;
                this.proxies.push('socks5://' + proxy);
                // this.proxies.push('https://' + proxy);
                this.proxies.push('http://' + proxy);
            }
        }

        this.shuffle();
    }

    static getAgent() {
        return new PAgent(this.getProxy());
    }

    static getProxy() {
        return this.proxies[Math.floor(Math.random() * this.proxies.length)];
    }

}

ProxyManager.init();


module.exports = ProxyManager;