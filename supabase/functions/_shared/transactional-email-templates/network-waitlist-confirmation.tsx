import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface NetworkWaitlistConfirmationProps {
  firstName?: string
}

const NetworkWaitlistConfirmationEmail = ({ firstName }: NetworkWaitlistConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You’re on the Faithnancial Network waitlist</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Faithnancial Network</Text>
        <Heading style={h1}>You’re on the waitlist{firstName ? `, ${firstName}` : ''}.</Heading>
        <Text style={text}>
          We received your request to join the Faithnancial Network. Until your invitation opens, keep managing your finances and building your legacy so you’re ready to grow with the trusted network.
        </Text>
        <Text style={text}>
          We’ll notify you when a spot becomes available.
        </Text>
        <Button style={button} href="https://faithnancial.com">
          Return to Faithnancial
        </Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NetworkWaitlistConfirmationEmail,
  subject: 'You’re on the Faithnancial Network waitlist',
  displayName: 'Network waitlist confirmation',
  previewData: { firstName: 'Jordan' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif" }
const container = { padding: '28px 26px' }
const eyebrow = { color: '#059669', fontSize: '12px', fontWeight: 'bold' as const, letterSpacing: '0', margin: '0 0 10px' }
const h1 = { color: '#0f2a1d', fontSize: '24px', lineHeight: '1.25', margin: '0 0 18px', fontWeight: 'bold' as const }
const text = { color: '#496255', fontSize: '15px', lineHeight: '1.6', margin: '0 0 18px' }
const button = { backgroundColor: '#059669', borderRadius: '12px', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, padding: '12px 18px', textDecoration: 'none' }