import { Request, Response, Express, NextFunction } from 'express'
import { Protocol, IStoryModel } from '../models'
import { StoryRepository } from '../Repositories'
import { Server } from 'http'

module.exports = function (app: Express) {
    let storyRepo = new StoryRepository()

    // Get File
    app.get('/api/sitemap', async function (req: Request, res: Response, next: NextFunction) {
        let stories = await storyRepo.searchForStories({})
        if (stories) {
            return Protocol.error(res, "STORY_QUERY_FAILED")
        }

        let host = req.protocol + '://' + "www.mansisaksson.com";

        let outURLs = [host] // Home page
        stories.forEach((story: IStoryModel) => {
            let viewerURL = host + '/view/' + story._id;
            outURLs.push(viewerURL)
        })

        res.setHeader('Content-Type', "text/plain")
        res.send(outURLs.join('\n'))
        res.end()
    })
    
}