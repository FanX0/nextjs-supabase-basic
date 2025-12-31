import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ProjectCreatedEmailProps {
  userFirstname: string;
  projectName: string;
  projectId: string;
}

export const ProjectCreatedEmail = ({
  userFirstname,
  projectName,
  projectId,
}: ProjectCreatedEmailProps) => {
  const previewText = `Your new project "${projectName}" is ready!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Project Created Successfully!
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userFirstname},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              You have successfully created a new project linked to your
              account.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Text className="text-lg font-bold text-indigo-600">
                {projectName}
              </Text>
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${projectId}`}
              >
                View Project
              </Button>
            </Section>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              If you did not create this project, please verify your account
              settings.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ProjectCreatedEmail;
