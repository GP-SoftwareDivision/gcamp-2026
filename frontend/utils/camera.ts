import { encode } from 'base-64'

type PtzCommand =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'stop'
  | 'zoomin'
  | 'zoomout'
  | 'zoomstop'

export function sendPtzCommand(rtspUrl: string, command: PtzCommand) {
  if (!rtspUrl) return

  const regex = /rtsp:\/\/(.*?):(.*?)@([^\/:]+)/
  const match = rtspUrl.match(regex)
  if (!match) return

  const [, username, password, ip] = match
  const HTTP_PORT = '8080'
  const baseUrl = `http://${ip}:${HTTP_PORT}/cgi-bin/hi3510`

  let endpoint = ''
  if (['up', 'down', 'left', 'right', 'stop'].includes(command)) {
    endpoint = `/ptzctrl.cgi?-step=0&-act=${command}&-speed=45`
  } else if (command === 'zoomin') {
    endpoint = '/ptzzoomin.cgi'
  } else if (command === 'zoomout') {
    endpoint = '/ptzzoomout.cgi'
  } else if (command === 'zoomstop') {
    endpoint = '/ptzctrl.cgi?-step=0&-act=stop&-speed=45'
  }

  if (!endpoint) return

  const targetUrl = `${baseUrl}${endpoint}`
  const credentials = encode(`${username}:${password}`)

  fetch(targetUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  }).catch(() => undefined)
}
