import { readFileSync } from 'fs'
import { join } from 'path'
import SkillClient from './SkillClient'

export const dynamic = 'force-static'
export const revalidate = 3600

export default function SkillPage() {
  const content = readFileSync(
    join(process.cwd(), 'public', 'memory-palace-skill.md'),
    'utf-8'
  )

  return <SkillClient content={content} />
}
