import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface InvoiceEmailProps {
  userEmail: string;
  invoiceId: string;
  invoiceUrl: string;
  amount: string;
  date: string;
}

export const InvoiceEmail = ({
  userEmail,
  invoiceId,
  invoiceUrl,
  amount,
  date,
}: InvoiceEmailProps) => {
  const previewText = `Invoice ${invoiceId} for ${amount}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Payment Receipt
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userEmail},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              This is a receipt for your recent payment of{" "}
              <strong>{amount}</strong> on {date}.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-indigo-600 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={invoiceUrl}
              >
                Download Invoice
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              Invoice ID: {invoiceId}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InvoiceEmail;
