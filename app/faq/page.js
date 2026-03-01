import { FAQ_TEXT } from './content'
import FaqClient from './FaqClient'

export const dynamic = 'force-static'
export const revalidate = 3600

export default function FaqPage() {
  return <FaqClient content={FAQ_TEXT} />
}
