module.exports = app => {
  const dotenv = require('dotenv').config()
  const { Client } = require('@notionhq/client')
  const notion = new Client({
    auth: process.env.NOTION_API_KEY,
    headers: {
      'Notion-Version': '2022-02-22' // you can get the latest in the official Notion API docs https://developers.notion.com/
    }
  })

  app.get('/page/:id', async (req, res) => {
    const data = await notion.pages.retrieve({ page_id: req.params.id })

    res.send(data)
  })

  app.get('/database/:id', async (req, res) => {
    const data = await notion.databases.retrieve({ page_id: req.params.id })

    res.send(data)
  })

  app.get('/block/:id', async (req, res) => {
    async function readBlocks (blockId) {
      if (blockId.includes('-')) {
        blockId = blockId.replaceAll('-', '');
      }

      try {
        const { results, ...blockResponse } = await notion.blocks.children.list({ block_id: blockId, page_size: 50 })

        const childRequests = results.map(async (block) => {
          if (block.has_children) {
            const children = await readBlocks(block.id);
            return { ...block, children };
          }
          return block;
        });

        const expandedResults = await Promise.all(childRequests);

        return { ...blockResponse, results: expandedResults };
      } catch (error) {
        console.log('error!');
        console.error(error.body);
      }
    }

    const myResult = await readBlocks(req.params.id)

    // normal block，not get children request

    // const { results, ...blockResponse } = await notion.blocks.children.list({ block_id: req.params.id, page_size: 50 })
    // const childRequests = results.map(async (block) => {
    //   if (block.has_children) {
    //     const children = await readBlocks(block.id);
    //     return { ...block, children };
    //   }
    //   return block;
    // });

    // const expandedResults = await Promise.all(childRequests);

    res.send(myResult)
  })

  // 错误处理函数
  app.use(async (err, req, res, next) => {
    res.status(err.statusCode || 500).send({
      // status: err.statusCode,
      message: err.message
    })
  })
}