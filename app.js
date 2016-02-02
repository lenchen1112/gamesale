import request from 'superagent'
import cheerio from 'cheerio'
import notifier from 'node-notifier'
import Rx from 'rx'
import Promise from 'bluebird'
import { Spinner } from 'cli-spinner'

const spinner = new Spinner('processing.. %s')
spinner.setSpinnerString('|/-\\')
spinner.start()

// fetch pages
const GAMESALE_INDEX_PAGE = 'https://www.ptt.cc/bbs/Gamesale/index.html'
const PATTERNS = [
  /PS4.*售.*(人中之龍|人龍).*(0|零)/i,
  /PSV.*售.*魔龍/i
]
const FETCH_PERIOD = 20 * 1000

const sendNotification = (entry) => {
  console.log('')
  console.log(entry)
  console.log(new Date())
  console.log('')

  notifier.notify({
    title: '徵到啦',
    message: entry.title,
    open: entry.url
  })
}

const findEntryWithPatternAsync = (pageUrl, patterns) => {
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
          const patternMatched = patterns.map(pattern => pattern.test(entryTitle))
                                         .reduce((a, b) => a || b, false)
          if (patternMatched) {
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
  .timer(0, FETCH_PERIOD)
  .flatMap(findEntryWithPatternAsync(GAMESALE_INDEX_PAGE, PATTERNS))
  .flatMap(Rx.Observable.fromArray)
  .distinct()
  .subscribe(sendNotification)
