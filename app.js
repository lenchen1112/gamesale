import request from 'superagent';
import cheerio from 'cheerio';
import notifier from 'node-notifier';
import Rx from 'rx';
import Promise from 'bluebird';
import { Spinner } from 'cli-spinner';
import Debug from 'debug';

const spinner = new Spinner('processing.. %s');
spinner.setSpinnerString('|/-\\');
spinner.start();

const debug = new Debug('gamesale');

// constants
const GAMESALE_INDEX_PAGE = 'https://www.ptt.cc/bbs/Gamesale/index.html';
const PATTERNS = [
  /PS4.*售.*(人中之龍|人龍).*(0|零)/i,
  /PSV.*售.*魔龍/i
];
const FETCH_PERIOD = 20 * 1000;

// functions
const fetchEntries = pageUrl => {
  return new Promise((resolve, reject) => {
    request
      .get(pageUrl)
      .end((err, res) => {
        if (err) {
          reject(err);
        }

        const $ = cheerio.load(res.text);
        const entries = $('.r-ent .title').map((i, elem) => {
          const title = $(elem).text().trim();
          const url = 'https://www.ptt.cc' + $(elem).find('a').attr('href');

          return {
            title,
            url
          };
        });

        resolve(entries);
      });
  });
};

const filterWithPatterns = patterns => entry => {
  return patterns.map(pattern => pattern.test(entry.title))
                 .reduce((a, b) => a || b, false);
};

const sendNotification = entry => {
  debug('');
  debug(entry);
  debug(new Date());

  notifier.notify({
    title: '徵到啦',
    message: entry.title,
    open: entry.url
  });
};

Rx.Observable
  .timer(0, FETCH_PERIOD)
  .flatMap(fetchEntries(GAMESALE_INDEX_PAGE))
  .flatMap(Rx.Observable.fromArray)
  .filter(filterWithPatterns(PATTERNS))
  .distinct()
  .subscribe(sendNotification);
