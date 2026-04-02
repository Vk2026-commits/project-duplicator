/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Faithnancial"

interface StartupAssignmentProps {
  memberName?: string
  startupName?: string
  onboardingUrl?: string
}

const StartupAssignmentEmail = ({ memberName, startupName, onboardingUrl }: StartupAssignmentProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been added to {startupName || 'a new investment group'} on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {memberName ? `Welcome, ${memberName}!` : 'Welcome!'}
        </Heading>
        <Text style={text}>
          You have been added to <strong>{startupName || 'a new investment group'}</strong> on {SITE_NAME}.
        </Text>
        <Text style={text}>
          Before you can access this group's information and investment details, you'll need to complete the onboarding process — including reviewing and signing the required agreements.
        </Text>
        {onboardingUrl && (
          <Button style={button} href={onboardingUrl}>
            Complete Onboarding
          </Button>
        )}
        <Text style={text}>
          If you've already completed onboarding for this group, no further action is needed.
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: StartupAssignmentEmail,
  subject: (data: Record<string, any>) => `You've been added to ${data.startupName || 'a new investment group'}`,
  displayName: 'Startup assignment notification',
  previewData: { memberName: 'John Doe', startupName: 'The Fellows Investment Group', onboardingUrl: 'https://example.com/onboarding/abc123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0a0e1a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: 'hsl(217, 91%, 60%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
