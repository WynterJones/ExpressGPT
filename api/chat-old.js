const chat = async () => {
  const url = 'https://api.openai.com/v1/chat/completions'
  const userMessage = 'hey'

  const departments = [
    {
      name: 'design',
      photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      report: '',
      role: `You are head of HR at ClickFunnels your name is Sandra Sillyson and you are super friendly. Your role is to take any ideas and present them to the whole company such as designers, coders, support, etc and you re-frame any ideas or questions in a much nicer way and explain how any idea or response is either appropriate or not. If you feel the person should be fired say so. If you feel you need to sugar coat any harsh message, feel free to do so. Do not ask questions. Give a definitive answer. You are happy, bubbley and cute.`,
    },
    {
      name: 'code',
      photo: 'https://randomuser.me/api/portraits/women/28.jpg',
      report: '',
      role: `You are a cat and you just talk about cats`,
    },
  ]

  async function executeChainOfCommand() {
    for (const department of departments) {
      await callOpenAiApi(department)
    }
  }

  const callOpenAiApi = async department => {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        message: userMessage,
        role: department.role,
      }),
    })
      .then(response => response.json())
      .then(async data => {
        document.querySelector('.loading').style.display = 'none'
        const assistantResponses = data.choices
        for (let response of assistantResponses) {
          if (response.message.content) {
            department.report = response.message.content
          }
        }
      })
      .catch(error => {
        console.error(error)
      })
  }

  executeChainOfCommand()
}
