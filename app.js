import request from 'superagent'
import cheerio from 'cheerio'
import mongoose, { Schema } from 'mongoose'
import findOrCreate from 'mongoose-findorcreate'


// set up MongoDB
mongoose.connect('mongodb://localhost/gamesale')
const SaleEntrySchema = new Schema({
  url: String,
  title: String
})
SaleEntrySchema.plugin(findOrCreate)
const SaleEntry = mongoose.model('SaleEntry', SaleEntrySchema)


// fetch pages
const GAMESALE_INDEX_PAGE = 'https://www.ptt.cc/bbs/Gamesale/index.html'

const parsePage = (pageUrl) => {
  request
    .get(pageUrl)
    .end((err, res) => {
      const $ = cheerio.load(res.text)

      $('.r-ent .title').each((i, elem) => {
        SaleEntry.findOrCreate({
          url: $(elem).find('a').attr('href')
        },{
          title: $(elem).text().trim()
        }, () => {})
      })
    })
}

parsePage(GAMESALE_INDEX_PAGE)

// tear down MongoDB
mongoose.disconnect()
