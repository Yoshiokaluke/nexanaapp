import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface InvitationEmailProps {
  organizationName: string;
  inviteUrl: string;
  role: string;
}

export const InvitationEmail = ({
  organizationName,
  inviteUrl,
  role,
}: InvitationEmailProps) => {
  const previewText = `${organizationName}に招待されました`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{organizationName}への招待</Heading>
          <Text style={text}>
            {organizationName}の{role === 'admin' ? '管理者' : 'メンバー'}として招待されました。
          </Text>
          <Text style={text}>
            以下のリンクをクリックして、組織に参加してください。
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={inviteUrl}>
              組織に参加する
            </Button>
          </Section>
          <Text style={text}>
            このリンクは3ヶ月間有効です。
          </Text>
          <Text style={footer}>
            ※このメールに心当たりがない場合は、無視していただいて構いません。
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '48px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#5850ec',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
};

export default InvitationEmail; 