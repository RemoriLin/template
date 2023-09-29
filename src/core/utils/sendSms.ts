const { Vonage } = require('@vonage/server-sdk')
import { env } from '~/config/env'

const vonage = new Vonage({
  apiKey: '6ade99ca',
  apiSecret: 'sikg92AlQ6FZUarZ',
})

const from = env.APP_NAME

export async function sendSMS(to: string, text: string) {
  await vonage.sms
    .send({ to, from, text })
    .then((resp: any) => {
      console.log('Message sent successfully')
      console.log(resp)
    })
    .catch((err: any) => {
      console.log('There was an error sending the messages.')
      console.error(err)
    })
}
