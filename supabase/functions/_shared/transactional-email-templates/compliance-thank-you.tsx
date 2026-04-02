import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "The Fellows Investment Group"

interface ComplianceThankYouProps {
  name?: string
}

const ComplianceThankYouEmail = ({ name }: ComplianceThankYouProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Thank you for completing your agreements — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>
            ✅ All Agreements Signed
          </Heading>
        </Section>

        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'}
        </Text>

        <Text style={text}>
          Thank you for signing all of your required agreements with {SITE_NAME}. Your commitment to the group and its mission is greatly appreciated.
        </Text>

        <Text style={text}>
          You are now fully compliant and have full access to all investment opportunities, meetings, and group resources. We look forward to building wealth together.
        </Text>

        <Section style={buttonSection}>
          <Button style={button} href="https://seed-path-portal.lovable.app/dashboard">
            Go to Dashboard
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Best regards,<br />
          {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ComplianceThankYouEmail,
  subject: 'Thank you for signing your agreements!',
  displayName: 'Compliance Thank You',
  previewData: { name: 'John' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '580px', margin: '0 auto' }
const headerSection = { backgroundColor: 'hsl(160, 84%, 39%)', borderRadius: '12px 12px 0 0', padding: '24px 20px', marginBottom: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: 'hsl(160, 84%, 39%)', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }
