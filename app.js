import request from 'superagent'
import cheerio from 'cheerio'
import notifier from 'node-notifier'
import Rx from 'rx'
import Promise from 'bluebird'

// fetch pages
const GAMESALE_INDEX_PAGE = 'https://www.ptt.cc/bbs/Gamesale/index.html'
const KEY_PATTERN = /PS4.*售.*巫師3/

const notify = (entryTitle, entryUrl) => {
  notifier.notify({
    title: '有人要賣 巫師3 啦',
    message: entryTitle,
    open: entryUrl
  })
}

const findEntryWithPatternAsync = (pageUrl, keyPattern) => {
  return new Promise((resolve, reject) => {
    request
      .get(pageUrl)
      .end((err, res) => {
        if (err) {
          reject(err)
        }

        const $ = cheerio.load(res.text)
        let entries = []

        cheerio.load(res.text)('.r-ent .title').each((i, elem) => {
          const entryTitle = $(elem).text().trim()
          const entryUrl = 'https://www.ptt.cc' + $(elem).find('a').attr('href')

          if (keyPattern.test(entryTitle)) {
            entries.push({
              title: entryTitle,
              url: entryUrl
            })
          }
        })

        resolve(entries)
      })
  })
}

Rx.Observable
  .timer(0, 10000)
  .flatMap(() => {
    return Rx.Observable
             .fromPromise(findEntryWithPatternAsync(GAMESALE_INDEX_PAGE, KEY_PATTERN))
             .flatMap(x => {
               return Rx.Observable.fromArray(x)
             })
  })
  .distinctUntilChanged()
  .subscribe((x) => {
    notify(x.title, x.url)
  })
