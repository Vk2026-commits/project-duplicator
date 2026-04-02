/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as complianceReminder } from './compliance-reminder.tsx'
import { template as complianceThankYou } from './compliance-thank-you.tsx'
import { template as startupAssignment } from './startup-assignment.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'compliance-reminder': complianceReminder,
  'compliance-thank-you': complianceThankYou,
  'startup-assignment': startupAssignment,
}
