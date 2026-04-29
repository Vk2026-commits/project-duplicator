import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface NetworkInviteProps {
  firstName?: string
  inviteUrl?: string
  expiresIn?: string
}

const NetworkInviteEmail = ({ firstName, inviteUrl = 'https://faithnancial.com', expiresIn = '48 hours' }: NetworkInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You’re invited to join the Faithnancial Network</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>Faithnancial Network Invitation</Text>
        <Heading style={h1}>A spot has opened up{firstName ? `, ${firstName}` : ''}.</Heading>
        <Text style={text}>A spot has opened up in the Faithnancial Network.</Text>
        <Text style={text}>You now have exclusive access to join.</Text>
        <Text style={text}>This invitation is limited and expires in {expiresIn}.</Text>
        <Button style={button} href={inviteUrl}>
          Accept Your Invitation
        </Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NetworkInviteEmail,
  subject: 'You’re invited to join the Faithnancial Network',
  displayName: 'Network invite',
  previewData: { firstName: 'Jordan', inviteUrl: 'https://faithnancial.com/network-invite?token=sample', expiresIn: '48 hours' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif" }
const container = { padding: '28px 26px' }
const eyebrow = { color: '#059669', fontSize: '12px', fontWeight: 'bold' as const, letterSpacing: '0', margin: '0 0 10px' }
const h1 = { color: '#0f2a1d', fontSize: '24px', lineHeight: '1.25', margin: '0 0 18px', fontWeight: 'bold' as const }
const text = { color: '#496255', fontSize: '15px', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#059669', borderRadius: '12px', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const, padding: '12px 18px', textDecoration: 'none' }