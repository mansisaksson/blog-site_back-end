import { Request, Response, Express, NextFunction } from 'express'
import { Protocol, IStoryModel } from '../models'
import { StoryRepository } from '../Repositories'
import { Server } from 'http'

module.exports = function (app: Express) {
    let storyRepo = new StoryRepository()

	// Get File
	app.get('/api/sitemap', function (req: Request, res: Response, next: NextFunction) {
        storyRepo.searchForStories({}).then((stories: IStoryModel[]) => {
            let host = req.protocol + '://' + "www.mansisaksson.com";

            let outURLs = [ host ] // Home page
            stories.forEach((story: IStoryModel) => {
                let viewerURL = host + '/blog-post-viewer/' + story._id;
                outURLs.push(viewerURL)
            })

            res.setHeader('Content-Type', "text/plain")
            res.send(outURLs.join('\n'))
            res.end()
        }).catch(e => Protocol.error(res, "STORY_QUERY_FAILED"))
	})

}