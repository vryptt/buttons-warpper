import makeWASocket, {
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidNewsletter,
  makeCacheableSignalKeyStore,
  proto,
  useMultiFileAuthState,
  WAMessageContent,
  WAMessageKey,
  AnyMessageContent
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import util from 'util'
import readline from 'readline'
import P from 'pino'
import initFunction from "../src"

const logger = P({
  level: "trace",
})
logger.level = 'trace'

const rl = readline.createInterface({
  input: process.stdin, output: process.stdout
})
const question = (text: string) => new Promise<string>((resolve) => rl.question(text, resolve))

const startSock = async () => {
  const {
    state,
    saveCreds
  } = await useMultiFileAuthState('baileys_auth_info')

  const {
    version,
    isLatest
  } = await fetchLatestBaileysVersion()
  console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    generateHighQualityLinkPreview: true,
    getMessage
  })
  
  await initFunction(sock)

  if (!sock.authState.creds.registered) {
    const phoneNumber = await question('Please enter your phone number:\n')
    const code = await sock.requestPairingCode(phoneNumber)
    console.log(`Pairing code: ${code}`)
  }

  const sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
    await sock.presenceSubscribe(jid)
    await delay(500)

    await sock.sendPresenceUpdate('composing', jid)
    await delay(2000)

    await sock.sendPresenceUpdate('paused', jid)

    await sock.sendMessage(jid, msg)
  }

  sock.ev.process(
    async (events) => {
      if (events['connection.update']) {
        const update = events['connection.update']
        const {
          connection,
          lastDisconnect
        } = update
        if (connection === 'close') {
          if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
            startSock()
          } else {
            console.log('Connection closed. You are logged out.')
          }
        }
        console.log('connection update', update)
      }

      if (events['creds.update']) {
        await saveCreds()
      }

      if (events['messages.upsert']) {
        const upsert = events['messages.upsert']
        console.log('recv messages ', JSON.stringify(upsert, undefined, 2))

        if (!!upsert.requestId) {
          console.log("placeholder message received for request of id=" + upsert.requestId, upsert)
        }

        if (upsert.type === 'notify') {
          for (const msg of upsert.messages) {
            if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
              const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
              if (text == "requestPlaceholder" && !upsert.requestId) {
                const messageId = await sock.requestPlaceholderResend(msg.key)
                console.log('requested placeholder resync, id=', messageId)
              }

              if (text == "onDemandHistSync") {
                const messageId = await sock.fetchMessageHistory(50, msg.key, msg.messageTimestamp!)
                console.log('requested on-demand sync, id=', messageId)
              }
              
              if (text == "button") {
                sock.sendButton(msg.key.remoteJid, {
                  title: "ini title",
                  text: 'ini text',
                  footer: 'ini footer',
                  buttons: [
                    { id: "Tombol_1", text: "Tombol 1" },
                    { id: "Tombol_2", text: "Tombol 2" },
                    { id: "Tombol_3", text: "Tombol 3" }
                  ]
                })
              }
            }
          }
        }
      }
    }
  )

  return sock

  async function getMessage(key: WAMessageKey): Promise<WAMessageContent | undefined> {
    return proto.Message.create({
      conversation: 'test'
    })
  }
}

startSock()