import { TROUBLESHOOT_TEXT } from './content'
import TroubleshootClient from './TroubleshootClient'

export const dynamic = 'force-static'
export const revalidate = 3600

export default function TroubleshootPage() {
  return <TroubleshootClient content={TROUBLESHOOT_TEXT} />
}
