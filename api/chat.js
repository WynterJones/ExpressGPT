const { Configuration, OpenAIApi } = require('openai')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const chat = async (req, res) => {
  console.log({ role: 'system', content: req.body.role }, { role: 'user', content: req.body.message })
  try {
    const completion = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: req.body.role },
        { role: 'user', content: req.body.message },
      ],
    })

    if (completion.data.choices[0].message.content) {
      return res.status(200).send(completion.data.choices[0].message.content)
    } else {
      return res.status(200).send('I do not understand.')
    }
  } catch (error) {
    console.error(error.message)
    return res.status(500).send(error.message || 'Something went wrong')
  }
}

module.exports = chat
