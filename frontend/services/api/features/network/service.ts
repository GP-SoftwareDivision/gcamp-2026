import { callApi } from '../../core'
import { API_REQUESTS } from '../../contracts'
import type { PublicIpRes } from './types'

export async function getPublicIp(): Promise<PublicIpRes> {
  return callApi<PublicIpRes>({
    ...API_REQUESTS.network.getPublicIp,
  })
}
