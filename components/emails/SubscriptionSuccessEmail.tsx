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

interface SubscriptionSuccessEmailProps {
  userEmail: string;
  planName: string;
  price: string;
}

export const SubscriptionSuccessEmail = ({
  userEmail,
  planName = "Pro Plan",
  price = "$19/month",
}: SubscriptionSuccessEmailProps) => {
  const previewText = `Welcome to ${planName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Welcome to the Pro Club! 🚀
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userEmail},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Thank you for upgrading to the <strong>{planName}</strong>. You
              now have access to unlimited projects, advanced analytics, and
              priority support.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Text className="text-lg font-bold text-indigo-600">{price}</Text>
              <Button
                className="bg-indigo-600 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
              >
                Go to Dashboard
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If you have any questions or need help getting started, just reply
              to this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SubscriptionSuccessEmail;
