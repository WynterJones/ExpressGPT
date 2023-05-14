const { Configuration, OpenAIApi } = require('openai')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const chat = async (req, res) => {
  try {
    const completion = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL,
      messages: [
        { role: 'system', content: req.body.role },
        { role: 'user', content: req.body.message },
      ],
      temperature: parseInt(process.env.OPENAI_TEMPERATURE),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS),
      frequency_penalty: parseInt(process.env.OPENAI_FREQUENCY_PENALTY),
      presence_penalty: parseInt(process.env.OPENAI_PRESENCE_PENALTY),
    })

    if (completion.data.choices[0].message.content) {
      return res.status(200).send({
        reply: completion.data.choices[0].message.content,
      })
    } else {
      return res.status(200).send('I do not understand.')
    }
  } catch (error) {
    console.error(error)
    return res.status(500).send(error || 'Something went wrong')
  }
}

module.exports = chat
