import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Faithnancial"

interface InvestorCommunicationProps {
  startupName?: string
  subject?: string
  message?: string
  senderName?: string
  meetingLink?: string
}

const InvestorCommunicationEmail = ({
  startupName = 'Your Investment Group',
  message = '',
  senderName = 'Admin',
  meetingLink,
}: InvestorCommunicationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Message from {startupName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{startupName}</Heading>
        <Hr style={hr} />
        <Text style={text}>{message}</Text>
        {meetingLink && (
          <>
            <Button style={joinBtn} href={meetingLink}>
              Join Meeting
            </Button>
            <Text style={linkNote}>
              Or copy this link: {meetingLink}
            </Text>
          </>
        )}
        <Hr style={hr} />
        <Text style={footer}>
          Sent by {senderName} on behalf of {startupName}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvestorCommunicationEmail,
  subject: (data: Record<string, any>) =>
    data.subject || `Update from ${data.startupName || 'your investment group'}`,
  displayName: 'Investor communication',
  previewData: {
    startupName: 'Fellows Investment Group',
    subject: 'Important Update',
    message: 'This is an important update regarding your investment.',
    senderName: 'Admin',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#3b82f6', margin: '0 0 8px' }
const hr = { borderColor: '#e5e7eb', margin: '20px 0' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-wrap' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '16px 0 0' }
const joinBtn = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  margin: '0 0 8px',
}
const linkNote = { fontSize: '12px', color: '#999999', margin: '0 0 16px', wordBreak: 'break-all' as const }
