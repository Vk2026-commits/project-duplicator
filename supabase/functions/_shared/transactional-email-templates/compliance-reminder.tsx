import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "The Fellows Investment Group"

interface ComplianceReminderProps {
  name?: string
  unsignedAgreements?: string[]
}

const ComplianceReminderEmail = ({ name, unsignedAgreements = [] }: ComplianceReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Action Required: Please sign your pending agreements — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>
            Action Required
          </Heading>
        </Section>

        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'}
        </Text>

        <Text style={text}>
          This is a friendly reminder that you have <strong>unsigned agreements</strong> that require your attention. All members of {SITE_NAME} must sign their agreements to remain in good standing.
        </Text>

        {unsignedAgreements.length > 0 && (
          <Section style={listSection}>
            <Text style={listLabel}>Pending agreements:</Text>
            {unsignedAgreements.map((agreement, i) => (
              <Text key={i} style={listItem}>• {agreement}</Text>
            ))}
          </Section>
        )}

        <Text style={text}>
          Please log in and complete your agreements at your earliest convenience. All agreements must be signed to maintain your membership and access to investment opportunities.
        </Text>

        <Section style={buttonSection}>
          <Button style={button} href="https://seed-path-portal.lovable.app/onboarding">
            Sign Agreements Now
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
  component: ComplianceReminderEmail,
  subject: 'Action Required: Please sign your pending agreements',
  displayName: 'Compliance Reminder',
  previewData: { name: 'John', unsignedAgreements: ['Operating Agreement', 'Onboarding Packet'] },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '580px', margin: '0 auto' }
const headerSection = { backgroundColor: 'hsl(217, 91%, 60%)', borderRadius: '12px 12px 0 0', padding: '24px 20px', marginBottom: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0', textAlign: 'center' as const }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const listSection = { backgroundColor: '#fef3c7', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const listLabel = { fontSize: '14px', fontWeight: '600' as const, color: '#92400e', margin: '0 0 8px' }
const listItem = { fontSize: '14px', color: '#92400e', margin: '0 0 4px', paddingLeft: '4px' }
const buttonSection = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: 'hsl(217, 91%, 60%)', color: '#ffffff', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }
