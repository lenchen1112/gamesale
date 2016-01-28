import request from 'superagent'
import cheerio from 'cheerio'
import notifier from 'node-notifier'

// fetch pages
const GAMESALE_INDEX_PAGE = 'https://www.ptt.cc/bbs/Gamesale/index.html'
const KEY_PATTERN = /PS4.*售.*巫師3/

const containsKeyword = (title, pattern) => {
  return pattern.test(title)
}

const findEntryWithPattern = (pageUrl, keyPattern) => {
  request
    .get(pageUrl)
    .end((err, res) => {
      const $ = cheerio.load(res.text)

      cheerio.load(res.text)('.r-ent .title').each((i, elem) => {
        const entryTitle = $(elem).text().trim()
        const entryUrl = 'https://www.ptt.cc' + $(elem).find('a').attr('href')

        if (containsKeyword(entryTitle, keyPattern)) {
          notifier.notify({
            title: '有人要賣 巫師3 啦',
            message: entryTitle,
            open: entryUrl
          })
        }
      })
    })
}

findEntryWithPattern(GAMESALE_INDEX_PAGE, KEY_PATTERN)
