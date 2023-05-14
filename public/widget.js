document.addEventListener('DOMContentLoaded', function () {
  const companygpt = document.getElementById('companygpt')
  if (companygpt) {
    class CompanyGPT extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
        this.shadowRoot.innerHTML = this.getTemplate()
      }

      getTemplate() {
        return `<style>${cleanslate} ${css}</style><div class="companygpt" id="chat-wrapper">${html}</div>`
      }

      connectedCallback() {
        engine(companygpt, this.shadowRoot)
      }
    }

    customElements.define('company-gpt', CompanyGPT)
    companygpt.insertAdjacentHTML('afterend', '<company-gpt></company-gpt>')
  }
})

const engine = (companygpt, shadow) => {
  const formattingResponse = `If you address another team member from this object (Team Members: ${parseTeam()}) wrap their name in <span class="chat-tag"><img src="member.photo" /> @member.name</span>. Don't start your response by stating who you are and you must always output in unstyled HTML. For example: <p>a paragraph</p> <h2>Headline</h2>`

  const departments = [
    {
      title: 'Gatekeeper',
      name: companygpt.getAttribute('gatekeeper-name'),
      photo: companygpt.getAttribute('gatekeeper-photo'),
      color: companygpt.getAttribute('gatekeeper-color'),
      role: `You are the gate keeper. You decide whether or not the given message is worth continuing the chat. Decide whether the message is aligned with the goal: "${companygpt.getAttribute(
        'gatekeeper-goal'
      )}". If the message has nothing to do with it. You will respond with only, "Denied: Explain why. Please try again." Otherwise you can say why it is a good question or message in one sentence. Output your response as HTML. For example: <strong style="color: green">Approved:</strong> Reason why or <strong style="color: red">Denied:</strong> Does not align with goal and state the goal. If someone asks you what the point of this is or what this is you can tell them about the chat which is, "${companygpt.getAttribute(
        'gatekeeper-help'
      )}". Only do this if neccessary and output with html <strong style="color: red">Answer:</strong> Give help message.`,
    },
    ...parseRoles(),
  ]
  let reports = ''

  const buildDepartments = () => {
    shadow.querySelector('#chat-departments').innerHTML = ''
    for (const department of departments) {
      const div = document.createElement('div')
      div.innerHTML = `<div class="chat-info" style="display:none !important">
          <div class="chat-title" style="background: ${createGradient(department.color).gradient}; color:${
        createGradient(department.color).textColor
      }">
            <img class="chat-image" src="${department.photo}" />
            <h3 class="chat-name" style="color:${createGradient(department.color).textColor}">${
        department.name
      }</h3>
            <p class="chat-role">${department.title}</p>
          </div>
          <div class="chat-content" member="${department.name}">
             <img src="https://thumbs.gfycat.com/KindlyActualKawala-size_restricted.gif" style="width: 70px;" />
          </div>
        </div>`
      shadow.querySelector('#chat-departments').appendChild(div)
    }
    shadow
      .querySelectorAll('#chat-departments .chat-info')[0]
      .style.setProperty('display', 'block', 'important')
  }

  buildDepartments()

  shadow.querySelector('#chat-prompt-restart').addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    shadow.querySelector('#chat-prompt textarea').value = ''
    shadow.querySelector('#chat-prompt').style.setProperty('display', 'flex', 'important')
    shadow.querySelector('#chat-window').style.setProperty('display', 'none', 'important')
    buildDepartments()
  })

  shadow.querySelector('#chat-prompt textarea').addEventListener('keydown', e => {
    if (e.keyCode === 13) {
      e.preventDefault()
      e.stopPropagation()
      run()
    }
  })

  if (companygpt.getAttribute('button-text')) {
    shadow.querySelector('#chat-prompt-send').textContent = companygpt.getAttribute('button-text')
  } else {
    shadow.querySelector('#chat-prompt-send').textContent = 'Send Proposal'
  }

  if (companygpt.getAttribute('explainer')) {
    shadow.querySelector('#chat-explainer').innerHTML = companygpt.getAttribute('explainer')
  } else {
    shadow.querySelector('#chat-explainer').innerHTML = 'Get Response from Team of Chatbots'
  }

  if (companygpt.getAttribute('headline')) {
    shadow.querySelector('#chat-headline').innerHTML = companygpt.getAttribute('headline')
  } else {
    shadow.querySelector('#chat-headline').innerHTML = 'CompanyGPT'
  }

  if (companygpt.getAttribute('notice')) {
    shadow.querySelector('#chat-notice').innerHTML = companygpt.getAttribute('notice')
  } else {
    shadow.querySelector('#chat-notice').innerHTML =
      'Powered by CompanyGPT (GPT-4) by <a href="https://companygpt.wynter.ai">CompanyGPT</a>'
  }

  if (companygpt.getAttribute('label')) {
    shadow.querySelector('#chat-label').innerHTML = companygpt.getAttribute('label')
  } else {
    shadow.querySelector('#chat-label').innerHTML = 'Your proposal'
  }

  if (companygpt.getAttribute('reset-button')) {
    shadow.querySelector('#chat-reset-button').innerHTML = companygpt.getAttribute('reset-button')
  } else {
    shadow.querySelector('#chat-reset-button').innerHTML = 'Reset'
  }

  shadow
    .querySelector('#chat-prompt textarea')
    .setAttribute('placeholder', companygpt.getAttribute('message-placeholder'))

  shadow.querySelector('#chat-prompt-send').addEventListener('click', e => {
    e.preventDefault()
    e.stopPropagation()
    run()
  })

  const run = () => {
    const value = shadow.querySelector('#chat-prompt textarea').value
    chat(value)
    shadow.querySelector('#chat-prompt-record #chat-old-prompt').textContent = value
    shadow.querySelector('#chat-prompt').style.setProperty('display', 'none', 'important')
    shadow.querySelector('#chat-window').style.setProperty('display', 'block', 'important')
  }

  const chat = async userMessage => {
    const url = document.getElementById('companygpt').getAttribute('src').replace('widget.js', 'chat')

    async function executeChainOfCommand() {
      for (const department of departments) {
        const currentChat = shadow.querySelector('#chat-departments')
        if (
          !currentChat.textContent.toLowerCase().includes('denied:') &&
          !currentChat.textContent.toLowerCase().includes('answer:')
        ) {
          shadow
            .querySelector(`.chat-content[member="${department.name}"]`)
            .closest('.chat-info')
            .style.setProperty('display', 'block', 'important')
          await callOpenAiApi(department)
        }
      }
    }

    const callOpenAiApi = async department => {
      let message = `${userMessage} ${formattingResponse} Previous reports: ${reports}`
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
          const chatBox = shadow.querySelector(`.chat-content[member="${department.name}"]`)
          chatBox.innerHTML = data.reply
          chatBox.style.setProperty('display', 'block', 'important')
          reports += `[Reply from ${department.name}, ${department.title}: ${data.reply}]`
        })
        .catch(error => {
          console.error('There has been a problem with your fetch operation:', error.message)
        })
    }

    executeChainOfCommand()
  }
}

const parseRoles = () => {
  const roles = []
  let i = 1
  while (true) {
    const name = document.getElementById(`companygpt`).getAttribute(`role${i}-name`)
    if (!name) {
      break
    }
    const title = document.getElementById(`companygpt`).getAttribute(`role${i}-title`)
    const photo = document.getElementById(`companygpt`).getAttribute(`role${i}-photo`)
    const role = document.getElementById(`companygpt`).getAttribute(`role${i}-role`)
    const color = document.getElementById(`companygpt`).getAttribute(`role${i}-color`)
    roles.push({ name, title, photo, role, color })
    i++
  }
  return roles
}

const parseTeam = () => {
  const team = []
  let i = 1
  while (true) {
    const name = document.getElementById(`companygpt`).getAttribute(`role${i}-name`)
    if (!name) {
      break
    }
    const title = document.getElementById(`companygpt`).getAttribute(`role${i}-title`)
    const photo = document.getElementById(`companygpt`).getAttribute(`role${i}-photo`)
    const color = document.getElementById(`companygpt`).getAttribute(`role${i}-color`)
    team.push({ name, title, photo, color })
    i++
  }
  return JSON.stringify(team)
}

const createGradient = hexColor => {
  function darkenColor(color, percent) {
    var f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff
    return (
      '#' +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      )
        .toString(16)
        .slice(1)
    )
  }

  function getTextColor(color) {
    var r = parseInt(color.slice(1, 3), 16),
      g = parseInt(color.slice(3, 5), 16),
      b = parseInt(color.slice(5, 7), 16)
    var yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? 'black' : 'white'
  }

  var darkerColor = darkenColor(hexColor, 0.1)
  var textColor = getTextColor(hexColor)
  var gradient = `linear-gradient(${hexColor}, ${darkerColor})`

  return {
    gradient: gradient + ' !important',
    textColor: textColor + ' !important',
  }
}

const html = `
<div id="chat-prompt">
    <h2 id="chat-headline">CompanyGPT</h2>
    <p id="chat-explainer">A chatbot for a company of GPT-4 roles.</p>
    <textarea placeholder="What is your idea for your challenge?"></textarea>
    <button id="chat-prompt-send">Ask the Team</button>
    <p id="chat-notice">Chatbots using CompanyGPT & OpenAI GPT-4</p>
</div>

<div id="chat-window" style="display: none !important">
    <div id="chat-prompt-record">
        <button id="chat-prompt-restart"><span id="chat-reset-button">Restart</span></button>
        <strong id="chat-label">Your Request:</strong>
        <span id="chat-old-prompt">Your prompt idea here...</span>
    </div>

    <div id="chat-departments"></div>
</div>
  `

const css = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap');
div.companygpt#chat-wrapper * {
    font-family: 'Open Sans', sans-serif !important;
}
  .companygpt#chat-wrapper {
      width: 100% !important;
      background: #fff !important;
      border: 1px solid #ccc !important;
      padding: 20px !important;
      font-family: Arial !important;
      box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px !important;
      box-sizing: border-box !important;
      border-radius: 4px !important;
      position: relative !important;
  }

  .companygpt .chat-tag {
    padding: 3px !important;
    background: #eee !important;
    font-weight: 700 !important;
    font-size: 12px !important;
    border-radius: 8px !important;
  }
  .companygpt .chat-tag img {
    width: 12px !important;
    margin-right: 5px !important;
    vertical-align: middle !important;
    border-radius: 100% !important;
  }
  
  .companygpt #chat-prompt {
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
  }

  .companygpt #chat-explainer {
    margin: 0 !important;
    margin-bottom: 15px !important;
    font-size: 16px !important;
    line-height: 1.4em !important;
}
.companygpt #chat-label {
    display: block !important;
    width: 60% !important;
      font-size: 14px !important;
      opacity: 0.6 !important;
      margin-bottom: 15px !important;
}
.companygpt h2#chat-headline {
    margin: 0 !important;
    margin-bottom: 5px !important;
    padding: 0 !important;
    font-size: 20px !important;
    line-height: 1.4em !important;
}
.companygpt #chat-notice {
    margin: 0 !important;
    margin-top: 10px !important;
    font-size: 12px !important;
    color: #A7BCC8 !important;
}
  
  .companygpt #chat-prompt-send {
      display: block !important;
      padding: 10px 15px !important;
      border: 1px solid #2B729C !important;
      background: #3C9ED8 !important;
      font-weight: 700 !important;
      text-shadow: 1px 1px 0 #2B729C !important;
      color: #fff !important;
      border-radius: 5px !important;
      margin: 0 !important;
      margin-top: 10px !important;
      font-size: 18px !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
  }
  
  .companygpt #chat-prompt-send:hover {
      background: #2B729C !important;
  }
  
  .companygpt #chat-prompt textarea {
      height: auto !important;
      display: block !important;
      padding: 16px !important;
      font-size: 17px !important;
      border: 1px solid #ccc !important;
      font-family: Arial, sans-serif !important;
      margin: 0 !important;
      line-height: 1.4em !important;
      border-radius: 4px !important;
  }
  
  .companygpt #chat-prompt-restart {
      padding: 3px 7px !important;
      border: 1px solid #ccc !important;
      background: #fafafa !important;
      color: #000 !important;
      border-radius: 5px !important;
      font-size: 12px !important;
      cursor: pointer !important;
      opacity: .5 !important;
      z-index: 99999 !important;
      position: absolute !important;
      top: 20px !important;
      right: 20px !important;
  }
  .companygpt #chat-prompt-restart * {
    cursor: pointer !important;
  }
  .companygpt #chat-prompt-restart:hover {
  opacity: 1!important;}
  
  .companygpt #chat-prompt-record {
      font-size: 18px !important;
      font-weight: 500 !important;
      margin: 0 !important;
      margin-bottom: 20px !important;
  }
  .companygpt #chat-prompt-record p {
    line-height: 1.4em !important;
  }

  .companygpt a {
    color: #3C9ED8 !important;
  }
  
  
  
  .companygpt .chat-info {
      background: #fff !important;
      padding: 10px 20px !important;
      margin-bottom: 35px !important;
      position: relative !important;
  }
  .companygpt  .chat-info:last-child {
    margin-bottom: 0 !important;
  }
  .companygpt .chat-image {
      float: left !important;
      margin-right: 15px !important;
      width: 50px !important;
      border-radius: 6px !important;
      margin-top: -5px !important;
      border: 2px solid rgba(255,255,255,0.5) !important;
      overflow: hidden !important;
  }
  .companygpt .chat-name {
      font-size: 18px !important;
      margin: 0 !important;
      padding-top: 4px !important;
      font-weight: 800 !important;
  }
  .companygpt .chat-role {
      font-size: 14px !important;
      margin: 0 !important;
      opacity: 0.5 !important;
      line-height: 1.8em !important;
      font-weight: 100 !important;

  }
  .companygpt .chat-content {
      padding: 30px 10px !important;
      clear: both !important;
  }
  .companygpt .chat-content * {
      line-height: 1.5em !important;
  }
  .companygpt .chat-title {
      background: #ccc !important;
      width: 100% !important;
      color: #333 !important;
      padding: 20px !important;
      border-radius: 6px !important;
      margin: -10px -20px !important;
  }
  `

const cleanslate = `
.companygpt, .companygpt h1, .companygpt h2, .companygpt h3, .companygpt h4, .companygpt h5, .companygpt h6, .companygpt p, .companygpt td, .companygpt dl, .companygpt tr, .companygpt dt, .companygpt ol, .companygpt form, .companygpt select, .companygpt option, .companygpt pre, .companygpt div, .companygpt table,  .companygpt th, .companygpt tbody, .companygpt tfoot, .companygpt caption, .companygpt thead, .companygpt ul, .companygpt li, .companygpt address, .companygpt blockquote, .companygpt dd, .companygpt fieldset, .companygpt li, .companygpt iframe, .companygpt strong, .companygpt legend, .companygpt em, .companygpt summary, .companygpt cite, .companygpt span, .companygpt input, .companygpt sup, .companygpt label, .companygpt dfn, .companygpt object, .companygpt big, .companygpt q, .companygpt samp, .companygpt acronym, .companygpt small, .companygpt img, .companygpt strike, .companygpt code, .companygpt sub, .companygpt ins, .companygpt textarea, .companygpt button, .companygpt var, .companygpt a, .companygpt abbr, .companygpt applet, .companygpt del, .companygpt kbd, .companygpt tt, .companygpt b, .companygpt i, .companygpt hr,

/* HTML5 - Sept 2013 taken from MDN https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/HTML5_element_list */
.companygpt article, .companygpt aside, .companygpt figure, .companygpt figcaption, .companygpt footer, .companygpt header, .companygpt menu, .companygpt nav, .companygpt section, .companygpt time, .companygpt mark, .companygpt audio, .companygpt video, .companygpt abbr, .companygpt address, .companygpt area, .companygpt blockquote, .companygpt canvas, .companygpt caption, .companygpt cite, .companygpt code, .companygpt colgroup, .companygpt col, .companygpt datalist, .companygpt fieldset, .companygpt main, .companygpt map, .companygpt meta, .companygpt optgroup, .companygpt output, .companygpt progress, .companygpt svg {
    background-attachment:scroll !important;
    background-color:transparent !important;
    background-image:none !important; /* This rule affects the use of pngfix JavaScript http://dillerdesign.com/experiment/DD_BelatedPNG for IE6, which is used to force the browser to recognise alpha-transparent PNGs files that replace the IE6 lack of PNG transparency. (The rule overrides the VML image that is used to replace the given CSS background-image). If you don't know what that means, then you probably haven't used the pngfix script, and this comment may be ignored :) */
    background-position:0 0 !important;
    background-repeat:repeat !important;
    border-color:black !important;
    border-color:currentColor !important; /* border-color should match font color. Modern browsers (incl. IE9) allow the use of "currentColor" to match the current font 'color' value <http://www.w3.org/TR/css3-color/#currentcolor>. For older browsers, a default of 'black' is given before this rule. Guideline to support older browsers: if you haven't already declared a border-color for an element, be sure to do so, e.g. when you first declare the border-width. */
    border-radius:0 !important;
    border-style:none !important;
    border-width:medium !important;
    bottom:auto !important;
    clear:none !important;
    clip:auto !important;
    color:inherit !important;
    counter-increment:none !important;
    counter-reset:none !important;
    cursor:auto !important;
    direction:inherit !important;
    display:inline !important;
    float:none !important;
    font-family: inherit !important; /* As with other inherit values, this needs to be set on the root container element */
    font-size: inherit !important;
    font-style:inherit !important;
    font-variant:normal !important;
    font-weight:inherit !important;
    height:auto !important;
    left:auto !important;
    letter-spacing:normal !important;
    line-height:inherit !important;
    list-style-type: inherit !important; /* Could set list-style-type to none */
    list-style-position: outside !important;
    list-style-image: none !important;
    margin:0 !important;
    max-height:none !important;
    max-width:none !important;
    min-height:0 !important;
    min-width:0 !important;
    opacity:1;
    outline:invert none medium !important;
    overflow:visible !important;
    padding:0 !important;
    position:static !important;
    quotes: "" "" !important;
    right:auto !important;
    table-layout:auto !important;
    text-align:inherit !important;
    text-decoration:inherit !important;
    text-indent:0 !important;
    text-transform:none !important;
    top:auto !important;
    unicode-bidi:normal !important;
    vertical-align:baseline !important;
    visibility:inherit !important;
    white-space:normal !important;
    width:auto !important;
    word-spacing:normal !important;
    z-index:auto !important;

    /* CSS3 */
    /* Including all prefixes according to http://caniuse.com/ */
    /* CSS Animations don't cascade, so don't require resetting */
    -webkit-background-origin: padding-box !important;
            background-origin: padding-box !important;
    -webkit-background-clip: border-box !important;
            background-clip: border-box !important;
    -webkit-background-size: auto !important;
       -moz-background-size: auto !important;
            background-size: auto !important;
    -webkit-border-image: none !important;
       -moz-border-image: none !important;
         -o-border-image: none !important;
            border-image: none !important;
    -webkit-border-radius:0 !important;
       -moz-border-radius:0 !important;
            border-radius: 0 !important;
    -webkit-box-shadow: none !important;
            box-shadow: none !important;
    -webkit-box-sizing: content-box !important;
       -moz-box-sizing: content-box !important;
            box-sizing: content-box !important;
    -webkit-column-count: auto !important;
       -moz-column-count: auto !important;
            column-count: auto !important;
    -webkit-column-gap: normal !important;
       -moz-column-gap: normal !important;
            column-gap: normal !important;
    -webkit-column-rule: medium none black !important;
       -moz-column-rule: medium none black !important;
            column-rule: medium none black !important;
    -webkit-column-span: 1 !important;
       -moz-column-span: 1 !important; /* doesn't exist yet but probably will */
            column-span: 1 !important;
    -webkit-column-width: auto !important;
       -moz-column-width: auto !important;
            column-width: auto !important;
    font-feature-settings: normal !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    -webkit-hyphens: manual !important;
       -moz-hyphens: manual !important;
            hyphens: manual !important;
    -webkit-perspective: none !important;
       -moz-perspective: none !important;
        -ms-perspective: none !important;
         -o-perspective: none !important;
            perspective: none !important;
    -webkit-perspective-origin: 50% 50% !important;
       -moz-perspective-origin: 50% 50% !important;
        -ms-perspective-origin: 50% 50% !important;
         -o-perspective-origin: 50% 50% !important;
            perspective-origin: 50% 50% !important;
    -webkit-backface-visibility: visible !important;
       -moz-backface-visibility: visible !important;
        -ms-backface-visibility: visible !important;
         -o-backface-visibility: visible !important;
            backface-visibility: visible !important;
    text-shadow: none !important;
    -webkit-transition: all 0s ease 0s !important;
            transition: all 0s ease 0s !important;
    -webkit-transform: none !important;
       -moz-transform: none !important;
        -ms-transform: none !important;
         -o-transform: none !important;
            transform: none !important;
    -webkit-transform-origin: 50% 50% !important;
       -moz-transform-origin: 50% 50% !important;
        -ms-transform-origin: 50% 50% !important;
         -o-transform-origin: 50% 50% !important;
            transform-origin: 50% 50% !important;
    -webkit-transform-style: flat !important;
       -moz-transform-style: flat !important;
        -ms-transform-style: flat !important;
         -o-transform-style: flat !important;
            transform-style: flat !important;
    word-break: normal !important;
}

/* == BLOCK-LEVEL == */
/* Actually, some of these should be inline-block and other values, but block works fine (TODO: rigorously verify this) */
/* HTML 4.01 */
.companygpt, .companygpt h3, .companygpt h5, .companygpt p, .companygpt h1, .companygpt dl, .companygpt dt, .companygpt h6, .companygpt ol, .companygpt form, .companygpt option, .companygpt pre, .companygpt div, .companygpt h2, .companygpt caption, .companygpt h4, .companygpt ul, .companygpt address, .companygpt blockquote, .companygpt dd, .companygpt fieldset, .companygpt hr,

/* HTML5 new elements */
.companygpt article, .companygpt dialog, .companygpt figure, .companygpt footer, .companygpt header, .companygpt hgroup, .companygpt menu, .companygpt nav, .companygpt section, .companygpt audio, .companygpt video, .companygpt address, .companygpt blockquote, .companygpt colgroup, .companygpt main, .companygpt progress, .companygpt summary {
    display:block !important;
}
.companygpt h1, .companygpt h2, .companygpt h3, .companygpt h4, .companygpt h5, .companygpt h6 {
    font-weight: bold !important;
}
.companygpt h1 {
    font-size: 2em !important;
    padding: .67em 0 !important;
}
.companygpt h2 {
    font-size: 1.5em !important;
    padding: .83em 0 !important;
}
.companygpt h3 {
    font-size: 1.17em !important;
    padding: .83em 0 !important;
}
.companygpt h4 {
    font-size: 1em !important;
}
.companygpt h5 {
    font-size: .83em !important;
}
.companygpt p {
    margin: 1em 0 !important;
}
.companygpt table {
    display: table !important;
}
.companygpt thead {
    display: table-header-group !important;
}
.companygpt tbody {
    display: table-row-group !important;
}
.companygpt tfoot {
    display: table-footer-group !important;
}
.companygpt tr {
    display: table-row !important;
}
.companygpt th, .companygpt td {
    display: table-cell !important;
    padding: 2px !important;
}

/* == SPECIFIC ELEMENTS == */
/* Some of these are browser defaults; some are just useful resets */
.companygpt ol, .companygpt ul {
    margin: 1em 0 !important;
}
.companygpt ul li, .companygpt ul ul li, .companygpt ul ul ul li, .companygpt ol li, .companygpt ol ol li, .companygpt ol ol ol li, .companygpt ul ol ol li, .companygpt ul ul ol li, .companygpt ol ul ul li, .companygpt ol ol ul li {
    list-style-position: inside !important;
    margin-top: .08em !important;
}
.companygpt ol ol, .companygpt ol ol ol, .companygpt ul ul, .companygpt ul ul ul, .companygpt ol ul, .companygpt ol ul ul, .companygpt ol ol ul, .companygpt ul ol, .companygpt ul ol ol, .companygpt ul ul ol {
    padding-left: 40px !important;
    margin: 0 !important;
}
/* helper for general navigation */
.companygpt nav ul, .companygpt nav ol {
    list-style-type:none !important;

}
.companygpt ul, .companygpt menu {
    list-style-type:disc !important;
}
.companygpt ol {
    list-style-type:decimal !important;
}
.companygpt ol ul, .companygpt ul ul, .companygpt menu ul, .companygpt ol menu, .companygpt ul menu, .companygpt menu menu {
    list-style-type:circle !important;
}
.companygpt ol ol ul, .companygpt ol ul ul, .companygpt ol menu ul, .companygpt ol ol menu, .companygpt ol ul menu, .companygpt ol menu menu, .companygpt ul ol ul, .companygpt ul ul ul, .companygpt ul menu ul, .companygpt ul ol menu, .companygpt ul ul menu, .companygpt ul menu menu, .companygpt menu ol ul, .companygpt menu ul ul, .companygpt menu menu ul, .companygpt menu ol menu, .companygpt menu ul menu, .companygpt menu menu menu {
    list-style-type:square !important;
}
.companygpt li {
    display:list-item !important;
    /* Fixes IE7 issue with positioning of nested bullets */
    min-height:auto !important;
    min-width:auto !important;
    padding-left: 20px !important; /* replace -webkit-padding-start: 40px; */
}
.companygpt strong {
    font-weight:bold !important;
}
.companygpt em {
    font-style:italic !important;
}
.companygpt kbd, .companygpt samp, .companygpt code, .companygpt pre {
  font-family:monospace !important;
}
.companygpt a {
    color: blue !important;
    text-decoration: underline !important;
}
.companygpt a:visited {
    color: #529 !important;
}
.companygpt a, .companygpt a *, .companygpt input[type=submit], .companygpt input[type=button], .companygpt input[type=radio], .companygpt input[type=checkbox], .companygpt select, .companygpt button {
    cursor:pointer !important;
}
.companygpt button, .companygpt input[type=submit] {
    text-align: center !important;
    padding: 2px 6px 3px !important;
    border-radius: 4px !important;
    text-decoration: none !important;
    font-family: arial, helvetica, sans-serif !important;
    font-size: small !important;
    background: white !important;
    -webkit-appearance: push-button !important;
    color: buttontext !important;
    border: 1px #a6a6a6 solid !important;
    background: lightgrey !important; /* Old browsers */
    background: rgb(255,255,255); /* Old browsers */
    background: -moz-linear-gradient(top,  rgba(255,255,255,1) 0%, rgba(221,221,221,1) 100%, rgba(209,209,209,1) 100%, rgba(221,221,221,1) 100%) !important; /* FF3.6+ */
    background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(255,255,255,1)), color-stop(100%,rgba(221,221,221,1)), color-stop(100%,rgba(209,209,209,1)), color-stop(100%,rgba(221,221,221,1))) !important; /* Chrome,Safari4+ */
    background: -webkit-linear-gradient(top,  rgba(255,255,255,1) 0%,rgba(221,221,221,1) 100%,rgba(209,209,209,1) 100%,rgba(221,221,221,1) 100%) !important; /* Chrome10+,Safari5.1+ */
    background: -o-linear-gradient(top,  rgba(255,255,255,1) 0%,rgba(221,221,221,1) 100%,rgba(209,209,209,1) 100%,rgba(221,221,221,1) 100%) !important; /* Opera 11.10+ */
    background: -ms-linear-gradient(top,  rgba(255,255,255,1) 0%,rgba(221,221,221,1) 100%,rgba(209,209,209,1) 100%,rgba(221,221,221,1) 100%) !important; /* IE10+ */
    background: linear-gradient(to bottom,  rgba(255,255,255,1) 0%,rgba(221,221,221,1) 100%,rgba(209,209,209,1) 100%,rgba(221,221,221,1) 100%) !important; /* W3C */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#ffffff', endColorstr='#dddddd',GradientType=0 ) !important; /* IE6-9 */
    -webkit-box-shadow: 1px 1px 0px #eee !important;
       -moz-box-shadow: 1px 1px 0px #eee !important;
         -o-box-shadow: 1px 1px 0px #eee !important;
            box-shadow: 1px 1px 0px #eee !important;
    outline: initial !important;
}
.companygpt button:active, .companygpt input[type=submit]:active, .companygpt input[type=button]:active, .companygpt button:active {
	background: rgb(59,103,158) !important; /* Old browsers */
	background: -moz-linear-gradient(top, rgba(59,103,158,1) 0%, rgba(43,136,217,1) 50%, rgba(32,124,202,1) 51%, rgba(125,185,232,1) 100%) !important; /* FF3.6+ */
	background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(59,103,158,1)), color-stop(50%,rgba(43,136,217,1)), color-stop(51%,rgba(32,124,202,1)), color-stop(100%,rgba(125,185,232,1))) !important; /* Chrome,Safari4+ */
	background: -webkit-linear-gradient(top, rgba(59,103,158,1) 0%,rgba(43,136,217,1) 50%,rgba(32,124,202,1) 51%,rgba(125,185,232,1) 100%) !important; /* Chrome10+,Safari5.1+ */
	background: -o-linear-gradient(top, rgba(59,103,158,1) 0%,rgba(43,136,217,1) 50%,rgba(32,124,202,1) 51%,rgba(125,185,232,1) 100%) !important; /* Opera 11.10+ */
	background: -ms-linear-gradient(top, rgba(59,103,158,1) 0%,rgba(43,136,217,1) 50%,rgba(32,124,202,1) 51%,rgba(125,185,232,1) 100%) !important; /* IE10+ */
	background: linear-gradient(to bottom, rgba(59,103,158,1) 0%,rgba(43,136,217,1) 50%,rgba(32,124,202,1) 51%,rgba(125,185,232,1) 100%) !important; /* W3C */
	border-color: #5259b0 !important;
}
.companygpt button {
    padding: 1px 6px 2px 6px !important;
    margin-right: 5px !important;
}
.companygpt input[type=hidden] {
    display:none !important;
}
/* restore form defaults */
.companygpt textarea {
    -webkit-appearance: textarea !important;
    background: white !important;
    padding: 2px !important;
    margin-left: 4px !important;
    word-wrap: break-word !important;
    white-space: pre-wrap !important;
    font-size: 11px !important;
    font-family: arial, helvetica, sans-serif !important;
    line-height: 13px !important;
    resize: both !important;
}
.companygpt select, .companygpt textarea, .companygpt input {
    border:1px solid #ccc !important;
}
.companygpt select {
    font-size: 11px !important;
    font-family: helvetica, arial, sans-serif !important;
    display: inline-block;
}
.companygpt textarea:focus, .companygpt input:focus {
    outline: auto 5px -webkit-focus-ring-color !important;
    outline: initial !important;
}
.companygpt input[type=text] {
    background: white !important;
    padding: 1px !important;
    font-family: initial !important;
    font-size: small !important;
}
.companygpt input[type=checkbox], .companygpt input[type=radio] {
    border: 1px #2b2b2b solid !important;
    border-radius: 4px !important;
}
.companygpt input[type=checkbox], .companygpt input[type=radio] {
    outline: initial !important;
}
.companygpt input[type=radio] {
    margin: 2px 2px 3px 2px !important;
}
.companygpt abbr[title], .companygpt acronym[title], .companygpt dfn[title] {
    cursor:help !important;
    border-bottom-width:1px !important;
    border-bottom-style:dotted !important;
}
.companygpt ins {
    background-color:#ff9 !important;
    color:black !important;
}
.companygpt del {
    text-decoration: line-through !important;
}
.companygpt blockquote, .companygpt q  {
    quotes:none !important; /* HTML5 */
}
.companygpt blockquote:before, .companygpt blockquote:after, .companygpt q:before, .companygpt q:after, .companygpt li:before, .companygpt li:after  {
    content:"" !important;
}
.companygpt input, .companygpt select {
    vertical-align:middle !important;
}

.companygpt table {
    border-collapse:collapse !important;
    border-spacing:0 !important;
}
.companygpt hr {
    display:block !important;
    height:1px !important;
    border:0 !important;
    border-top:1px solid #ccc !important;
    margin:1em 0 !important;
}
.companygpt *[dir=rtl] {
    direction: rtl !important;
}
.companygpt mark {
    background-color:#ff9 !important;
    color:black !important;
    font-style:italic !important;
    font-weight:bold !important;
}
.companygpt menu {
    padding-left: 40px !important;
    padding-top: 8px !important;
}

/* additional helpers */
.companygpt [hidden],
.companygpt template {
    display: none !important;
}
.companygpt abbr[title] {
    border-bottom: 1px dotted !important;
}
.companygpt sub, .companygpt sup {
    font-size: 75% !important;
    line-height: 0 !important;
    position: relative !important;
    vertical-align: baseline !important;
}
.companygpt sup {
    top: -0.5em !important;
}
.companygpt sub {
    bottom: -0.25em !important;
}
.companygpt img {
    border: 0 !important;
}
.companygpt figure {
    margin: 0 !important;
}
.companygpt textarea {
    overflow: auto !important;
    vertical-align: top !important;
}

/* == ROOT CONTAINER ELEMENT == */
/* This contains default values for child elements to inherit  */
.companygpt {
    font-size: medium !important;
    line-height: 1 !important;
    direction:ltr !important;
    text-align: left !important; /* for IE, Opera */
    text-align: start !important; /* recommended W3C Spec */
    font-family: "Times New Roman", Times, serif !important; /* Override this with whatever font-family is required */
    color: black !important;
    font-style:normal !important;
    font-weight:normal !important;
    text-decoration:none !important;
    list-style-type:disc !important;
}

.companygpt pre {
    white-space:pre !important;
}

.companygpt h1,.companygpt h2,.companygpt h3,.companygpt h4,.companygpt h5,.companygpt h6 { font-weight: normal !important; color: #111 !important; margin: 0 !important; padding: 0 !important; }

.companygpt h1 { font-size: 1.5em !important; font-weight: 900 !important; line-height: 1 !important; margin-bottom: 0.5em !important; }
.companygpt h2 { font-size: 1.5em !important;font-weight: 700 !important; margin-bottom: 0.75em !important; }
.companygpt h3 { font-size: 1.4em !important; font-weight: 500 !important; line-height: 1 !important; margin-bottom: 1em !important; }
.companygpt h4 { font-size: 1.2em !important; font-weight: 400 !important;  line-height: 1.25 !important; margin-bottom: 1.25em !important; }
.companygpt h5 { font-size: 1em !important; font-weight: 300 !important; margin-bottom: 1.5em !important; }
.companygpt h6 { font-size: 1em !important; font-weight: 100 !important; }

h1 img, h2 img, h3 img,
h4 img, h5 img, h6 img {
  margin: 0 !important;
}

/* Text elements
-------------------------------------------------------------- */

.companygpt p           { margin: 0 0 1.5em !important; }
.companygpt p img.left  { float: left !important; margin: 1.5em 1.5em 1.5em 0 !important; padding: 0 !important; }
.companygpt p img.right { float: right !important; margin: 1.5em 0 1.5em 1.5em !important; }

.companygpt a:focus,
.companygpt a:hover     { color: #000 !important; }
.companygpt a           { color: #009 !important; text-decoration: underline !important; }

.companygpt blockquote  { margin: 1.5em !important; color: #666 !important; font-style: italic !important; }
.companygpt strong      { font-weight: bold !important; }
.companygpt em,dfn      { font-style: italic !important; }
.companygpt dfn         { font-weight: bold !important; }
.companygpt ssup, sub    { line-height: 0 !important; }

abbr,
acronym     { border-bottom: 1px dotted #666 !important; }
address     { margin: 0 0 1.5em !important; font-style: italic !important; }
del         { color:#666 !important; }

pre 				{ margin: 1.5em 0 !important; white-space: pre !important; }
pre,code,tt { font: 1em 'andale mono', 'lucida console', monospace !important; line-height: 1.5 !important; }

/* Lists
-------------------------------------------------------------- */

li ul,
li ol       { margin:0 1.5em !important; }
ul, ol      { margin: 0 1.5em 1.5em 1.5em !important; }

ul          { list-style-type: disc !important; }
ol          { list-style-type: decimal !important; }

dl          { margin: 0 0 1.5em 0 !important; }
dl dt       { font-weight: bold !important; }
dd          { margin-left: 1.5em !important;}

/* Tables
-------------------------------------------------------------- */

.companygpt table       { margin-bottom: 1.4em !important; width:100% !important; }
.companygpt th          { font-weight: bold !important; }
.companygpt thead th 		{ background: #c3d9ff !important; }
.companygpt th,td,caption { padding: 4px 10px 4px 5px !important; }
.companygpt tr.even td  { background: #e5ecf9 !important; }
.companygpt tfoot       { font-style: italic !important; }
.companygpt caption     { background: #eee !important; }`
