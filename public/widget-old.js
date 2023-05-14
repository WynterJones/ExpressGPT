document.addEventListener('DOMContentLoaded', function () {
  run()
})

const run = () => {
  const companygpt = document.getElementById('companygpt')
  if (companygpt) {
    const shadow = document.createElement('div').attachShadow({ mode: 'open' })

    companygpt.parentNode.insertBefore(shadow, companygpt.nextSibling)

    const widget = document.createElement('div')
    widget.id = 'companygpt-html'
    widget.innerHTML = html
    shadow.appendChild(widget)

    const style = document.createElement('style')
    style.id = 'companygpt-css'
    style.textContent = css
    shadow.appendChild(style)

    Promise.resolve().then(() => {
      engine(companygpt, shadow)
    })
  }
}

const engine = (companygpt, shadow) => {
  const roleDefaults =
    'You must always output in unstyled HTML. For example: <p>a paragraph</p> <h2>Headline</h2>'

  const departments = [
    {
      title: 'Gatekeeper',
      name: companygpt.getAttribute('data-gatekeeper-name'),
      photo: companygpt.getAttribute('data-gatekeeper-photo'),
      role: `You are the gate keeper. You decide whether or not the given message is worth continuing the chat. Decide whether the message is based on the topic. "${companygpt.getAttribute(
        'data-gatekeeper-topic'
      )}". If the message has nothing to do with it. You will respond with only, "Denied: Not on topic. Try again." otherwise you can say why it is a good question or message in one sentence. Output your response as HTML. For example: <strong style="color: green">Approved:</strong> Reason why or <strong style="color: red">Denied:</strong> Stay on topic.`,
    },
    ...parseRoles(),
  ]
  let reports = ''

  const buildDepartments = () => {
    shadow.querySelector('#chat-departments').innerHTML = ''
    for (const department of departments) {
      const div = document.createElement('div')
      div.innerHTML = `<div class="chat-info" style="display:none">
        <div class="chat-title">
          <img class="chat-image" src="${department.photo}" />
          <h3 class="chat-name">${department.name}</h3>
          <p class="chat-role">${department.title}</p>
        </div>
        <div class="chat-content" data-member="${department.name}">
           <img src="https://thumbs.gfycat.com/KindlyActualKawala-size_restricted.gif" style="width: 70px;" />
        </div>
      </div>`
      shadow.querySelector('#chat-departments').appendChild(div)
    }
    shadow.querySelectorAll('#chat-departments .chat-info')[0].style.display = 'block'
  }
  buildDepartments()

  shadow.querySelector('#chat-prompt-restart').addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    shadow.querySelector('#chat-prompt textarea').value = ''
    shadow.querySelector('#chat-prompt').style.display = 'flex'
    shadow.querySelector('#chat-window').style.display = 'none'
    buildDepartments()
  })

  shadow.querySelector('#chat-prompt-send').addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()

    const value = shadow.querySelector('#chat-prompt textarea').value
    chat(value)
    shadow.querySelector('#chat-prompt-record span').textContent = value
    shadow.querySelector('#chat-prompt').style.display = 'none'
    shadow.querySelector('#chat-window').style.display = 'block'
  })

  const chat = async userMessage => {
    const url = document.getElementById('companygpt').getAttribute('src').replace('widget.js', 'chat')

    async function executeChainOfCommand() {
      for (const department of departments) {
        const currentChat = shadow.querySelector('#chat-departments')
        if (!currentChat.textContent.toLowerCase().includes('denied: not on topic')) {
          shadow
            .querySelector(`.chat-content[data-member="${department.name}"]`)
            .closest('.chat-info').style.display = 'block'
          await callOpenAiApi(department)
        }
      }
    }

    const callOpenAiApi = async department => {
      let message = `${userMessage} ${roleDefaults}  Previous reports: ${reports}`
      if (department.title === 'Gatekeeper') {
        message = `${userMessage}`
      }
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          role: department.role,
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.json()
        })
        .then(data => {
          const chatBox = shadow.querySelector(`.chat-content[data-member="${department.name}"]`)
          chatBox.innerHTML = data.reply
          chatBox.style.display = 'block'
          reports += `[Report from ${department.name}, ${department.title}: ${data.reply}]`
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error.message)
        })
    }

    executeChainOfCommand()
  }

  companygpt.parentNode.insertBefore(shadow, companygpt.nextSibling)
}

const parseRoles = () => {
  const roles = []
  let i = 1
  while (true) {
    const name = document.getElementById(`companygpt`).getAttribute(`data-role${i}-name`)
    if (!name) {
      break
    }
    const title = document.getElementById(`companygpt`).getAttribute(`data-role${i}-title`)
    const photo = document.getElementById(`companygpt`).getAttribute(`data-role${i}-photo`)
    const role = document.getElementById(`companygpt`).getAttribute(`data-role${i}-role`)
    roles.push({ name, title, photo, role })
    i++
  }
  return roles
}

const html = `
  <div id="chat-wrapper">
    <div id="chat-prompt">
      <textarea placeholder="What is your idea for your challenge?"></textarea>
      <button id="chat-prompt-send">Ask the Team</button>
    </div>
  
    <div id="chat-window" style="display: none">
      <div id="chat-prompt-record">
        <button id="chat-prompt-restart">Restart</button>
        <strong>Your Request:</strong>
        <span>Your prompt idea here...</span>
      </div>
  
      <div id="chat-departments"></div>
    </div>
  </div>
  `

const css = `
  #chat-wrapper {
      width: 100%;
      background: #fff;
      border: 1px solid #ccc;
      padding: 20px;
      font-family: Arial;
      box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
      box-sizing: border-box;
  }
  
  #chat-prompt {
      width: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
  }
  
  #chat-prompt-send {
      display: block;
      padding: 10px 15px;
      border: 1px solid #2B729C;
      background: #3C9ED8;
      font-weight: 700;
      text-shadow: 1px 1px 0 #2B729C;
      color: #fff;
      border-radius: 5px;
      margin-top: 10px;
      font-size: 18px;
      cursor: pointer;
      box-sizing: border-box;
  }
  
  #chat-prompt-send:hover {
      background: #2B729C;
  }
  
  #chat-prompt textarea {
      height: 70px;
      display: block;
      padding: 16px;
      font-size: 17px;
      border: 1px solid #ccc;
      font-family: Arial, sans-serif;
  }
  
  #chat-prompt-restart {
  float: right;
      padding: 3px 7px;
      border: 1px solid #ccc;
      background: #fafafa;
      color: #000;
      border-radius: 5px;
      font-size: 12px;
      cursor: pointer;
      opacity: .5;
      z-index: 999;
      position: relative;
  }
  #chat-prompt-restart:hover {
  opacity: 1}
  
  #chat-prompt-record {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #ccc;
  }
  
  #chat-prompt-record strong {
      display: block;
      font-size: 14px;
      opacity: 0.6;
      margin-bottom: 5px;
  }
  
  .chat-info {
      background: #fafafa;
      border-radius: 10px;
      padding: 10px 20px;
      border: 1px solid #ddd;
      margin-bottom: 15px;
      border-top: 3px solid #ddd;
      position: relative;
      overflow: hidden;
  }
  .chat-image {
      float: left;
      margin-right: 15px;
      width: 40px;
      border-radius: 100%;
      border: 2px solid #fff;
      box-shadow: 0 5px 10px #999;
  }
  .chat-name {
      font-size: 18px;
      margin: 0;
  }
  .chat-role {
      font-size: 14px;
      margin: 0;
      opacity: 0.5;
      line-height: 1.8em;
  }
  .chat-content {
      padding: 10px;
      padding-top: 30px;
      clear: both;
  }
  .chat-content * {
      line-height: 1.5em;
  }
  .chat-title {
      background: #ccc;
      width: 100%;
      color: #333;
      padding: 20px;
      margin: -10px -20px;
  }
  `
